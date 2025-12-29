import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, loginSchema } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User {
      id: string;
      userId: string;
      firstName: string;
      lastName: string;
      role: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

// Hash PIN for secure storage
async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(pin, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Compare provided PIN with stored hash
export async function comparePin(supplied: string, stored: string): Promise<boolean> {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Generate unique User ID in TDXXXXXX format
export function generateUserId(): string {
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
  return `TD${randomPart}`;
}

// Setup authentication middleware
export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "weka-secret-key-development-only",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  // Login endpoint
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { phoneOrUserId, pin } = loginSchema.parse(req.body);

      // Find user by phone or userId
      const user = await storage.getUserByPhoneOrUserId(phoneOrUserId);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      // Verify PIN
      const isValidPin = await comparePin(pin, user.pin);
      if (!isValidPin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      // Return user data (without PIN)
      const { pin: _, ...userWithoutPin } = user;
      res.json(userWithoutPin);
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // Barcode login endpoint
  app.post("/api/login/barcode", async (req: Request, res: Response) => {
    try {
      const { barcodeData } = req.body;
      
      if (!barcodeData || typeof barcodeData !== 'string') {
        return res.status(400).json({ message: "Invalid barcode data" });
      }

      // Find user by barcode data (assuming barcode contains userId)
      // You can modify this logic based on your barcode format
      const user = await storage.getUserByBarcodeData(barcodeData);
      if (!user) {
        return res.status(401).json({ message: "Invalid barcode or user not found" });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({ message: "Account is deactivated" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;

      // Return user data (without PIN)
      const { pin: _, ...userWithoutPin } = user;
      res.json(userWithoutPin);
    } catch (error) {
      console.error("Barcode login error:", error);
      res.status(400).json({ message: "Barcode login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint - handles both staff and member sessions
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const session = req.session as any;
    
    console.log('Auth check - session:', { 
      sessionId: req.sessionID,
      userId: session.userId, 
      memberId: session.memberId,
      userRole: session.userRole,
      sessionKeys: Object.keys(session || {})
    });
    
    try {
      // Handle staff authentication
      if (session.userId) {
        const user = await storage.getUser(session.userId);
        if (!user || !user.isActive) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        // Return staff user data (without PIN)
        const { pin: _, ...userWithoutPin } = user;
        res.json({ userType: 'staff', user: userWithoutPin });
        return;
      }
      
      // Handle member authentication - but only if no userId is present (corrupted session check)
      if (session.memberId && session.userRole === 'member' && !session.userId) {
        const member = await storage.getMember(session.memberId);
        if (!member || !member.isActive) {
          return res.status(401).json({ message: "Unauthorized" });
        }
        // Return member data (without PIN)
        const { pin: _, ...memberWithoutPin } = member;
        res.json({ userType: 'member', member: memberWithoutPin });
        return;
      }
      
      // Handle corrupted sessions - clear them
      if (session.memberId && session.userId && session.userRole === 'member') {
        console.log('Clearing corrupted member session with both userId and memberId');
        req.session.destroy((err) => {
          if (err) console.error('Session destroy error:', err);
        });
        return res.status(401).json({ message: "Session corrupted - cleared" });
      }
      
      console.log('No valid session found - unauthorized');
      return res.status(401).json({ message: "Unauthorized" });
      
    } catch (error) {
      console.error("Auth user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });
}

// Authentication middleware - handles both staff and member authentication
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  // Check for staff authentication (userId-based)
  if (session.userId) {
    (req as any).userId = session.userId;
    (req as any).userRole = session.userRole;
    return next();
  }
  
  // Check for member authentication (memberId-based)
  if (session.memberId && session.userRole === 'member') {
    (req as any).memberId = session.memberId;
    (req as any).userRole = session.userRole;
    return next();
  }

  return res.status(401).json({ message: "Unauthorized" });
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    next();
  };
}

// Middleware to check if member's group is still active
export function requireActiveGroup(storage: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).userRole;
    const memberId = (req as any).memberId;
    
    // Only apply this check to members, not staff
    if (userRole === 'member' && memberId) {
      try {
        const member = await storage.getMember(memberId);
        if (!member) {
          return res.status(401).json({ message: "Member not found" });
        }
        
        const group = await storage.getGroup(member.groupId);
        if (!group || !group.isActive) {
          // Clear the session for deactivated group members
          req.session.destroy((err) => {
            if (err) console.error('Session destroy error:', err);
          });
          return res.status(403).json({ 
            message: "Access denied. Your group has been deactivated. Please contact your administrator." 
          });
        }
      } catch (error) {
        console.error("Error checking group status:", error);
        return res.status(500).json({ message: "Error validating group access" });
      }
    }
    
    next();
  };
}

// Hash PIN utility for user creation
export { hashPin };
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, requireRole } from "./auth";
import { 
  insertGroupSchema, 
  insertMemberSchema, 
  insertTransactionSchema, 
  insertLoanSchema,
  insertMeetingSchema,
  insertUserSchema,
  insertCashboxSchema
} from "@shared/schema";
import { generateUserId, hashPin, comparePin } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Initialize system with demo admin user
  app.post('/api/initialize', async (req, res) => {
    try {
      // Check if any admin users exist
      const users = await storage.getUsers();
      const hasAdmin = users.some(user => user.role === 'admin');
      
      if (hasAdmin) {
        return res.status(400).json({ message: 'System already initialized' });
      }
      
      // Create demo admin user
      const adminUser = {
        userId: generateUserId(),
        firstName: 'System',
        lastName: 'Administrator',
        phone: '+1234567890',
        email: 'admin@weka.com',
        pin: await hashPin('123456'),
        role: 'admin' as const,
        isActive: true,
        location: 'Main Office',
      };
      
      const user = await storage.createUser(adminUser);
      const { pin, ...safeUser } = user;
      
      res.json({ 
        message: 'System initialized successfully',
        adminUser: safeUser,
        credentials: {
          userId: user.userId,
          phone: user.phone,
          pin: '123456' // Only show during initialization
        }
      });
    } catch (error) {
      console.error('Initialization error:', error);
      res.status(500).json({ message: 'Failed to initialize system' });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', isAuthenticated, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove PIN from response for security
      const safeUsers = users.map((user) => {
        const { pin, ...safeUser } = user;
        return safeUser;
      });
      res.json(safeUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/users', isAuthenticated, requireRole(['admin']), async (req: any, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Generate User ID if not provided
      if (!userData.userId) {
        userData.userId = generateUserId();
      }
      
      // Hash the PIN
      userData.pin = await hashPin(userData.pin);
      
      // Set assigned by
      (userData as any).assignedBy = req.userId;
      
      const user = await storage.createUser(userData);
      
      // Remove PIN from response
      const { pin, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data", errors: error.errors });
      } else {
        console.error("Error creating user:", error);
        res.status(500).json({ message: "Failed to create user" });
      }
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Group-specific statistics for members
  app.get('/api/groups/:id/stats', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const stats = await storage.getGroupStats(id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching group stats:", error);
      res.status(500).json({ message: "Failed to fetch group stats" });
    }
  });

  // Update member shares
  app.patch('/api/members/:id/shares', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { shares } = req.body;
      
      if (typeof shares !== 'number' || shares < 0) {
        return res.status(400).json({ message: "Invalid shares value" });
      }
      
      await storage.updateMemberShares(id, shares);
      const updatedMember = await storage.getMember(id);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member shares:", error);
      res.status(500).json({ message: "Failed to update member shares" });
    }
  });

  // Unified authentication endpoints
  app.post('/api/auth/member-login', async (req, res) => {
    try {
      const { phone, pin } = req.body;
      
      if (!phone || !pin) {
        return res.status(400).json({ message: "Phone and PIN are required" });
      }
      
      const member = await storage.getMemberByPhone(phone);
      if (!member) {
        return res.status(401).json({ message: "Invalid phone number or PIN" });
      }
      
      // Simple PIN verification (in production, use proper hashing)
      if (member.pin !== pin) {
        return res.status(401).json({ message: "Invalid phone number or PIN" });
      }
      
      // Set session for member authentication
      (req.session as any).memberId = member.id;
      (req.session as any).userRole = 'member';
      
      // Get group stats for the member
      const groupStats = await storage.getGroupStats(member.groupId);
      
      res.json({
        userType: 'member',
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          groupRole: member.groupRole,
          groupId: member.groupId,
          totalShares: member.totalShares,
          savingsBalance: member.savingsBalance,
          welfareBalance: member.welfareBalance,
          currentLoan: member.currentLoan
        },
        groupStats
      });
    } catch (error) {
      console.error("Error during member login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Staff login endpoint
  app.post('/api/auth/staff-login', async (req, res) => {
    try {
      const { userId, phone, pin, barcode } = req.body;
      
      console.log('Staff login attempt:', { userId, phone, pin: pin ? '[PROVIDED]' : '[MISSING]' });
      
      // Check if at least one identifier is provided along with PIN
      if ((!userId && !phone) || !pin) {
        console.log('Missing required fields');
        return res.status(400).json({ message: "Either User ID or phone number is required, along with PIN" });
      }
      
      let user;
      
      // Try to find user by userId or phone separately
      if (userId) {
        console.log('Looking up user by userId:', userId);
        user = await storage.getUserByPhoneOrUserId(userId);
      } else if (phone) {
        console.log('Looking up user by phone:', phone);
        user = await storage.getUserByPhoneOrUserId(phone);
      }
      
      if (!user) {
        console.log('User not found');
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log('User found:', { 
        id: user.id, 
        userId: user.userId, 
        phone: user.phone, 
        role: user.role,
        isActive: user.isActive 
      });
      
      // Check if user is active
      if (!user.isActive) {
        console.log('User account is deactivated');
        return res.status(401).json({ message: "Account is deactivated" });
      }
      
      // Verify PIN using proper hashing verification
      console.log('Verifying PIN...');
      const isValidPin = await comparePin(pin, user.pin);
      console.log('PIN verification result:', isValidPin);
      
      if (!isValidPin) {
        console.log('PIN verification failed');
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });
      
      // Set session for authentication (same as original /api/login)
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      
      console.log('Session set:', { userId: user.id, userRole: user.role });
      
      // Save session explicitly
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            reject(err);
          } else {
            console.log('Session saved successfully');
            resolve();
          }
        });
      });
      
      res.json({
        userType: 'staff',
        user: {
          id: user.id,
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          location: user.location,
          phone: user.phone,
          email: user.email
        }
      });
    } catch (error) {
      console.error("Error during staff login:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Get member dashboard info
  app.get('/api/members/:id/dashboard', async (req, res) => {
    try {
      const { id } = req.params;
      const member = await storage.getMember(id);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const groupStats = await storage.getGroupStats(member.groupId);
      const group = await storage.getGroup(member.groupId);
      
      res.json({
        member,
        group,
        groupStats
      });
    } catch (error) {
      console.error("Error fetching member dashboard:", error);
      res.status(500).json({ message: "Failed to fetch member dashboard" });
    }
  });

  // Group routes
  app.get('/api/groups', isAuthenticated, async (req, res) => {
    try {
      const groups = await storage.getGroups();
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });

  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const groupData = insertGroupSchema.parse({
        ...req.body,
        createdBy: req.userId
      });
      const group = await storage.createGroup(groupData);
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid group data", errors: error.errors });
      } else {
        console.error("Error creating group:", error);
        res.status(500).json({ message: "Failed to create group" });
      }
    }
  });

  app.get('/api/groups/:id', isAuthenticated, async (req, res) => {
    try {
      const group = await storage.getGroup(req.params.id);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.put('/api/groups/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertGroupSchema.partial().parse(req.body);
      const group = await storage.updateGroup(req.params.id, updates);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json(group);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid group data", errors: error.errors });
      } else {
        console.error("Error updating group:", error);
        res.status(500).json({ message: "Failed to update group" });
      }
    }
  });

  app.delete('/api/groups/:id', isAuthenticated, async (req, res) => {
    try {
      const success = await storage.deleteGroup(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Group not found" });
      }
      res.json({ message: "Group deleted successfully" });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ message: "Failed to delete group" });
    }
  });

  // Member routes
  app.get('/api/members', isAuthenticated, async (req, res) => {
    try {
      const groupId = req.query.groupId as string;
      const members = await storage.getMembers(groupId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post('/api/members', isAuthenticated, async (req, res) => {
    try {
      const memberData = insertMemberSchema.parse(req.body);
      const member = await storage.createMember(memberData);
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid member data", errors: error.errors });
      } else {
        console.error("Error creating member:", error);
        res.status(500).json({ message: "Failed to create member" });
      }
    }
  });

  app.get('/api/members/:id', isAuthenticated, async (req, res) => {
    try {
      const member = await storage.getMember(req.params.id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ message: "Failed to fetch member" });
    }
  });

  app.put('/api/members/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertMemberSchema.partial().parse(req.body);
      const member = await storage.updateMember(req.params.id, updates);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      res.json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid member data", errors: error.errors });
      } else {
        console.error("Error updating member:", error);
        res.status(500).json({ message: "Failed to update member" });
      }
    }
  });

  // Transaction routes
  app.get('/api/transactions', isAuthenticated, async (req, res) => {
    try {
      const groupId = req.query.groupId as string;
      const memberId = req.query.memberId as string;
      const transactions = await storage.getTransactions(groupId, memberId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post('/api/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        createdBy: req.userId
      });
      const transaction = await storage.createTransaction(transactionData);
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        console.error("Error creating transaction:", error);
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  // Loan routes
  app.get('/api/loans', isAuthenticated, async (req, res) => {
    try {
      const groupId = req.query.groupId as string;
      const memberId = req.query.memberId as string;
      const loans = await storage.getLoans(groupId, memberId);
      res.json(loans);
    } catch (error) {
      console.error("Error fetching loans:", error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.post('/api/loans', isAuthenticated, async (req, res) => {
    try {
      const loanData = insertLoanSchema.parse(req.body);
      const loan = await storage.createLoan(loanData);
      res.json(loan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid loan data", errors: error.errors });
      } else {
        console.error("Error creating loan:", error);
        res.status(500).json({ message: "Failed to create loan" });
      }
    }
  });

  app.put('/api/loans/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updates = {
        ...req.body,
        approvedBy: req.userId
      };
      const loan = await storage.updateLoan(req.params.id, updates);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.json(loan);
    } catch (error) {
      console.error("Error updating loan:", error);
      res.status(500).json({ message: "Failed to update loan" });
    }
  });

  // Meeting routes
  app.get('/api/meetings', isAuthenticated, async (req, res) => {
    try {
      const groupId = req.query.groupId as string;
      const meetings = await storage.getMeetings(groupId);
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.post('/api/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const meetingData = insertMeetingSchema.parse({
        ...req.body,
        createdBy: req.userId
      });
      const meeting = await storage.createMeeting(meetingData);
      res.json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid meeting data", errors: error.errors });
      } else {
        console.error("Error creating meeting:", error);
        res.status(500).json({ message: "Failed to create meeting" });
      }
    }
  });

  app.put('/api/meetings/:id', isAuthenticated, async (req, res) => {
    try {
      const updates = insertMeetingSchema.partial().parse(req.body);
      const meeting = await storage.updateMeeting(req.params.id, updates);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      res.json(meeting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid meeting data", errors: error.errors });
      } else {
        console.error("Error updating meeting:", error);
        res.status(500).json({ message: "Failed to update meeting" });
      }
    }
  });

  // Reporting endpoints
  app.get("/api/reports/:type", isAuthenticated, async (req, res) => {
    try {
      const { type } = req.params;
      const { groupId, location, gender, dateFrom, dateTo } = req.query;
      
      let reportData = [];
      
      switch (type) {
        case 'groups':
          reportData = await storage.getGroupReport(
            groupId !== 'all' ? groupId as string : undefined,
            location as string || undefined,
            dateFrom ? new Date(dateFrom as string) : undefined,
            dateTo ? new Date(dateTo as string) : undefined
          );
          break;
        case 'members':
          reportData = await storage.getMemberReport(
            groupId !== 'all' ? groupId as string : undefined,
            gender !== 'all' ? gender as string : undefined,
            dateFrom ? new Date(dateFrom as string) : undefined,
            dateTo ? new Date(dateTo as string) : undefined
          );
          break;
        case 'financial':
          reportData = await storage.getFinancialReport(
            groupId !== 'all' ? groupId as string : undefined,
            dateFrom ? new Date(dateFrom as string) : undefined,
            dateTo ? new Date(dateTo as string) : undefined
          );
          break;
        default:
          return res.status(400).json({ error: "Invalid report type" });
      }
      
      res.json(reportData);
    } catch (error) {
      console.error("Error fetching report data:", error);
      res.status(500).json({ error: "Failed to fetch report data" });
    }
  });

  // Cashbox endpoints
  app.post("/api/cashbox", isAuthenticated, async (req: any, res) => {
    try {
      const validatedData = insertCashboxSchema.parse({
        ...req.body,
        recordedBy: req.userId
      });
      const entry = await storage.createCashboxEntry(validatedData);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Error creating cashbox entry:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create cashbox entry" });
      }
    }
  });

  app.get("/api/cashbox/:groupId", isAuthenticated, async (req, res) => {
    try {
      const { groupId } = req.params;
      const entries = await storage.getCashboxEntries(groupId);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching cashbox entries:", error);
      res.status(500).json({ error: "Failed to fetch cashbox entries" });
    }
  });

  app.get("/api/cashbox/:groupId/balance", isAuthenticated, async (req, res) => {
    try {
      const { groupId } = req.params;
      const balance = await storage.getCashboxBalance(groupId);
      res.json({ balance });
    } catch (error) {
      console.error("Error fetching cashbox balance:", error);
      res.status(500).json({ error: "Failed to fetch cashbox balance" });
    }
  });

  // Enhanced Transaction Endpoints for Member Dashboard
  
  // Submit savings and welfare by leadership roles
  app.post('/api/transactions/submit-savings', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId, memberId, savingsAmount, welfareAmount, submittedBy } = req.body;
      
      if (!groupId || !memberId || savingsAmount < 0 || welfareAmount < 0) {
        return res.status(400).json({ message: "Invalid submission data" });
      }

      // Create savings transaction
      if (savingsAmount > 0) {
        await storage.createTransaction({
          groupId,
          memberId,
          type: 'deposit',
          amount: savingsAmount.toString(),
          description: `Savings deposit submitted by ${submittedBy}`,
          createdBy: req.userId || memberId
        });
        
        // Update member's savings balance
        const member = await storage.getMember(memberId);
        if (member) {
          await storage.updateMember(memberId, {
            savingsBalance: (parseFloat(member.savingsBalance) + savingsAmount).toString(),
            totalShares: member.totalShares + Math.floor(savingsAmount / 1000) // Assuming 1000 UGX per share
          });
        }
      }

      // Create welfare transaction
      if (welfareAmount > 0) {
        await storage.createTransaction({
          groupId,
          memberId,
          type: 'welfare_payment',
          amount: welfareAmount.toString(),
          description: `Welfare payment submitted by ${submittedBy}`,
          createdBy: req.userId || memberId
        });

        // Update member's welfare balance
        const member = await storage.getMember(memberId);
        if (member) {
          await storage.updateMember(memberId, {
            welfareBalance: (parseFloat(member.welfareBalance) + welfareAmount).toString()
          });
        }
      }

      // Update cash in box
      if (savingsAmount > 0 || welfareAmount > 0) {
        await storage.createCashboxEntry({
          groupId,
          amount: (savingsAmount + welfareAmount).toString(),
          transactionType: 'deposit',
          description: `Savings and welfare deposits submitted by ${submittedBy}`,
          recordedBy: req.userId || memberId
        });
      }

      res.json({ message: "Savings and welfare submitted successfully" });
    } catch (error) {
      console.error("Error submitting savings:", error);
      res.status(500).json({ message: "Failed to submit savings and welfare" });
    }
  });

  // Process loan payment by leadership roles
  app.post('/api/transactions/loan-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId, memberId, amount, processedBy } = req.body;
      
      if (!groupId || !memberId || amount <= 0) {
        return res.status(400).json({ message: "Invalid payment data" });
      }

      const member = await storage.getMember(memberId);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      const currentLoan = parseFloat(member.currentLoan);
      if (currentLoan <= 0) {
        return res.status(400).json({ message: "Member has no outstanding loan" });
      }

      const paymentAmount = Math.min(amount, currentLoan);
      const newLoanBalance = currentLoan - paymentAmount;

      // Create loan payment transaction
      await storage.createTransaction({
        groupId,
        memberId,
        type: 'loan_payment',
        amount: paymentAmount.toString(),
        description: `Loan payment processed by ${processedBy}`,
        createdBy: req.userId || memberId
      });

      // Update member's loan balance
      await storage.updateMember(memberId, {
        currentLoan: newLoanBalance.toString()
      });

      // Add to cash in box
      await storage.createCashboxEntry({
        groupId,
        amount: paymentAmount.toString(),
        transactionType: 'deposit',
        description: `Loan payment from ${member.firstName} ${member.lastName}`,
        recordedBy: req.userId || memberId
      });

      res.json({ 
        message: "Loan payment processed successfully",
        remainingBalance: newLoanBalance,
        paymentAmount: paymentAmount
      });
    } catch (error) {
      console.error("Error processing loan payment:", error);
      res.status(500).json({ message: "Failed to process loan payment" });
    }
  });

  // Get members with active loans for a group
  app.get('/api/groups/:id/members-with-loans', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const members = await storage.getGroupMembers(id);
      const membersWithLoans = members.filter(member => parseFloat(member.currentLoan) > 0);
      res.json(membersWithLoans);
    } catch (error) {
      console.error("Error fetching members with loans:", error);
      res.status(500).json({ message: "Failed to fetch members with loans" });
    }
  });

  // Get transaction history for a group (leadership view)
  app.get('/api/groups/:id/transaction-history', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const transactions = await storage.getGroupTransactions(id);
      
      // Enrich with member names
      const enrichedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          const member = await storage.getMember(transaction.memberId);
          return {
            ...transaction,
            memberName: member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'
          };
        })
      );

      res.json(enrichedTransactions);
    } catch (error) {
      console.error("Error fetching group transaction history:", error);
      res.status(500).json({ message: "Failed to fetch transaction history" });
    }
  });

  // Get transaction history for a specific member
  app.get('/api/members/:id/transaction-history', async (req, res) => {
    try {
      const { id } = req.params;
      const transactions = await storage.getMemberTransactions(id);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching member transaction history:", error);
      res.status(500).json({ message: "Failed to fetch member transaction history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

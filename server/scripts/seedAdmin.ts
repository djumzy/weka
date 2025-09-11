import 'dotenv/config';
import { storage } from "../storage";
import { hashPin } from "../auth";
import { type InsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

async function main() {
  const adminPhone = "0787007542";
  const adminPinPlain = "080319";

  // Check if an admin with this phone already exists
  const existing = await storage.getUserByPhoneOrUserId(adminPhone);
  if (existing) {
    console.log("Admin user already exists:", { id: existing.id, userId: existing.userId, phone: existing.phone });
    return;
  }

  const hashed = await hashPin(adminPinPlain);

  const adminUser: InsertUser & { id: string } = {
    id: randomUUID(),
    userId: "TD000001",
    firstName: "admin",
    lastName: "user",
    phone: adminPhone,
    email: undefined as any,
    pin: hashed,
    role: "admin",
    isActive: true,
    location: "Main Office",
  };

  const created = await storage.createUser(adminUser);
  const { pin, ...safe } = created as any;
  console.log("Created admin user:", safe);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});



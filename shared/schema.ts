import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for WEKA authentication system
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id", { length: 8 }).unique().notNull(), // TDXXXXXX format
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  phone: varchar("phone", { length: 20 }).unique().notNull(),
  email: varchar("email"),
  pin: varchar("pin", { length: 255 }).notNull(), // Hashed PIN
  role: varchar("role", { length: 20 }).notNull().default('field_attendant'), // admin, field_monitor, field_attendant
  isActive: boolean("is_active").notNull().default(true),
  location: varchar("location"),
  assignedBy: varchar("assigned_by").references(() => users.id), // Who created this user
  assignedGroups: text("assigned_groups").array(), // For field_monitor - groups they can access
  profileImageUrl: varchar("profile_image_url"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WEKA Groups with enhanced features
export const groups = pgTable("groups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 100 }),
  meetingFrequency: varchar("meeting_frequency", { length: 20 }).notNull().default('monthly'),
  maxMembers: integer("max_members").notNull().default(30),
  savingPerShare: decimal("saving_per_share", { precision: 12, scale: 2 }).notNull().default('0.00'),
  cycleMonths: integer("cycle_months").notNull().default(12), // Number of months per cycle
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull().default('2.00'), // Group's loan interest rate
  welfareAmount: decimal("welfare_amount", { precision: 12, scale: 2 }).notNull().default('0.00'), // Agreed welfare amount per member
  mainActivity: text("main_activity"),
  otherActivities: text("other_activities"),
  registrationDate: date("registration_date").notNull(),
  hasRunningBusiness: boolean("has_running_business").notNull().default(false),
  businessName: varchar("business_name", { length: 255 }),
  businessLocation: varchar("business_location", { length: 255 }),
  currentInput: text("current_input"), // Funds, manpower, services etc
  availableCash: decimal("available_cash", { precision: 12, scale: 2 }).notNull().default('0.00'),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Group Members with gender tracking and group roles
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  gender: varchar("gender", { length: 10 }).notNull(), // M or F
  groupRole: varchar("group_role", { length: 20 }).notNull().default('member'), // ONLY: member, secretary, finance, chairman
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  joinDate: date("join_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  totalShares: integer("total_shares").notNull().default(0), // Number of shares owned
  savingsBalance: decimal("savings_balance", { precision: 12, scale: 2 }).notNull().default('0.00'), // Calculated from shares × share value
  welfareBalance: decimal("welfare_balance", { precision: 12, scale: 2 }).notNull().default('0.00'),
  nextOfKin: varchar("next_of_kin", { length: 255 }),
  pin: varchar("pin", { length: 4 }).notNull(),
  currentLoan: decimal("current_loan", { precision: 12, scale: 2 }).notNull().default('0.00'),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id),
  memberId: varchar("member_id").notNull().references(() => members.id),
  type: varchar("type", { length: 20 }).notNull(), // deposit, withdrawal, loan_payment, loan_disbursement, welfare_payment
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  transactionDate: timestamp("transaction_date").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id), // Tracks who processed this transaction
  createdAt: timestamp("created_at").defaultNow(),
});

// Loans with compound interest tracking
export const loans = pgTable("loans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id),
  memberId: varchar("member_id").notNull().references(() => members.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // Original borrowed amount
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(), // percentage per month
  termMonths: integer("term_months").notNull(),
  status: varchar("status", { length: 20 }).notNull().default('pending'), // pending, approved, active, completed, defaulted
  applicationDate: timestamp("application_date").notNull().defaultNow(),
  approvalDate: timestamp("approval_date"),
  disbursementDate: timestamp("disbursement_date"),
  dueDate: timestamp("due_date"),
  remainingBalance: decimal("remaining_balance", { precision: 12, scale: 2 }), // Current balance with compound interest
  totalAmountDue: decimal("total_amount_due", { precision: 12, scale: 2 }), // Total amount with all compound interest
  monthsOverdue: integer("months_overdue").notNull().default(0), // Track months past due
  lastInterestUpdate: timestamp("last_interest_update"), // When interest was last compounded
  purpose: text("purpose"),
  approvedBy: varchar("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meetings
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id),
  date: timestamp("date").notNull(),
  location: varchar("location", { length: 255 }),
  agenda: text("agenda"),
  minutes: text("minutes"),
  attendees: text("attendees").array(), // Array of member IDs who attended
  status: varchar("status", { length: 20 }).notNull().default('scheduled'), // scheduled, completed, cancelled
  notificationSent24h: boolean("notification_sent_24h").notNull().default(false), // 24 hour reminder sent
  notificationSentNow: boolean("notification_sent_now").notNull().default(false), // Meeting time notification sent
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Meeting Attendance with payments
export const meetingAttendance = pgTable("meeting_attendance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  meetingId: varchar("meeting_id").notNull().references(() => meetings.id),
  memberId: varchar("member_id").notNull().references(() => members.id),
  isPresent: boolean("is_present").notNull().default(false),
  sharesPurchased: integer("shares_purchased").notNull().default(0), // Shares bought this meeting
  welfarePayment: decimal("welfare_payment", { precision: 12, scale: 2 }).notNull().default('0.00'),
  loanPayment: decimal("loan_payment", { precision: 12, scale: 2 }).notNull().default('0.00'),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

// Cash box tracking
export const cashbox = pgTable("cashbox", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: varchar("group_id").notNull().references(() => groups.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  transactionType: varchar("transaction_type", { length: 20 }).notNull(), // deposit, withdrawal
  description: text("description"),
  recordedBy: varchar("recorded_by").notNull().references(() => users.id), // Tracks who recorded this entry
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  assignedBy: one(users, {
    fields: [users.assignedBy],
    references: [users.id],
  }),
  assignedUsers: many(users),
  createdGroups: many(groups),
  createdTransactions: many(transactions),
  approvedLoans: many(loans),
  createdMeetings: many(meetings),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.createdBy],
    references: [users.id],
  }),
  members: many(members),
  transactions: many(transactions),
  loans: many(loans),
  meetings: many(meetings),
  cashboxEntries: many(cashbox),
}));

export const cashboxRelations = relations(cashbox, ({ one }) => ({
  group: one(groups, {
    fields: [cashbox.groupId],
    references: [groups.id],
  }),
  recordedBy: one(users, {
    fields: [cashbox.recordedBy],
    references: [users.id],
  }),
}));

export const membersRelations = relations(members, ({ one, many }) => ({
  group: one(groups, {
    fields: [members.groupId],
    references: [groups.id],
  }),
  transactions: many(transactions),
  loans: many(loans),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  group: one(groups, {
    fields: [transactions.groupId],
    references: [groups.id],
  }),
  member: one(members, {
    fields: [transactions.memberId],
    references: [members.id],
  }),
  createdBy: one(users, {
    fields: [transactions.createdBy],
    references: [users.id],
  }),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  group: one(groups, {
    fields: [loans.groupId],
    references: [groups.id],
  }),
  member: one(members, {
    fields: [loans.memberId],
    references: [members.id],
  }),
  approvedBy: one(users, {
    fields: [loans.approvedBy],
    references: [users.id],
  }),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  group: one(groups, {
    fields: [meetings.groupId],
    references: [groups.id],
  }),
  createdBy: one(users, {
    fields: [meetings.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  availableCash: true,
});

export const insertCashboxSchema = createInsertSchema(cashbox).omit({
  id: true,
  recordedAt: true,
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  nextOfKin: z.string().optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  applicationDate: true, // Has default value
  approvalDate: true,
  disbursementDate: true,
  dueDate: true,
  remainingBalance: true,
  totalAmountDue: true,
  monthsOverdue: true,
  lastInterestUpdate: true,
  approvedBy: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Insert schemas for new user system
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLogin: true,
});

// Login schema
export const loginSchema = z.object({
  phoneOrUserId: z.string().min(1, "Phone number or User ID is required"),
  pin: z.string().length(6, "PIN must be 6 digits"),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Member = typeof members.$inferSelect;
export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type Meeting = typeof meetings.$inferSelect;
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Cashbox = typeof cashbox.$inferSelect;
export type InsertCashbox = z.infer<typeof insertCashboxSchema>;

import {
  users,
  groups,
  members,
  transactions,
  loans,
  meetings,
  cashbox,
  type User,
  type UpsertUser,
  type InsertUser,
  type Group,
  type InsertGroup,
  type Member,
  type InsertMember,
  type Transaction,
  type InsertTransaction,
  type Loan,
  type InsertLoan,
  type Meeting,
  type InsertMeeting,
  type Cashbox,
  type InsertCashbox,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sum, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByPhoneOrUserId(phoneOrUserId: string): Promise<User | undefined>;
  getUserByBarcodeData(barcodeData: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Group operations
  createGroup(group: InsertGroup): Promise<Group>;
  getGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<boolean>;

  // Member operations
  createMember(member: InsertMember): Promise<Member>;
  getMembers(groupId?: string): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  updateMember(id: string, updates: Partial<InsertMember>): Promise<Member | undefined>;
  deleteMember(id: string): Promise<boolean>;

  // Transaction operations
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactions(groupId?: string, memberId?: string): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;

  // Loan operations
  createLoan(loan: InsertLoan): Promise<Loan>;
  getLoans(groupId?: string, memberId?: string): Promise<Loan[]>;
  getLoan(id: string): Promise<Loan | undefined>;
  updateLoan(id: string, updates: Partial<Loan>): Promise<Loan | undefined>;

  // Meeting operations
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  getMeetings(groupId?: string): Promise<Meeting[]>;
  getMeeting(id: string): Promise<Meeting | undefined>;
  updateMeeting(id: string, updates: Partial<InsertMeeting>): Promise<Meeting | undefined>;

  // Cashbox operations
  createCashboxEntry(entry: InsertCashbox): Promise<Cashbox>;
  getCashboxBalance(groupId: string): Promise<number>;
  getCashboxEntries(groupId: string): Promise<Cashbox[]>;

  // Dashboard statistics
  getDashboardStats(): Promise<{
    totalGroups: number;
    totalMembers: number;
    maleMembers: number;
    femaleMembers: number;
    totalSavings: number;
    totalCashInBox: number;
    activeLoans: number;
    totalLoansGiven: number;
    totalInterest: number;
  }>;

  // Reporting
  getGroupReport(groupId?: string, location?: string, dateFrom?: Date, dateTo?: Date): Promise<any[]>;
  getMemberReport(groupId?: string, gender?: string, dateFrom?: Date, dateTo?: Date): Promise<any[]>;
  getFinancialReport(groupId?: string, dateFrom?: Date, dateTo?: Date): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByPhoneOrUserId(phoneOrUserId: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(
        phoneOrUserId.startsWith('TD') 
          ? eq(users.userId, phoneOrUserId)
          : eq(users.phone, phoneOrUserId)
      );
    return user;
  }

  async getUserByBarcodeData(barcodeData: string): Promise<User | undefined> {
    // Assuming barcode contains userId - you can modify this logic based on your barcode format
    // The barcode could contain userId, phone, or other identifier
    const [user] = await db
      .select()
      .from(users)
      .where(
        barcodeData.startsWith('TD') 
          ? eq(users.userId, barcodeData)
          : eq(users.phone, barcodeData)
      );
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Group operations
  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    return newGroup;
  }

  async getGroups(): Promise<Group[]> {
    return await db.select().from(groups).orderBy(desc(groups.createdAt));
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async updateGroup(id: string, updates: Partial<InsertGroup>): Promise<Group | undefined> {
    const [updatedGroup] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteGroup(id: string): Promise<boolean> {
    const result = await db.delete(groups).where(eq(groups.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Member operations
  async createMember(member: InsertMember): Promise<Member> {
    const [newMember] = await db.insert(members).values(member).returning();
    return newMember;
  }

  async getMembers(groupId?: string): Promise<Member[]> {
    if (groupId) {
      return await db
        .select()
        .from(members)
        .where(eq(members.groupId, groupId))
        .orderBy(desc(members.createdAt));
    }
    return await db.select().from(members).orderBy(desc(members.createdAt));
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined> {
    const [updatedMember] = await db
      .update(members)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(members.id, id))
      .returning();
    return updatedMember;
  }

  async deleteMember(id: string): Promise<boolean> {
    const result = await db.delete(members).where(eq(members.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Transaction operations
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    
    // Update member's savings balance
    const member = await this.getMember(transaction.memberId);
    if (member) {
      let newBalance = parseFloat(member.savingsBalance);
      if (transaction.type === 'deposit') {
        newBalance += parseFloat(transaction.amount);
      } else if (transaction.type === 'withdrawal') {
        newBalance -= parseFloat(transaction.amount);
      }
      await this.updateMember(transaction.memberId, { savingsBalance: newBalance.toFixed(2) });
    }

    return newTransaction;
  }

  async getTransactions(groupId?: string, memberId?: string): Promise<Transaction[]> {
    if (groupId && memberId) {
      return await db
        .select()
        .from(transactions)
        .where(and(eq(transactions.groupId, groupId), eq(transactions.memberId, memberId)))
        .orderBy(desc(transactions.transactionDate));
    } else if (groupId) {
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.groupId, groupId))
        .orderBy(desc(transactions.transactionDate));
    } else if (memberId) {
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.memberId, memberId))
        .orderBy(desc(transactions.transactionDate));
    }
    
    return await db.select().from(transactions).orderBy(desc(transactions.transactionDate));
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  // Loan operations
  async createLoan(loan: InsertLoan): Promise<Loan> {
    const [newLoan] = await db.insert(loans).values({
      ...loan,
      remainingBalance: loan.amount,
    }).returning();
    return newLoan;
  }

  async getLoans(groupId?: string, memberId?: string): Promise<Loan[]> {
    if (groupId && memberId) {
      return await db
        .select()
        .from(loans)
        .where(and(eq(loans.groupId, groupId), eq(loans.memberId, memberId)))
        .orderBy(desc(loans.applicationDate));
    } else if (groupId) {
      return await db
        .select()
        .from(loans)
        .where(eq(loans.groupId, groupId))
        .orderBy(desc(loans.applicationDate));
    } else if (memberId) {
      return await db
        .select()
        .from(loans)
        .where(eq(loans.memberId, memberId))
        .orderBy(desc(loans.applicationDate));
    }
    
    return await db.select().from(loans).orderBy(desc(loans.applicationDate));
  }

  async getLoan(id: string): Promise<Loan | undefined> {
    const [loan] = await db.select().from(loans).where(eq(loans.id, id));
    return loan;
  }

  async updateLoan(id: string, updates: Partial<Loan>): Promise<Loan | undefined> {
    const [updatedLoan] = await db
      .update(loans)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loans.id, id))
      .returning();
    return updatedLoan;
  }

  // Meeting operations
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const [newMeeting] = await db.insert(meetings).values(meeting).returning();
    return newMeeting;
  }

  async getMeetings(groupId?: string): Promise<Meeting[]> {
    if (groupId) {
      return await db
        .select()
        .from(meetings)
        .where(eq(meetings.groupId, groupId))
        .orderBy(desc(meetings.date));
    }
    return await db.select().from(meetings).orderBy(desc(meetings.date));
  }

  async getMeeting(id: string): Promise<Meeting | undefined> {
    const [meeting] = await db.select().from(meetings).where(eq(meetings.id, id));
    return meeting;
  }

  async updateMeeting(id: string, updates: Partial<InsertMeeting>): Promise<Meeting | undefined> {
    const [updatedMeeting] = await db
      .update(meetings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(meetings.id, id))
      .returning();
    return updatedMeeting;
  }

  // Cashbox operations
  async createCashboxEntry(entry: InsertCashbox): Promise<Cashbox> {
    const [newEntry] = await db.insert(cashbox).values(entry).returning();
    
    // Update group's available cash
    const balance = await this.getCashboxBalance(entry.groupId);
    await this.updateGroup(entry.groupId, { availableCash: balance.toString() });
    
    return newEntry;
  }

  async getCashboxBalance(groupId: string): Promise<number> {
    const entries = await db.select().from(cashbox).where(eq(cashbox.groupId, groupId));
    return entries.reduce((balance, entry) => {
      const amount = parseFloat(entry.amount);
      return entry.transactionType === 'deposit' ? balance + amount : balance - amount;
    }, 0);
  }

  async getCashboxEntries(groupId: string): Promise<Cashbox[]> {
    return await db.select().from(cashbox)
      .where(eq(cashbox.groupId, groupId))
      .orderBy(desc(cashbox.recordedAt));
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalGroups: number;
    totalMembers: number;
    maleMembers: number;
    femaleMembers: number;
    totalSavings: number;
    totalCashInBox: number;
    activeLoans: number;
    totalLoansGiven: number;
    totalInterest: number;
  }> {
    const [groupCount] = await db.select({ count: count() }).from(groups).where(eq(groups.isActive, true));
    const [memberCount] = await db.select({ count: count() }).from(members).where(eq(members.isActive, true));
    const [maleCount] = await db.select({ count: count() }).from(members)
      .where(and(eq(members.isActive, true), eq(members.gender, 'M')));
    const [femaleCount] = await db.select({ count: count() }).from(members)
      .where(and(eq(members.isActive, true), eq(members.gender, 'F')));
    const [savingsSum] = await db.select({ sum: sum(members.savingsBalance) }).from(members)
      .where(eq(members.isActive, true));
    const [currentLoansSum] = await db.select({ sum: sum(members.currentLoan) }).from(members)
      .where(eq(members.isActive, true));
    // Calculate available cash in box: Total Savings - Total Loans Outstanding
    const totalSavingsValue = parseFloat(savingsSum.sum || '0');
    const totalCurrentLoans = parseFloat(currentLoansSum.sum || '0');
    const availableCashInBox = totalSavingsValue - totalCurrentLoans;

    const [loanCount] = await db.select({ count: count() }).from(loans)
      .where(eq(loans.status, 'active'));
    const allLoans = await db.select().from(loans);
    const totalLoansGiven = allLoans.reduce((total, loan) => total + parseFloat(loan.amount || '0'), 0);
    
    // Calculate total interest: Sum of interest amounts based on current loans and group rates
    const groupsWithLoans = await db.select({
      groupId: loans.groupId,
      loanAmount: loans.amount,
      interestRate: groups.interestRate
    }).from(loans)
    .innerJoin(groups, eq(loans.groupId, groups.id))
    .where(eq(loans.status, 'active'));
    
    const totalInterest = groupsWithLoans.reduce((total, item) => {
      const loanAmount = parseFloat(item.loanAmount || '0');
      const rate = parseFloat(item.interestRate || '0');
      return total + (loanAmount * rate / 100); // Calculate interest based on loan amount and group rate
    }, 0);

    return {
      totalGroups: groupCount.count,
      totalMembers: memberCount.count,
      maleMembers: maleCount.count,
      femaleMembers: femaleCount.count,
      totalSavings: totalSavingsValue,
      totalCashInBox: availableCashInBox, // Total Savings - Total Loans Outstanding
      activeLoans: loanCount.count,
      totalLoansGiven: totalCurrentLoans, // Use currentLoan from members
      totalInterest: totalInterest,
    };
  }

  // Reporting methods
  async getGroupReport(groupId?: string, location?: string, dateFrom?: Date, dateTo?: Date): Promise<any[]> {
    let query = db.select({
      id: groups.id,
      name: groups.name,
      location: groups.location,
      registrationNumber: groups.registrationNumber,
      memberCount: count(members.id),
      totalSavings: sum(members.savingsBalance),
      availableCash: groups.availableCash,
      cycleMonths: groups.cycleMonths,
      interestRate: groups.interestRate,
      registrationDate: groups.registrationDate,
    }).from(groups)
      .leftJoin(members, eq(groups.id, members.groupId))
      .where(eq(groups.isActive, true))
      .groupBy(groups.id);

    if (groupId) query = query.where(eq(groups.id, groupId));
    if (location) query = query.where(eq(groups.location, location));
    if (dateFrom) query = query.where(gte(groups.registrationDate, dateFrom.toISOString().split('T')[0]));
    if (dateTo) query = query.where(lte(groups.registrationDate, dateTo.toISOString().split('T')[0]));

    return await query;
  }

  async getMemberReport(groupId?: string, gender?: string, dateFrom?: Date, dateTo?: Date): Promise<any[]> {
    let query = db.select({
      id: members.id,
      firstName: members.firstName,
      lastName: members.lastName,
      gender: members.gender,
      phone: members.phone,
      groupName: groups.name,
      groupLocation: groups.location,
      savingsBalance: members.savingsBalance,
      joinDate: members.joinDate,
      isActive: members.isActive,
    }).from(members)
      .leftJoin(groups, eq(members.groupId, groups.id))
      .where(eq(members.isActive, true));

    if (groupId) query = query.where(eq(members.groupId, groupId));
    if (gender) query = query.where(eq(members.gender, gender));
    if (dateFrom) query = query.where(gte(members.joinDate, dateFrom.toISOString().split('T')[0]));
    if (dateTo) query = query.where(lte(members.joinDate, dateTo.toISOString().split('T')[0]));

    return await query;
  }

  async getFinancialReport(groupId?: string, dateFrom?: Date, dateTo?: Date): Promise<any[]> {
    let query = db.select({
      groupId: transactions.groupId,
      groupName: groups.name,
      transactionType: transactions.type,
      totalAmount: sum(transactions.amount),
      transactionCount: count(transactions.id),
    }).from(transactions)
      .leftJoin(groups, eq(transactions.groupId, groups.id))
      .groupBy(transactions.groupId, groups.name, transactions.type);

    if (groupId) query = query.where(eq(transactions.groupId, groupId));
    if (dateFrom) query = query.where(gte(transactions.transactionDate, dateFrom));
    if (dateTo) query = query.where(lte(transactions.transactionDate, dateTo));

    return await query;
  }
}

export const storage = new DatabaseStorage();

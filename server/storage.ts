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
import { eq, desc, and, count, sum, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByPhoneOrUserId(phoneOrUserId: string): Promise<User | undefined>;
  getUserByUserIdAndPhone(userId: string, phone: string): Promise<User | undefined>;
  getUserByBarcodeData(barcodeData: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Group operations
  createGroup(group: InsertGroup): Promise<Group>;
  getGroups(): Promise<Group[]>;
  getGroup(id: string): Promise<Group | undefined>;
  getGroupsByIds(ids: string[]): Promise<Group[]>;
  getGroupsByCreator(creatorId: string): Promise<Group[]>;
  updateGroup(id: string, updates: Partial<Group>): Promise<Group | undefined>;
  deleteGroup(id: string): Promise<boolean>;

  // Member operations
  createMember(member: InsertMember): Promise<Member>;
  getMembers(groupId?: string): Promise<Member[]>;
  getMember(id: string): Promise<Member | undefined>;
  getMembersByGroupIds(groupIds: string[]): Promise<Member[]>;
  updateMember(id: string, updates: Partial<Member>): Promise<Member | undefined>;
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
  updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined>;

  // Cashbox operations
  createCashboxEntry(entry: InsertCashbox): Promise<Cashbox>;
  getCashboxBalance(groupId: string): Promise<number>;
  getCashboxEntries(groupId: string): Promise<Cashbox[]>;

  // Additional member operations
  getMemberByPhone(phone: string): Promise<Member | undefined>;
  getGroupMembers(groupId: string): Promise<Member[]>;
  updateMemberShares(id: string, shares: number): Promise<void>;

  // Enhanced transaction operations
  getGroupTransactions(groupId: string): Promise<Transaction[]>;
  getMemberTransactions(memberId: string): Promise<Transaction[]>;
  getGroupStats(groupId: string): Promise<any>;

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

  async getUserByUserIdAndPhone(userId: string, phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users)
      .where(and(eq(users.userId, userId), eq(users.phone, phone)));
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

  async deleteUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .delete(users)
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

  async getGroupsByIds(ids: string[]): Promise<Group[]> {
    if (ids.length === 0) return [];
    return await db.select().from(groups).where(sql`${groups.id} = ANY(${ids})`).orderBy(desc(groups.createdAt));
  }

  async getGroupsByCreator(creatorId: string): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.createdBy, creatorId)).orderBy(desc(groups.createdAt));
  }

  async getGroup(id: string): Promise<Group | undefined> {
    const [group] = await db.select().from(groups).where(eq(groups.id, id));
    return group;
  }

  async updateGroup(id: string, updates: Partial<Group>): Promise<Group | undefined> {
    const [updatedGroup] = await db
      .update(groups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(groups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteGroup(id: string): Promise<boolean> {
    try {
      // First, delete all members in this group
      await db.delete(members).where(eq(members.groupId, id));
      
      // Delete all transactions for this group
      await db.delete(transactions).where(eq(transactions.groupId, id));
      
      // Delete all loans for this group
      await db.delete(loans).where(eq(loans.groupId, id));
      
      // Delete all meetings for this group
      await db.delete(meetings).where(eq(meetings.groupId, id));
      
      // Delete all cashbox entries for this group
      await db.delete(cashbox).where(eq(cashbox.groupId, id));
      
      // Finally, delete the group itself
      const result = await db.delete(groups).where(eq(groups.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw error;
    }
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

  async getMemberByPhone(phone: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.phone, phone));
    return member;
  }

  async getMembersByGroupIds(groupIds: string[]): Promise<Member[]> {
    if (groupIds.length === 0) return [];
    return await db.select().from(members).where(sql`${members.groupId} = ANY(${groupIds})`).orderBy(desc(members.createdAt));
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
    
    // Update member's savings balance and shares
    const member = await this.getMember(transaction.memberId);
    if (member) {
      const group = await this.getGroup(member.groupId);
      let newBalance = parseFloat(member.savingsBalance);
      let newShares = member.totalShares;
      
      if (transaction.type === 'deposit') {
        newBalance += parseFloat(transaction.amount);
        // Calculate shares based on group's saving per share value
        if (group && group.savingPerShare) {
          const shareValue = parseFloat(group.savingPerShare);
          newShares = Math.floor(newBalance / shareValue);
        }
      } else if (transaction.type === 'withdrawal') {
        newBalance -= parseFloat(transaction.amount);
        // Recalculate shares after withdrawal
        if (group && group.savingPerShare) {
          const shareValue = parseFloat(group.savingPerShare);
          newShares = Math.floor(newBalance / shareValue);
        }
      }
      
      await this.updateMember(transaction.memberId, { 
        savingsBalance: newBalance.toFixed(2),
        totalShares: newShares
      });
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
    
    // If the loan is approved, update the member's currentLoan field
    if (newLoan.status === 'approved') {
      const currentMember = await this.getMember(newLoan.memberId);
      if (currentMember) {
        const currentLoanAmount = parseFloat(currentMember.currentLoan);
        const newLoanAmount = parseFloat(newLoan.amount);
        const updatedLoanAmount = currentLoanAmount + newLoanAmount;
        
        await this.updateMember(newLoan.memberId, {
          currentLoan: updatedLoanAmount.toFixed(2)
        });
      }
    }
    
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

  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined> {
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
    
    // Note: availableCash will be calculated dynamically, no need to update here
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

  // Group-specific statistics for members
  async getGroupStats(groupId: string): Promise<{
    totalMembers: number;
    totalSavings: number;
    totalWelfare: number;
    totalShares: number;
    shareValue: number;
    totalCashInBox: number;
    totalLoansOutstanding: number;
    groupWelfareAmount: number;
    interestRate: number;
    totalInterest: number;
    totalOriginalLoans: number;
  }> {
    const group = await this.getGroup(groupId);
    if (!group) throw new Error('Group not found');
    

    const [memberCount] = await db.select({ count: count() }).from(members)
      .where(and(eq(members.groupId, groupId), eq(members.isActive, true)));
    
    const [savingsSum] = await db.select({ sum: sum(members.savingsBalance) }).from(members)
      .where(and(eq(members.groupId, groupId), eq(members.isActive, true)));
    
    const [welfareSum] = await db.select({ sum: sum(members.welfareBalance) }).from(members)
      .where(and(eq(members.groupId, groupId), eq(members.isActive, true)));
    
    const [sharesSum] = await db.select({ sum: sum(members.totalShares) }).from(members)
      .where(and(eq(members.groupId, groupId), eq(members.isActive, true)));
    
    const [loansSum] = await db.select({ sum: sum(members.currentLoan) }).from(members)
      .where(and(eq(members.groupId, groupId), eq(members.isActive, true)));

    const totalSavings = parseFloat(savingsSum.sum || '0');
    const totalLoansOutstanding = parseFloat(loansSum.sum || '0');
    const shareValue = parseFloat(group.savingPerShare || '0');
    const interestRate = parseFloat(group.interestRate || '0');
    
    
    // Calculate total original loans and total interest for this group
    // Since currentLoan = originalLoan + interest, we need to separate them
    // For now, we'll calculate based on the interest rate
    const totalOriginalLoans = totalLoansOutstanding / (1 + (interestRate / 100));
    const totalInterest = totalLoansOutstanding - totalOriginalLoans;
    
    return {
      totalMembers: memberCount.count,
      totalSavings,
      totalWelfare: parseFloat(welfareSum.sum || '0'),
      totalShares: parseInt(sharesSum.sum || '0'),
      shareValue,
      totalCashInBox: totalSavings - totalOriginalLoans, // Use original loan amount for cash calculation
      totalLoansOutstanding,
      groupWelfareAmount: parseFloat(group.welfareAmount || '0'),
      interestRate,
      totalInterest,
      totalOriginalLoans,
    };
  }

  // Update member shares and recalculate savings
  async updateMemberShares(memberId: string, newShares: number): Promise<void> {
    const member = await this.getMember(memberId);
    if (!member) throw new Error('Member not found');
    
    const group = await this.getGroup(member.groupId);
    if (!group) throw new Error('Group not found');
    
    const shareValue = parseFloat(group.savingPerShare || '0');
    const newSavingsBalance = (newShares * shareValue).toString();
    
    await db.update(members)
      .set({ 
        totalShares: newShares,
        savingsBalance: newSavingsBalance,
        updatedAt: new Date()
      })
      .where(eq(members.id, memberId));
  }

  // Enhanced member and transaction methods for dashboard
  async getGroupMembers(groupId: string): Promise<Member[]> {
    return await db.select().from(members).where(eq(members.groupId, groupId));
  }

  async getGroupTransactions(groupId: string): Promise<Transaction[]> {
    return await this.getTransactions(groupId);
  }

  async getMemberTransactions(memberId: string): Promise<Transaction[]> {
    return await this.getTransactions(undefined, memberId);
  }


  // Dashboard statistics
  async getDashboardStats(): Promise<{
    totalGroups: number;
    totalMembers: number;
    maleMembers: number;
    femaleMembers: number;
    totalSavings: number;
    totalWelfare: number;
    totalCashInBox: number;
    activeLoans: number;
    totalLoansGiven: number;
    totalInterest: number;
  }> {
    try {
      // Simple approach to avoid aggregate function issues
      const allGroups = await db.select().from(groups).where(eq(groups.isActive, true));
      const allMembers = await db.select().from(members).where(eq(members.isActive, true));
      const allLoans = await db.select().from(loans);
      
      const totalGroups = allGroups.length;
      const totalMembers = allMembers.length;
      const maleMembers = allMembers.filter(m => m.gender === 'M').length;
      const femaleMembers = allMembers.filter(m => m.gender === 'F').length;
      
      const totalSavings = allMembers.reduce((total, member) => {
        return total + parseFloat(member.savingsBalance || '0');
      }, 0);
      
      const totalWelfare = allMembers.reduce((total, member) => {
        return total + parseFloat(member.welfareBalance || '0');
      }, 0);
      
      const totalCurrentLoans = allMembers.reduce((total, member) => {
        const loanAmount = parseFloat(member.currentLoan || '0');
        return total + loanAmount;
      }, 0);
      
      const totalCashInBox = totalSavings - totalCurrentLoans;
      
      const activeLoans = allLoans.filter(loan => loan.status === 'active' || loan.status === 'approved').length;
      const totalLoansGiven = totalCurrentLoans;
      
      // Calculate actual interest earned from loan payments
      // Get all loan-related transactions
      const allTransactions = await db.select().from(transactions);
      const loanPayments = allTransactions.filter(t => t.type === 'loan_payment');
      const loanDisbursements = allTransactions.filter(t => t.type === 'loan_disbursement');
      
      const totalPayments = loanPayments.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalDisbursed = loanDisbursements.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      // Interest is the difference between what was paid back and what was disbursed
      const totalInterest = totalPayments - totalDisbursed;

      return {
        totalGroups,
        totalMembers,
        maleMembers,
        femaleMembers,
        totalSavings,
        totalWelfare,
        totalCashInBox,
        activeLoans,
        totalLoansGiven,
        totalInterest,
      };
    } catch (error) {
      console.error("Error in getDashboardStats:", error);
      // Return default values if there's an error
      return {
        totalGroups: 0,
        totalMembers: 0,
        maleMembers: 0,
        femaleMembers: 0,
        totalSavings: 0,
        totalWelfare: 0,
        totalCashInBox: 0,
        activeLoans: 0,
        totalLoansGiven: 0,
        totalInterest: 0,
      };
    }
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

    // Apply filters
    let conditions = [eq(groups.isActive, true)];
    if (groupId) conditions.push(eq(groups.id, groupId));
    if (location) conditions.push(eq(groups.location, location));
    if (dateFrom) conditions.push(gte(groups.registrationDate, dateFrom.toISOString().split('T')[0]));
    if (dateTo) conditions.push(lte(groups.registrationDate, dateTo.toISOString().split('T')[0]));
    
    query = db.select({
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
      .where(and(...conditions))
      .groupBy(groups.id);

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

    // Apply filters
    let memberConditions = [eq(members.isActive, true)];
    if (groupId) memberConditions.push(eq(members.groupId, groupId));
    if (gender) memberConditions.push(eq(members.gender, gender));
    if (dateFrom) memberConditions.push(gte(members.joinDate, dateFrom.toISOString().split('T')[0]));
    if (dateTo) memberConditions.push(lte(members.joinDate, dateTo.toISOString().split('T')[0]));
    
    query = db.select({
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
      .where(and(...memberConditions));

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

    // Apply filters
    let transactionConditions = [];
    if (groupId) transactionConditions.push(eq(transactions.groupId, groupId));
    if (dateFrom) transactionConditions.push(gte(transactions.transactionDate, dateFrom));
    if (dateTo) transactionConditions.push(lte(transactions.transactionDate, dateTo));
    
    if (transactionConditions.length > 0) {
      query = db.select({
        groupId: transactions.groupId,
        groupName: groups.name,
        transactionType: transactions.type,
        totalAmount: sum(transactions.amount),
        transactionCount: count(transactions.id),
      }).from(transactions)
        .leftJoin(groups, eq(transactions.groupId, groups.id))
        .where(and(...transactionConditions))
        .groupBy(transactions.groupId, groups.name, transactions.type);
    }

    return await query;
  }
}

export const storage = new DatabaseStorage();

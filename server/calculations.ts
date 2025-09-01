/**
 * Standardized Financial Calculations for VSLA System
 * 
 * This module provides universal formulas that work for all groups
 * based on their specific configuration and rules.
 */

import type { Group, Member, Loan } from "@shared/schema";

export interface GroupFinancials {
  totalMembers: number;
  totalSavings: number;
  totalWelfare: number;
  totalShares: number;
  shareValue: number;
  totalCashInBox: number;
  totalLoansOutstanding: number;
  totalOriginalLoans: number;
  totalInterestEarned: number;
  groupWelfareAmount: number;
  interestRate: number;
  availableLoanFunds: number;
}

/**
 * STANDARD FORMULA 1: Calculate member shares
 * Formula: shares = floor(savings_balance / group.saving_per_share)
 */
export function calculateMemberShares(savingsBalance: number, groupSavingPerShare: number): number {
  if (groupSavingPerShare <= 0) return 0;
  return Math.floor(savingsBalance / groupSavingPerShare);
}

/**
 * STANDARD FORMULA 2: Calculate loan interest
 * Formula: interest = principal * (interest_rate / 100) * months
 * For compound interest: amount = principal * (1 + rate/100)^months
 */
export function calculateLoanInterest(
  principal: number, 
  monthlyInterestRate: number, 
  months: number, 
  isCompound: boolean = true
): number {
  if (isCompound) {
    const totalAmount = principal * Math.pow(1 + (monthlyInterestRate / 100), months);
    return totalAmount - principal;
  } else {
    return principal * (monthlyInterestRate / 100) * months;
  }
}

/**
 * STANDARD FORMULA 3: Calculate total amount due on loan
 * Formula: total_due = principal + interest
 */
export function calculateLoanTotalDue(
  principal: number, 
  monthlyInterestRate: number, 
  months: number,
  isCompound: boolean = true
): number {
  const interest = calculateLoanInterest(principal, monthlyInterestRate, months, isCompound);
  return principal + interest;
}

/**
 * STANDARD FORMULA 4: Calculate cash in box
 * Formula: cash_in_box = total_savings - total_loans_outstanding + group.available_cash
 */
export function calculateCashInBox(
  totalSavings: number, 
  totalLoansOutstanding: number, 
  groupAvailableCash: number = 0
): number {
  return totalSavings - totalLoansOutstanding + groupAvailableCash;
}

/**
 * STANDARD FORMULA 5: Calculate welfare contribution
 * Formula: welfare_due = group.welfare_amount * months_active
 */
export function calculateWelfareContribution(
  monthlyWelfareAmount: number, 
  monthsActive: number
): number {
  return monthlyWelfareAmount * monthsActive;
}

/**
 * STANDARD FORMULA 6: Calculate share value appreciation
 * Formula: new_share_value = original_value + (total_interest_earned / total_shares)
 */
export function calculateShareValueAppreciation(
  originalShareValue: number,
  totalInterestEarned: number,
  totalShares: number
): number {
  if (totalShares <= 0) return originalShareValue;
  return originalShareValue + (totalInterestEarned / totalShares);
}

/**
 * MAIN CALCULATION FUNCTION: Calculate all group financials
 * This function applies all standard formulas based on group settings
 */
export function calculateGroupFinancials(
  group: Group,
  members: Member[],
  loans: Loan[] = []
): GroupFinancials {
  // Basic counts and totals
  const totalMembers = members.length;
  const totalSavings = members.reduce((sum, member) => sum + parseFloat(member.savingsBalance || '0'), 0);
  const totalWelfare = members.reduce((sum, member) => sum + parseFloat(member.welfareBalance || '0'), 0);
  const totalLoansOutstanding = members.reduce((sum, member) => sum + parseFloat(member.currentLoan || '0'), 0);
  
  // Group settings
  const shareValue = parseFloat(group.savingPerShare || '0');
  const interestRate = parseFloat(group.interestRate || '0');
  const groupWelfareAmount = parseFloat(group.welfareAmount || '0');
  const groupAvailableCash = parseFloat(group.availableCash || '0');
  
  // FORMULA 1: Calculate total shares using standard formula
  const totalShares = members.reduce((sum, member) => {
    const memberShares = calculateMemberShares(parseFloat(member.savingsBalance || '0'), shareValue);
    return sum + memberShares;
  }, 0);
  
  // FORMULA 2 & 3: Calculate interest from loans using database data
  let totalOriginalLoans = 0;
  let totalInterestEarned = 0;
  
  loans.forEach(loan => {
    const principal = parseFloat(loan.amount || '0');
    totalOriginalLoans += principal;
    
    // Use stored interest amount if available, otherwise calculate
    if (loan.totalAmountDue) {
      // Calculate from totalAmountDue - principal
      const totalDue = parseFloat(loan.totalAmountDue);
      totalInterestEarned += (totalDue - principal);
    } else {
      // Calculate using standard formula
      const months = parseInt(loan.termMonths?.toString() || '1');
      const interest = calculateLoanInterest(principal, interestRate, months, false);
      totalInterestEarned += interest;
    }
  });
  
  // If no loans data but members have outstanding loans, estimate from member balances
  if (loans.length === 0 && totalLoansOutstanding > 0) {
    // Estimate original loans using simple interest formula working backwards
    // currentLoan = principal + (principal * rate/100 * months)
    // For estimation, assume average 6 months and use group rate
    const avgMonths = 6;
    const rateFactor = 1 + ((interestRate / 100) * avgMonths);
    totalOriginalLoans = totalLoansOutstanding / rateFactor;
    totalInterestEarned = totalLoansOutstanding - totalOriginalLoans;
  }
  
  // FORMULA 4: Calculate cash in box
  const totalCashInBox = calculateCashInBox(totalSavings, totalLoansOutstanding, groupAvailableCash);
  
  // Calculate available funds for new loans
  const availableLoanFunds = Math.max(0, totalCashInBox);
  
  return {
    totalMembers,
    totalSavings,
    totalWelfare,
    totalShares,
    shareValue,
    totalCashInBox,
    totalLoansOutstanding,
    totalOriginalLoans,
    totalInterestEarned,
    groupWelfareAmount,
    interestRate,
    availableLoanFunds,
  };
}

/**
 * UTILITY: Update member shares based on savings
 * This ensures all members have correct shares according to the standard formula
 */
export function updateMemberShares(member: Member, group: Group): Member {
  const shareValue = parseFloat(group.savingPerShare || '0');
  const savingsBalance = parseFloat(member.savingsBalance || '0');
  const correctShares = calculateMemberShares(savingsBalance, shareValue);
  
  return {
    ...member,
    totalShares: correctShares
  };
}

/**
 * VALIDATION: Check if group calculations are consistent
 */
export function validateGroupCalculations(group: Group, members: Member[]): string[] {
  const errors: string[] = [];
  
  // Check if all members have correct shares
  const shareValue = parseFloat(group.savingPerShare || '0');
  members.forEach(member => {
    const expectedShares = calculateMemberShares(parseFloat(member.savingsBalance || '0'), shareValue);
    if (member.totalShares !== expectedShares) {
      errors.push(`Member ${member.firstName} ${member.lastName} has incorrect shares: ${member.totalShares} (expected: ${expectedShares})`);
    }
  });
  
  return errors;
}
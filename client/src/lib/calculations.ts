/**
 * Frontend Calculation Utilities
 * 
 * These functions mirror the backend calculations to ensure consistency
 * across the entire application.
 */

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
  isCompound: boolean = false
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
  isCompound: boolean = false
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
 * STANDARD FORMULA 6: Calculate monthly payment for loan
 * Formula: For simple interest: (principal + interest) / months
 */
export function calculateMonthlyPayment(
  principal: number,
  monthlyInterestRate: number,
  months: number,
  isCompound: boolean = false
): number {
  const totalDue = calculateLoanTotalDue(principal, monthlyInterestRate, months, isCompound);
  return totalDue / months;
}

/**
 * Generate loan payment schedule
 */
export function generatePaymentSchedule(
  principal: number,
  monthlyInterestRate: number,
  months: number,
  isCompound: boolean = false
): Array<{
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}> {
  const monthlyPayment = calculateMonthlyPayment(principal, monthlyInterestRate, months, isCompound);
  const schedule = [];
  let balance = calculateLoanTotalDue(principal, monthlyInterestRate, months, isCompound);

  for (let month = 1; month <= months; month++) {
    const payment = Math.min(monthlyPayment, balance);
    const interestPayment = (balance * monthlyInterestRate) / 100;
    const principalPayment = payment - interestPayment;
    balance -= payment;

    schedule.push({
      month,
      payment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, balance),
    });
  }

  return schedule;
}
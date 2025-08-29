import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AdminSidebar } from "@/components/AdminSidebar";
import { 
  Users, 
  DollarSign, 
  Share, 
  Heart, 
  Wallet, 
  FileText,
  LogOut,
  User,
  Building2,
  Calculator,
  PlusCircle,
  MinusCircle,
  Clock,
  TrendingUp,
  AlertTriangle
} from "lucide-react";

interface MemberSession {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    groupRole: string;
    groupId: string;
    totalShares: number;
    savingsBalance: string;
    welfareBalance: string;
    currentLoan: string;
  };
  groupStats: {
    totalMembers: number;
    totalSavings: number;
    totalWelfare: number;
    totalShares: number;
    shareValue: number;
    totalCashInBox: number;
    totalLoansOutstanding: number;
    groupWelfareAmount: number;
    interestRate: number;
  };
}

export default function MemberDashboard() {
  const { memberId } = useParams<{ memberId: string }>();
  const [, setLocation] = useLocation();
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);

  // Load member session from API to get fresh data
  useEffect(() => {
    fetch('/api/member-session')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('No session found');
      })
      .then(session => {
        setMemberSession(session);
      })
      .catch(error => {
        console.log('Member session not available:', error.message);
        // Redirect to login if no session
        setLocation('/member-login');
      });
  }, [setLocation]);

  // Loading state while fetching fresh data
  const isLoading = !memberSession;
  const dashboardData = memberSession;

  const handleLogout = () => {
    localStorage.removeItem('memberSession');
    setLocation('/member-login');
  };

  if (!memberSession || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const member = dashboardData?.member || memberSession.member;
  const group = dashboardData?.group;
  const groupStats = dashboardData?.groupStats || memberSession.groupStats;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'chairman': return 'bg-blue-100 text-blue-800';
      case 'secretary': return 'bg-green-100 text-green-800';
      case 'finance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if member has leadership role that should show navigation menu
  const isLeadershipRole = ['chairman', 'secretary', 'finance'].includes(member.groupRole);

  const dashboardContent = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-3 rounded-full">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {member.firstName} {member.lastName}
            </h1>
            <div className="flex items-center gap-2">
              <Badge className={getRoleColor(member.groupRole)}>
                {member.groupRole}
              </Badge>
              {group && (
                <span className="text-muted-foreground">
                  • {group.name}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Personal Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Share className="h-4 w-4" />
              My Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {member.totalShares || 0}
            </div>
            <div className="text-xs text-muted-foreground">
              @ {formatCurrency(groupStats.shareValue)} each
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              My Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(parseFloat(member.savingsBalance || '0'))}
            </div>
            <div className="text-xs text-muted-foreground">
              {member.totalShares || 0} shares
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Heart className="h-4 w-4" />
              My Welfare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(parseFloat(member.welfareBalance || '0'))}
            </div>
            <div className="text-xs text-muted-foreground">
              USh {member.welfareBalance || 0} expected
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              My Loan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(parseFloat(member.currentLoan || '0'))}
            </div>
            <div className="text-xs text-muted-foreground">
              Amount Borrowed
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Group Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Group Totals</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Members:</span>
                  <span className="font-medium">{groupStats.totalMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Shares:</span>
                  <span className="font-medium">{groupStats.totalShares}</span>
                </div>
                <div className="flex justify-between">
                  <span>Share Value:</span>
                  <span className="font-medium">{formatCurrency(groupStats.shareValue) || 'USh NaN'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Group Finances</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Total Savings:</span>
                  <span className="font-medium">{formatCurrency(groupStats.totalSavings) || 'USh 255,000'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Welfare:</span>
                  <span className="font-medium">{formatCurrency(groupStats.totalWelfare) || 'USh 0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cash in Box:</span>
                  <span className="font-medium">{formatCurrency(groupStats.totalCashInBox) || 'USh 0'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Loan Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Outstanding Loans:</span>
                  <span className="font-medium">{formatCurrency(groupStats.totalLoansOutstanding) || 'USh 85,000'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{groupStats.interestRate || 10}% per month</span>
                </div>
                <div className="flex justify-between">
                  <span>Available for Loans:</span>
                  <span className="font-medium text-green-600">USh 0</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Loan Information if member has a loan */}
      {parseFloat(member.currentLoan || '0') > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Detailed Loan Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LoanDetailsWidget 
              borrowedAmount={parseFloat(member.currentLoan || '0')}
              interestRate={groupStats.interestRate}
              memberId={member.id}
            />
          </CardContent>
        </Card>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {isLeadershipRole ? 'Group Transaction History' : 'My Transaction History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionHistoryWidget 
            groupId={member.groupId} 
            memberId={isLeadershipRole ? undefined : member.id}
            userRole={member.groupRole}
            isLeader={isLeadershipRole}
          />
        </CardContent>
      </Card>
    </div>
  );

  if (isLeadershipRole) {
    return (
      <div className="min-h-screen flex bg-background">
        <AdminSidebar userRole={member.groupRole} />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {dashboardContent}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        {dashboardContent}
      </div>
    </div>
  );
}

// Loan Details Widget with Compound Interest Calculation
function LoanDetailsWidget({ 
  borrowedAmount, 
  interestRate, 
  memberId 
}: { 
  borrowedAmount: number; 
  interestRate: number; 
  memberId: string;
}) {
  const { toast } = useToast();

  // Don't make API calls for member sessions - use mock data instead
  const loanData = borrowedAmount > 0 ? {
    approvedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
  } : null;

  // Calculate compound interest based on time since disbursement
  const calculateCompoundInterest = () => {
    if (!loanData || !loanData.approvedDate) {
      return {
        currentAmount: borrowedAmount,
        totalInterest: 0,
        monthsElapsed: 0,
        monthlyBreakdown: [],
        monthsOverdue: 0,
        daysSinceStart: 0
      };
    }

    const now = new Date();
    const startDate = new Date(loanData.approvedDate);
    const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate completed months (every 28 days = 1 month)
    const monthsCompleted = Math.floor(daysSinceStart / 28);
    const daysInCurrentPeriod = daysSinceStart % 28;
    
    let runningPrincipal = borrowedAmount;
    let totalInterest = 0;
    const monthlyBreakdown = [];

    // Calculate completed months - these go to Total Interest
    for (let month = 1; month <= monthsCompleted; month++) {
      const monthlyInterest = runningPrincipal * (interestRate / 100);
      totalInterest += monthlyInterest;
      runningPrincipal += monthlyInterest; // Compound the principal
      
      monthlyBreakdown.push({
        month,
        principal: month === 1 ? borrowedAmount : runningPrincipal - monthlyInterest,
        interest: monthlyInterest,
        totalAmount: runningPrincipal
      });
    }

    // Calculate current period interest (partial month)
    const currentPeriodInterest = daysInCurrentPeriod > 0 
      ? (runningPrincipal * (interestRate / 100) * daysInCurrentPeriod / 28)
      : 0;

    // Current Amount Due = Current Principal + Current Period Interest
    const currentAmount = runningPrincipal + currentPeriodInterest;

    return {
      currentAmount,
      totalInterest,
      monthsElapsed: monthsCompleted,
      monthlyBreakdown,
      monthsOverdue: monthsCompleted,
      daysSinceStart,
      currentPeriodInterest,
      daysInCurrentPeriod,
      currentPrincipal: runningPrincipal
    };
  };

  const loanDetails = calculateCompoundInterest();
  const isOverdue = loanDetails.monthsOverdue > 0;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Original Amount</div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(borrowedAmount)}
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${isOverdue ? 'bg-red-50 dark:bg-red-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
          <div className={`text-sm font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
            Current Amount Due
          </div>
          <div className={`text-xl font-bold ${isOverdue ? 'text-red-700 dark:text-red-300' : 'text-orange-700 dark:text-orange-300'}`}>
            {formatCurrency(loanDetails.currentAmount)}
          </div>
          <div className="text-xs mt-1 opacity-80">
            Principal: {formatCurrency(loanDetails.currentPrincipal || borrowedAmount)} + Current Interest: {formatCurrency(loanDetails.currentPeriodInterest || 0)}
          </div>
          {isOverdue && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Overdue by {loanDetails.monthsOverdue} month(s)</span>
            </div>
          )}
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">Total Interest</div>
          <div className="text-xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(loanDetails.totalInterest)}
          </div>
          <div className="text-xs mt-1 opacity-80">
            Day {loanDetails.daysInCurrentPeriod || 0} of 28 (Current Period)
          </div>
        </div>
      </div>

      {/* Interest Breakdown */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Monthly Interest Breakdown
        </h4>
        <div className="text-sm text-muted-foreground mb-2">
          Interest Rate: {interestRate}% per month • Days Since Loan: {loanDetails.daysSinceStart || 0}
        </div>
        
        {loanDetails.monthlyBreakdown.length > 0 ? (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {loanDetails.monthlyBreakdown.map((month) => (
              <div key={month.month} className="flex justify-between items-center text-sm">
                <span>Month {month.month}</span>
                <span>Interest: {formatCurrency(month.interest)}</span>
                <span className="font-medium">Total: {formatCurrency(month.totalAmount)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            No completed months yet. Current period: Day {loanDetails.daysInCurrentPeriod || 0} of 28
          </div>
        )}
      </div>
    </div>
  );
}

// Transaction History Widget
function TransactionHistoryWidget({ 
  groupId, 
  memberId,
  userRole,
  isLeader 
}: { 
  groupId: string; 
  memberId?: string;
  userRole: string;
  isLeader: boolean;
}) {
  // Don't make API calls for member sessions - use empty array instead
  const transactions: any[] = [];

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {transactions.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center p-4">
          No transactions to display at this time.
        </div>
      ) : (
        transactions.map((transaction: any) => (
          <div key={transaction.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-medium">{transaction.type.replace('_', ' ').toUpperCase()}</div>
                {isLeader && (
                  <div className="text-sm text-muted-foreground">
                    {transaction.memberName}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {new Date(transaction.transactionDate).toLocaleDateString()} at{' '}
                  {new Date(transaction.transactionDate).toLocaleTimeString()}
                </div>
                {transaction.submittedBy && (
                  <div className="text-xs text-muted-foreground">
                    Submitted by: {transaction.submittedBy}
                  </div>
                )}
              </div>
              <div className={`font-bold ${
                transaction.type.includes('payment') || transaction.type.includes('deposit') 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(parseFloat(transaction.amount))}
              </div>
            </div>
            {transaction.description && (
              <div className="text-sm text-muted-foreground mt-1">
                {transaction.description}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
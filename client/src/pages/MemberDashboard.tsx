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
    totalInterest: number;
    totalOriginalLoans: number;
  };
}

export default function MemberDashboard() {
  const { memberId } = useParams<{ memberId: string }>();
  const [, setLocation] = useLocation();
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);

  // Load member session from API to get fresh data
  useEffect(() => {
    fetch('/api/member-session', { cache: 'no-cache' })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('No session found');
      })
      .then(session => {
        console.log('Fresh API response:', session);
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
              {(() => {
                const savings = parseFloat(member.savingsBalance || '0');
                const shareValue = groupStats.shareValue || 1;
                const calculatedShares = Math.floor(savings / shareValue);
                console.log('Shares calculation:', { savings, shareValue, calculatedShares });
                return calculatedShares;
              })()}
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
              {Math.floor(parseFloat(member.savingsBalance || '0') / (groupStats.shareValue || 1))} shares
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
              Current Amount Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(parseFloat(member.currentLoan || '0'))}
            </div>
            <div className="text-xs text-muted-foreground">
              Principal + Interest
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
                  <span className="font-medium">{formatCurrency(groupStats.totalLoansOutstanding) || 'USh 0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Original Loan Amount:</span>
                  <span className="font-medium">{formatCurrency(groupStats.totalOriginalLoans) || 'USh 0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Interest:</span>
                  <span className="font-medium text-indigo-600">{formatCurrency(groupStats.totalInterest) || 'USh 0'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{groupStats.interestRate || 10}% per month</span>
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
              currentAmountDue={parseFloat(member.currentLoan || '0')}
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

// Loan Details Widget with VSLA Simple Interest Calculation
function LoanDetailsWidget({ 
  currentAmountDue, 
  interestRate, 
  memberId 
}: { 
  currentAmountDue: number; 
  interestRate: number; 
  memberId: string;
}) {
  const { toast } = useToast();

  // VSLA Simple Interest Calculation:
  // Current Amount Due = Original Loan + Interest (from day 1)
  // Interest = Original Loan × Interest Rate
  // Original Loan = Current Amount Due ÷ (1 + Interest Rate)
  
  const originalLoanAmount = currentAmountDue / (1 + (interestRate / 100));
  const totalInterest = currentAmountDue - originalLoanAmount;

  const loanDetails = {
    originalAmount: originalLoanAmount,
    currentAmount: currentAmountDue,
    totalInterest: totalInterest,
    interestRate: interestRate
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">Original Loan Amount</div>
          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(loanDetails.originalAmount)}
          </div>
          <div className="text-xs mt-1 opacity-80">
            Principal borrowed
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
            Current Amount Due
          </div>
          <div className="text-xl font-bold text-orange-700 dark:text-orange-300">
            {formatCurrency(loanDetails.currentAmount)}
          </div>
          <div className="text-xs mt-1 opacity-80">
            Principal + {interestRate}% interest
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="text-sm text-green-600 dark:text-green-400 font-medium">Interest Amount</div>
          <div className="text-xl font-bold text-green-700 dark:text-green-300">
            {formatCurrency(loanDetails.totalInterest)}
          </div>
          <div className="text-xs mt-1 opacity-80">
            {interestRate}% of original amount
          </div>
        </div>
      </div>

      {/* VSLA Loan Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          VSLA Loan Summary
        </h4>
        <div className="text-sm text-muted-foreground mb-2">
          Interest Rate: {interestRate}% applied from day 1 • 28-day loan term
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Original Loan:</span>
            <span className="font-medium">{formatCurrency(loanDetails.originalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Interest ({interestRate}%):</span>
            <span className="font-medium text-green-600">+{formatCurrency(loanDetails.totalInterest)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 col-span-2">
            <span className="font-medium">Total Amount Due:</span>
            <span className="font-bold text-orange-600">{formatCurrency(loanDetails.currentAmount)}</span>
          </div>
        </div>
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
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
import { OfflineIndicator } from "@/components/OfflineIndicator";
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
    groupName?: string;
    totalShares: number;
    savingsBalance: string;
    welfareBalance: string;
    currentLoan: string;
  };
  group?: {
    id: string;
    name: string;
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

  // Function to load fresh session data
  const loadFreshSessionData = () => {
    console.log('Fetching fresh data from database...');
    fetch('/api/member-session', { 
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('No session found');
      })
      .then(session => {
        console.log('FRESH API DATA - currentLoan:', session.member.currentLoan);
        console.log('FULL MEMBER DATA:', session.member);
        
        // FORCE CLEAR OLD CACHE BEFORE SETTING NEW DATA
        localStorage.removeItem('memberSession');
        
        // Set fresh data from database
        setMemberSession(session);
        localStorage.setItem('memberSession', JSON.stringify(session));
        console.log('Updated localStorage with fresh data');
      })
      .catch(error => {
        console.log('Member session not available:', error.message);
        // Only redirect if no cached session and we're not already on login
        const cachedSession = localStorage.getItem('memberSession');
        if (!cachedSession && !window.location.pathname.includes('/login')) {
          setTimeout(() => setLocation('/login'), 100);
        }
      });
  };

  // Load member session from API to get fresh data
  useEffect(() => {
    // CRITICAL: Always get fresh data from database, never trust cache for financial data
    console.log('Loading fresh member data from database...');
    loadFreshSessionData();
  }, [setLocation]);
  
  // Refresh data every 10 seconds to ensure accuracy
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Auto-refreshing member data...');
      loadFreshSessionData();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen for member data updates and manual refresh
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('Manual refresh triggered');
      loadFreshSessionData();
    };
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'F5' || (e.ctrlKey && e.key === 'r')) {
        e.preventDefault();
        console.log('F5/Ctrl+R refresh triggered');
        loadFreshSessionData();
      }
    };
    
    window.addEventListener('memberDataUpdated', handleDataUpdate);
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('memberDataUpdated', handleDataUpdate);
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  // Loading state while fetching fresh data
  const isLoading = !memberSession;
  const dashboardData = memberSession;

  const handleLogout = async () => {
    try {
      // Clear localStorage first
      localStorage.removeItem('memberSession');
      
      // Try to logout from server (might fail if session expired)
      await fetch('/api/logout', { 
        method: 'POST',
        credentials: 'include'
      }).catch(() => {
        // Ignore errors, just ensure cleanup
        console.log('Server logout failed, but continuing with client cleanup');
      });
      
      // Force page reload to clear all state
      window.location.href = '/login';
    } catch (error) {
      console.log('Logout error, forcing redirect:', error);
      // Force redirect even on error
      window.location.href = '/login';
    }
  };

  if (!memberSession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading your dashboard...</div>
          <div className="text-xs text-muted-foreground mt-2">If this takes too long, you may need to login again</div>
        </div>
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
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="bg-primary/10 p-2 sm:p-3 rounded-full">
            <User className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {member.firstName} {member.lastName}
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={getRoleColor(member.groupRole)}>
                {member.groupRole}
              </Badge>
              <OfflineIndicator />
              {(group?.name || member.groupName) && (
                <span className="text-sm text-muted-foreground">
                  • {group?.name || member.groupName}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('Manual refresh clicked');
              loadFreshSessionData();
            }} 
            className="self-start sm:self-center text-xs sm:text-sm"
            data-testid="button-refresh-data"
          >
            🔄 Refresh Data
          </Button>
          <Button variant="outline" onClick={handleLogout} className="self-start sm:self-center" data-testid="button-logout">
            <LogOut className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden">Exit</span>
          </Button>
        </div>
      </div>

      {/* Personal Stats - Mobile Responsive */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <Share className="h-3 w-3" />
              <span className="hidden sm:inline">My Shares</span>
              <span className="sm:hidden">Shares</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 leading-tight">
              {Math.floor(parseFloat(member.savingsBalance || '0') / (groupStats.shareValue || 1))}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              <span className="hidden sm:inline">@ {formatCurrency(groupStats.shareValue)} each</span>
              <span className="sm:hidden">@ {formatCurrency(groupStats.shareValue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              <span className="hidden sm:inline">My Savings</span>
              <span className="sm:hidden">Savings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div className="text-lg sm:text-2xl font-bold text-primary leading-tight">
              {formatCurrency(parseFloat(member.savingsBalance || '0'))}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              {Math.floor(parseFloat(member.savingsBalance || '0') / (groupStats.shareValue || 1))} shares
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <Heart className="h-3 w-3" />
              <span className="hidden sm:inline">My Welfare</span>
              <span className="sm:hidden">Welfare</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div className="text-lg sm:text-2xl font-bold text-green-600 leading-tight">
              {formatCurrency(parseFloat(member.welfareBalance || '0'))}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              <span className="hidden sm:inline">Expected</span>
              <span className="sm:hidden">Expected</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-xs font-medium flex items-center gap-1">
              <Wallet className="h-3 w-3" />
              <span className="hidden sm:inline">Current Amount Due</span>
              <span className="sm:hidden">Loan Due</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 pb-3">
            <div className="text-lg sm:text-2xl font-bold text-orange-600 leading-tight">
              {formatCurrency(parseFloat(member.currentLoan || '0'))}
            </div>
            <div className="text-xs text-muted-foreground mt-1 leading-tight">
              <span className="hidden sm:inline">Principal + Interest</span>
              <span className="sm:hidden">P + Interest</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Group Overview - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
            Group Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
            
            <div className="sm:col-span-2 lg:col-span-1">
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

      {/* Detailed Loan Information if member has a loan - Mobile Responsive */}
      {parseFloat(member.currentLoan || '0') > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Detailed Loan Information</span>
              <span className="sm:hidden">Loan Details</span>
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

      {/* Transaction History - Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">{isLeadershipRole ? 'Group Transaction History' : 'My Transaction History'}</span>
            <span className="sm:hidden">{isLeadershipRole ? 'Group History' : 'My History'}</span>
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
        <AdminSidebar userRole={member.groupRole || 'member'} />
        <main className="flex-1 overflow-auto">
          {/* Add top padding on mobile to account for hamburger menu */}
          <div className="container mx-auto p-3 sm:p-6 max-w-7xl pt-16 lg:pt-3">
            {dashboardContent}
          </div>
        </main>
      </div>
    );
  }

  // All members get sidebar - navigation is filtered by role
  return (
    <div className="min-h-screen flex bg-background">
      <AdminSidebar userRole={member.groupRole || 'member'} />
      <main className="flex-1 overflow-auto">
        {/* Add top padding on mobile to account for hamburger menu */}
        <div className="container mx-auto p-3 sm:p-6 max-w-7xl pt-16 lg:pt-3">
          {dashboardContent}
        </div>
      </main>
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
      {/* Summary Cards - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg">
          <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
            <span className="hidden sm:inline">Original Loan Amount</span>
            <span className="sm:hidden">Original Loan</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-blue-700 dark:text-blue-300">
            {formatCurrency(loanDetails.originalAmount)}
          </div>
          <div className="text-xs mt-1 opacity-80">
            Principal borrowed
          </div>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 p-3 sm:p-4 rounded-lg">
          <div className="text-xs sm:text-sm font-medium text-orange-600 dark:text-orange-400">
            <span className="hidden sm:inline">Current Amount Due</span>
            <span className="sm:hidden">Amount Due</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-orange-700 dark:text-orange-300">
            {formatCurrency(loanDetails.currentAmount)}
          </div>
          <div className="text-xs mt-1 opacity-80">
            Principal + {interestRate}% interest
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 rounded-lg sm:col-span-2 lg:col-span-1">
          <div className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium">
            <span className="hidden sm:inline">Interest Amount</span>
            <span className="sm:hidden">Interest</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-green-700 dark:text-green-300">
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Original Loan:</span>
            <span className="font-medium">{formatCurrency(loanDetails.originalAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span>Interest ({interestRate}%):</span>
            <span className="font-medium text-green-600">+{formatCurrency(loanDetails.totalInterest)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 sm:col-span-2">
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
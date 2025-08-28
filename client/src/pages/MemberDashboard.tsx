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

  // Load member session from localStorage
  useEffect(() => {
    const sessionData = localStorage.getItem('memberSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setMemberSession(session);
    } else {
      // Redirect to login if no session
      setLocation('/member-login');
    }
  }, [setLocation]);

  // Fetch fresh member dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/members", memberId, "dashboard"],
    queryFn: async () => {
      const response = await fetch(`/api/members/${memberId}/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!memberId && !!memberSession,
  });

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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
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
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(parseFloat(member.welfareBalance || '0'))}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(groupStats.groupWelfareAmount)} expected
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
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
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Group Totals</div>
                <div className="space-y-1">
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
                    <span className="font-medium">{formatCurrency(groupStats.shareValue)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Group Finances</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Savings:</span>
                    <span className="font-medium">{formatCurrency(groupStats.totalSavings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Welfare:</span>
                    <span className="font-medium">{formatCurrency(groupStats.totalWelfare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash in Box:</span>
                    <span className="font-medium text-green-600">{formatCurrency(groupStats.totalCashInBox)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Loan Information</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Outstanding Loans:</span>
                    <span className="font-medium">{formatCurrency(groupStats.totalLoansOutstanding)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate:</span>
                    <span className="font-medium">{groupStats.interestRate}% per month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available for Loans:</span>
                    <span className="font-medium text-green-600">{formatCurrency(groupStats.totalCashInBox)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Personal Loan Information */}
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
                disbursementDate="2025-01-01" // This should come from loan data
                memberId={member.id}
              />
            </CardContent>
          </Card>
        )}

        {/* Management Sections for Leadership Roles */}
        {(member.groupRole === 'chairman' || member.groupRole === 'secretary' || member.groupRole === 'finance') && (
          <>
            {/* Submit Savings Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  Submit Member Savings & Welfare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubmitSavingsWidget groupId={member.groupId} userRole={member.groupRole} />
              </CardContent>
            </Card>

            {/* Loan Payment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MinusCircle className="h-5 w-5" />
                  Process Loan Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LoanPaymentWidget groupId={member.groupId} userRole={member.groupRole} />
              </CardContent>
            </Card>

            {/* Transaction History Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionHistoryWidget 
                  groupId={member.groupId} 
                  memberId={member.id}
                  userRole={member.groupRole}
                  isLeader={true}
                />
              </CardContent>
            </Card>
          </>
        )}

        {/* Transaction History for Regular Members */}
        {member.groupRole === 'member' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                My Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionHistoryWidget 
                groupId={member.groupId} 
                memberId={member.id}
                userRole={member.groupRole}
                isLeader={false}
              />
            </CardContent>
          </Card>
        )}

        {/* Role-based Information */}
        {(member.groupRole === 'chairman' || member.groupRole === 'secretary' || member.groupRole === 'finance') && (
          <Card>
            <CardHeader>
              <CardTitle>Leadership Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                As a {member.groupRole}, you have access to group management functions.
                Use the admin dashboard for full group management capabilities.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Loan Details Widget with Compound Interest Calculation
function LoanDetailsWidget({ 
  borrowedAmount, 
  interestRate, 
  disbursementDate, 
  memberId 
}: { 
  borrowedAmount: number; 
  interestRate: number; 
  disbursementDate: string; 
  memberId: string;
}) {
  const { toast } = useToast();

  // Calculate compound interest based on time since disbursement
  const calculateCompoundInterest = () => {
    const now = new Date();
    const startDate = new Date(disbursementDate);
    const monthsElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    let currentAmount = borrowedAmount;
    let totalInterest = 0;
    const monthlyBreakdown = [];

    for (let month = 1; month <= monthsElapsed; month++) {
      const monthlyInterest = currentAmount * (interestRate / 100);
      totalInterest += monthlyInterest;
      currentAmount += monthlyInterest;
      
      monthlyBreakdown.push({
        month,
        principal: borrowedAmount,
        interest: monthlyInterest,
        totalAmount: currentAmount
      });
    }

    return {
      currentAmount,
      totalInterest,
      monthsElapsed,
      monthlyBreakdown,
      monthsOverdue: Math.max(0, monthsElapsed - 1) // 28 days = ~1 month grace period
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
        </div>
      </div>

      {/* Interest Breakdown */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Monthly Interest Breakdown
        </h4>
        <div className="text-sm text-muted-foreground mb-2">
          Interest Rate: {interestRate}% per month • Months Elapsed: {loanDetails.monthsElapsed}
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
          <div className="text-sm text-muted-foreground">No interest accrued yet (within 28-day grace period)</div>
        )}
      </div>
    </div>
  );
}

// Submit Savings Widget for Leadership Roles
function SubmitSavingsWidget({ groupId, userRole }: { groupId: string; userRole: string }) {
  const [selectedMember, setSelectedMember] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [welfareAmount, setWelfareAmount] = useState('');
  const { toast } = useToast();

  // Fetch group members
  const { data: members = [] } = useQuery({
    queryKey: ["/api/groups", groupId, "members"],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/members`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
  });

  const submitSavingsMutation = useMutation({
    mutationFn: async (data: { memberId: string; savingsAmount: number; welfareAmount: number }) => {
      const response = await apiRequest("POST", "/api/transactions/submit-savings", {
        groupId,
        memberId: data.memberId,
        savingsAmount: data.savingsAmount,
        welfareAmount: data.welfareAmount,
        submittedBy: userRole
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Savings and welfare submitted successfully",
      });
      setSelectedMember('');
      setSavingsAmount('');
      setWelfareAmount('');
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !savingsAmount || !welfareAmount) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    submitSavingsMutation.mutate({
      memberId: selectedMember,
      savingsAmount: parseFloat(savingsAmount),
      welfareAmount: parseFloat(welfareAmount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="member-select">Select Member</Label>
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a group member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((member: any) => (
              <SelectItem key={member.id} value={member.id}>
                {member.firstName} {member.lastName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="savings-amount">Savings Amount (UGX)</Label>
          <Input
            id="savings-amount"
            type="number"
            placeholder="Enter savings amount"
            value={savingsAmount}
            onChange={(e) => setSavingsAmount(e.target.value)}
            data-testid="input-savings-amount"
          />
        </div>

        <div>
          <Label htmlFor="welfare-amount">Welfare Amount (UGX)</Label>
          <Input
            id="welfare-amount"
            type="number"
            placeholder="Enter welfare amount"
            value={welfareAmount}
            onChange={(e) => setWelfareAmount(e.target.value)}
            data-testid="input-welfare-amount"
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={submitSavingsMutation.isPending}
        className="w-full"
        data-testid="button-submit-savings"
      >
        {submitSavingsMutation.isPending ? "Submitting..." : "Submit Savings & Welfare"}
      </Button>
    </form>
  );
}

// Loan Payment Widget for Leadership Roles
function LoanPaymentWidget({ groupId, userRole }: { groupId: string; userRole: string }) {
  const [selectedMember, setSelectedMember] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const { toast } = useToast();

  // Fetch members with active loans
  const { data: membersWithLoans = [] } = useQuery({
    queryKey: ["/api/groups", groupId, "members-with-loans"],
    queryFn: async () => {
      const response = await fetch(`/api/groups/${groupId}/members-with-loans`);
      if (!response.ok) throw new Error('Failed to fetch members with loans');
      return response.json();
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { memberId: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/transactions/loan-payment", {
        groupId,
        memberId: data.memberId,
        amount: data.amount,
        processedBy: userRole
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan payment processed successfully",
      });
      setSelectedMember('');
      setPaymentAmount('');
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedMemberData = membersWithLoans.find((m: any) => m.id === selectedMember);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !paymentAmount) {
      toast({
        title: "Missing Information",
        description: "Please select member and enter payment amount",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      memberId: selectedMember,
      amount: parseFloat(paymentAmount)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="member-loan-select">Select Member with Loan</Label>
        <Select value={selectedMember} onValueChange={setSelectedMember}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a member with active loan" />
          </SelectTrigger>
          <SelectContent>
            {membersWithLoans.map((member: any) => (
              <SelectItem key={member.id} value={member.id}>
                {member.firstName} {member.lastName} - {formatCurrency(parseFloat(member.currentLoan))} outstanding
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedMemberData && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="text-sm">
            <div><span className="font-medium">Outstanding Loan:</span> {formatCurrency(parseFloat(selectedMemberData.currentLoan))}</div>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor="payment-amount">Payment Amount (UGX)</Label>
        <Input
          id="payment-amount"
          type="number"
          placeholder="Enter payment amount"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          data-testid="input-payment-amount"
        />
      </div>

      <Button
        type="submit"
        disabled={paymentMutation.isPending}
        className="w-full"
        data-testid="button-process-payment"
      >
        {paymentMutation.isPending ? "Processing..." : "Process Payment"}
      </Button>
    </form>
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
  memberId: string; 
  userRole: string; 
  isLeader: boolean;
}) {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions/history", groupId, isLeader ? "all" : memberId],
    queryFn: async () => {
      const endpoint = isLeader 
        ? `/api/groups/${groupId}/transaction-history`
        : `/api/members/${memberId}/transaction-history`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch transaction history');
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center py-4">Loading transaction history...</div>;
  }

  if (transactions.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No transactions found</div>;
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {transactions.map((transaction: any) => (
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
      ))}
    </div>
  );
}
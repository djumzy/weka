import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Download, Users, DollarSign, TrendingUp, FileText, Calendar } from "lucide-react";

export default function Reports() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("month");

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: loans = [] } = useQuery({
    queryKey: ["/api/loans"],
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  // Calculate financial metrics
  const calculateFinancialMetrics = () => {
    const totalDeposits = transactions
      .filter((t: any) => t.type === 'deposit')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const totalWithdrawals = transactions
      .filter((t: any) => t.type === 'withdrawal')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    const totalLoansDisbursed = loans
      .filter((l: any) => l.status === 'active' || l.status === 'completed')
      .reduce((sum: number, l: any) => sum + parseFloat(l.amount), 0);

    const totalLoanPayments = transactions
      .filter((t: any) => t.type === 'loan_payment')
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

    return {
      totalDeposits,
      totalWithdrawals,
      totalLoansDisbursed,
      totalLoanPayments,
      netSavings: totalDeposits - totalWithdrawals,
    };
  };

  const financialMetrics = calculateFinancialMetrics();

  // Get group performance data
  const getGroupPerformance = () => {
    return groups.map((group: any) => {
      const groupMembers = members.filter((m: any) => m.groupId === group.id);
      const groupTransactions = transactions.filter((t: any) => t.groupId === group.id);
      const groupLoans = loans.filter((l: any) => l.groupId === group.id);
      
      const totalSavings = groupMembers.reduce((sum: number, m: any) => sum + parseFloat(m.savingsBalance || 0), 0);
      const totalTransactions = groupTransactions.length;
      const activeLoans = groupLoans.filter((l: any) => l.status === 'active').length;

      return {
        ...group,
        memberCount: groupMembers.length,
        totalSavings,
        totalTransactions,
        activeLoans,
      };
    });
  };

  const groupPerformance = getGroupPerformance();

  if (statsLoading) {
    return (
      <div className="min-h-screen flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" data-testid="reports-page">
      <AdminSidebar />

      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">Reports</h2>
              <p className="text-muted-foreground">Financial reports and analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40" data-testid="select-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="w-48" data-testid="select-group-filter">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" data-testid="button-export-report">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-88px)]">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Deposits"
              value={`$${financialMetrics.totalDeposits.toFixed(2)}`}
              icon={TrendingUp}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
            />
            <StatsCard
              title="Total Withdrawals"
              value={`$${financialMetrics.totalWithdrawals.toFixed(2)}`}
              icon={TrendingUp}
              iconColor="text-red-600"
              iconBgColor="bg-red-100"
            />
            <StatsCard
              title="Loans Disbursed"
              value={`$${financialMetrics.totalLoansDisbursed.toFixed(2)}`}
              icon={FileText}
              iconColor="text-amber-600"
              iconBgColor="bg-amber-100"
            />
            <StatsCard
              title="Net Savings"
              value={`$${financialMetrics.netSavings.toFixed(2)}`}
              icon={DollarSign}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted/25 rounded-lg">
                    <span className="text-sm font-medium">Total Members</span>
                    <span className="text-lg font-bold" data-testid="summary-total-members">
                      {stats?.totalMembers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/25 rounded-lg">
                    <span className="text-sm font-medium">Active Groups</span>
                    <span className="text-lg font-bold" data-testid="summary-active-groups">
                      {stats?.totalGroups || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/25 rounded-lg">
                    <span className="text-sm font-medium">Total Transactions</span>
                    <span className="text-lg font-bold" data-testid="summary-total-transactions">
                      {transactions.length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/25 rounded-lg">
                    <span className="text-sm font-medium">Outstanding Loans</span>
                    <span className="text-lg font-bold" data-testid="summary-outstanding-loans">
                      {stats?.activeLoans || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Loan Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Approved Loans</span>
                    <span className="text-lg font-bold text-green-800">
                      {loans.filter((l: any) => l.status === 'approved' || l.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm font-medium text-yellow-800">Pending Applications</span>
                    <span className="text-lg font-bold text-yellow-800">
                      {loans.filter((l: any) => l.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm font-medium text-blue-800">Repayment Rate</span>
                    <span className="text-lg font-bold text-blue-800">
                      {loans.length > 0 
                        ? ((financialMetrics.totalLoanPayments / financialMetrics.totalLoansDisbursed * 100).toFixed(1))
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-red-800">Defaulted Loans</span>
                    <span className="text-lg font-bold text-red-800">
                      {loans.filter((l: any) => l.status === 'defaulted').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Group Performance */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Group Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {groupPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No groups available for analysis
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Group Name</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Members</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Total Savings</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Transactions</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Active Loans</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupPerformance.map((group: any) => (
                        <tr key={group.id} className="border-b border-border hover:bg-muted/25">
                          <td className="p-3 text-sm font-medium text-foreground" data-testid={`group-name-${group.id}`}>
                            {group.name}
                          </td>
                          <td className="p-3 text-sm text-foreground">{group.memberCount}</td>
                          <td className="p-3 text-sm text-foreground">${group.totalSavings.toFixed(2)}</td>
                          <td className="p-3 text-sm text-foreground">{group.totalTransactions}</td>
                          <td className="p-3 text-sm text-foreground">{group.activeLoans}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              group.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {group.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Quick Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex-col" data-testid="button-member-report">
                  <Users className="w-6 h-6 mb-2" />
                  Member Report
                </Button>
                <Button variant="outline" className="h-20 flex-col" data-testid="button-financial-report">
                  <DollarSign className="w-6 h-6 mb-2" />
                  Financial Report
                </Button>
                <Button variant="outline" className="h-20 flex-col" data-testid="button-loan-report">
                  <FileText className="w-6 h-6 mb-2" />
                  Loan Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

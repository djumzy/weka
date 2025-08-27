import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { StatsCard } from "@/components/StatsCard";
import { TransactionRow } from "@/components/TransactionRow";
import { GroupCard } from "@/components/GroupCard";
import { PendingActionCard } from "@/components/PendingActionCard";
import { QuickActionButton } from "@/components/QuickActionButton";
import { NewGroupModal } from "@/components/modals/NewGroupModal";
import { GroupDetailsModal } from "@/components/GroupDetailsModal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/utils/currency";
import { Users, User, DollarSign, FileText, Calendar, Plus, Wallet, UserCheck, UserX } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isGroupDetailsOpen, setIsGroupDetailsOpen] = useState(false);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  // Fetch groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/groups"],
  });

  // Fetch recent transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  // Fetch members to get names for transactions
  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  const getMemberName = (memberId: string) => {
    const member = members.find((m: any) => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : "Unknown Member";
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find((g: any) => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  const recentTransactions = transactions.slice(0, 5);

  if (statsLoading || groupsLoading || transactionsLoading) {
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
    <div className="min-h-screen flex" data-testid="dashboard-page">
      <AdminSidebar />

      <main className="flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">Dashboard</h2>
              <p className="text-muted-foreground">Welcome back! Here's an overview of your WEKA groups.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="w-48" data-testid="select-group-filter">
                  <SelectValue placeholder="Select group" />
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

              <Link href="/login">
                <Button variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  Unified Login
                </Button>
              </Link>

              <Button 
                onClick={() => setIsNewGroupModalOpen(true)}
                data-testid="button-new-group"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Group
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-88px)]">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatsCard
              title="Total Groups"
              value={stats?.totalGroups || 0}
              icon={Users}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
              trend={{ value: "+2", label: "this month", isPositive: true }}
            />
            <StatsCard
              title="Total Members"
              value={stats?.totalMembers || 0}
              icon={User}
              iconColor="text-green-600"
              iconBgColor="bg-green-100"
              trend={{ 
                value: `M: ${stats?.maleMembers || 0} | F: ${stats?.femaleMembers || 0}`, 
                label: "gender breakdown", 
                isPositive: true 
              }}
            />
            <StatsCard
              title="Total Savings"
              value={formatCurrency(stats?.totalSavings || 0)}
              icon={DollarSign}
              iconColor="text-blue-600"
              iconBgColor="bg-blue-100"
              trend={{ value: "+12.5%", label: "vs last month", isPositive: true }}
            />
            <StatsCard
              title="Total Welfare"
              value={formatCurrency(stats?.totalWelfare || 0)}
              icon={UserCheck}
              iconColor="text-purple-600"
              iconBgColor="bg-purple-100"
              trend={{ value: formatCurrency(stats?.totalWelfare || 0), label: "welfare fund" }}
            />
            <StatsCard
              title="Available Cash in Box"
              value={formatCurrency(stats?.totalCashInBox || 0)}
              icon={Wallet}
              iconColor="text-emerald-600"
              iconBgColor="bg-emerald-100"
              trend={{ value: formatCurrency(stats?.totalCashInBox || 0), label: "total available" }}
            />
            <StatsCard
              title="Total Loans Given"
              value={formatCurrency(stats?.totalLoansGiven || 0)}
              icon={FileText}
              iconColor="text-orange-600"
              iconBgColor="bg-orange-100"
              trend={{ value: `${stats?.activeLoans || 0} active`, label: "active loans", isPositive: true }}
            />
            <StatsCard
              title="Total Interest"
              value={formatCurrency(stats?.totalInterest || 0)}
              icon={FileText}
              iconColor="text-indigo-600"
              iconBgColor="bg-indigo-100"
              trend={{ value: formatCurrency(stats?.totalInterest || 0), label: "interest earned" }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Transactions */}
            <div className="lg:col-span-2 bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
                  <Button variant="ghost" size="sm" data-testid="button-view-all-transactions">
                    View All
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Member</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Group</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No transactions found
                        </td>
                      </tr>
                    ) : (
                      recentTransactions.map((transaction: any) => (
                        <TransactionRow
                          key={transaction.id}
                          transaction={transaction}
                          memberName={getMemberName(transaction.memberId)}
                          groupName={getGroupName(transaction.groupId)}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <QuickActionButton
                  title="Add Member"
                  description="Register new member"
                  icon={User}
                  iconColor="text-primary"
                  iconBgColor="bg-primary/10"
                  onClick={() => {}}
                  testId="button-add-member"
                />
                <QuickActionButton
                  title="Record Transaction"
                  description="Log deposit or withdrawal"
                  icon={DollarSign}
                  iconColor="text-green-600"
                  iconBgColor="bg-green-100"
                  onClick={() => {}}
                  testId="button-record-transaction"
                />
                <QuickActionButton
                  title="Process Loan"
                  description="Review loan applications"
                  icon={FileText}
                  iconColor="text-amber-600"
                  iconBgColor="bg-amber-100"
                  onClick={() => {}}
                  testId="button-process-loan"
                />
                <QuickActionButton
                  title="Schedule Meeting"
                  description="Plan group meeting"
                  icon={Calendar}
                  iconColor="text-blue-600"
                  iconBgColor="bg-blue-100"
                  onClick={() => {}}
                  testId="button-schedule-meeting"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Group Overview */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Group Overview</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {groups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No groups found
                    </div>
                  ) : (
                    groups.slice(0, 3).map((group: any) => (
                      <GroupCard
                        key={group.id}
                        group={group}
                        memberCount={members.filter((m: any) => m.groupId === group.id).length}
                        totalSavings={members
                          .filter((m: any) => m.groupId === group.id)
                          .reduce((sum: number, m: any) => sum + parseFloat(m.savingsBalance || 0), 0)
                        }
                        onViewClick={(group) => {
                          setSelectedGroup(group);
                          setIsGroupDetailsOpen(true);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Pending Actions */}
            <div className="bg-card rounded-lg border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold text-foreground">Pending Actions</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="text-center py-8 text-muted-foreground">
                    No pending actions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <NewGroupModal
        open={isNewGroupModalOpen}
        onOpenChange={setIsNewGroupModalOpen}
      />

      <GroupDetailsModal
        group={selectedGroup}
        isOpen={isGroupDetailsOpen}
        onClose={() => {
          setIsGroupDetailsOpen(false);
          setSelectedGroup(null);
        }}
      />
    </div>
  );
}

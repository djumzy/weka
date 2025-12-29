import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText } from "lucide-react";
import { format } from "date-fns";

export default function Loans() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const { data: loans = [], isLoading: loansLoading } = useQuery({
    queryKey: ["/api/loans"],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
  });

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

  const filteredLoans = loans.filter((loan: any) => {
    const matchesGroup = selectedGroupId === "all" || loan.groupId === selectedGroupId;
    const matchesStatus = selectedStatus === "all" || loan.status === selectedStatus;
    return matchesGroup && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-blue-100 text-blue-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      defaulted: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  if (loansLoading) {
    return (
      <div className="min-h-screen flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" data-testid="loans-page">
      <AdminSidebar />

      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">Loans</h2>
              <p className="text-muted-foreground">Manage loan applications and disbursements</p>
            </div>
            <Button data-testid="button-new-loan">
              <Plus className="w-4 h-4 mr-2" />
              New Loan Application
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-88px)]">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
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

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="defaulted">Defaulted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loans Table */}
          {filteredLoans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No loans found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedGroupId !== "all" || selectedStatus !== "all" 
                  ? "Try adjusting your filters" 
                  : "Process your first loan application to get started"
                }
              </p>
              {selectedGroupId === "all" && selectedStatus === "all" && (
                <Button data-testid="button-first-loan">
                  <Plus className="w-4 h-4 mr-2" />
                  First Loan Application
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Member</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Group</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Interest Rate</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Term</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Application Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLoans.map((loan: any) => (
                      <tr 
                        key={loan.id} 
                        className="border-b border-border hover:bg-muted/25"
                        data-testid={`loan-row-${loan.id}`}
                      >
                        <td className="p-4 text-sm text-foreground" data-testid={`loan-member-${loan.id}`}>
                          {getMemberName(loan.memberId)}
                        </td>
                        <td className="p-4 text-sm text-foreground" data-testid={`loan-group-${loan.id}`}>
                          {getGroupName(loan.groupId)}
                        </td>
                        <td className="p-4 text-sm font-medium text-foreground" data-testid={`loan-amount-${loan.id}`}>
                          ${parseFloat(loan.amount).toFixed(2)}
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {parseFloat(loan.interestRate).toFixed(1)}%
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {loan.termMonths} months
                        </td>
                        <td className="p-4">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(loan.status)}`}
                            data-testid={`loan-status-${loan.id}`}
                          >
                            {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {format(new Date(loan.applicationDate), "MMM dd, yyyy")}
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" data-testid={`button-view-loan-${loan.id}`}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

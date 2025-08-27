import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Building2, Calendar, DollarSign, Users, MapPin, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Group, Member, Transaction } from "@shared/schema";
import { format } from "date-fns";

interface GroupDetailsModalProps {
  group: Group | null;
  isOpen: boolean;
  onClose: () => void;
}

export function GroupDetailsModal({ group, isOpen, onClose }: GroupDetailsModalProps) {
  // Fetch group members
  const { data: members = [], isLoading: membersLoading } = useQuery<Member[]>({
    queryKey: ["/api/members", group?.id],
    queryFn: async () => {
      const response = await fetch(`/api/members?groupId=${group?.id}`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!group?.id && isOpen,
  });

  // Fetch group transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", group?.id],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?groupId=${group?.id}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!group?.id && isOpen,
  });

  if (!group) return null;

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const totalSavings = members.reduce((sum, member) => 
    sum + parseFloat(member.savingsBalance || '0'), 0
  );

  const totalLoans = members.reduce((sum, member) => 
    sum + parseFloat(member.currentLoan || '0'), 0
  );

  const savingsTransactions = transactions.filter(t => 
    t.type === 'deposit' || t.type === 'withdrawal'
  );

  const loanTransactions = transactions.filter(t => 
    t.type === 'loan_payment' || t.type === 'loan_disbursement'
  );

  const leaders = members.filter(member => 
    ['chairman', 'secretary', 'finance'].includes(member.groupRole)
  );

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {group.name} - Group Overview
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Group Information */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Group Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{group.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Founded: {format(new Date(group.registrationDate), 'PPP')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Meets: {group.meetingFrequency}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Reg #: {group.registrationNumber || 'N/A'}</span>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Activities</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Main: {group.mainActivity || 'N/A'}</p>
                  <p>Other: {group.otherActivities || 'N/A'}</p>
                </div>
              </div>

              {group.hasRunningBusiness && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Business</p>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>{group.businessName}</p>
                      <p>{group.businessLocation}</p>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Leadership Team</p>
                <div className="space-y-2">
                  {leaders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No leaders assigned</p>
                  ) : (
                    leaders.map((leader) => (
                      <div key={leader.id} className="flex items-center justify-between">
                        <span className="text-sm">{leader.firstName} {leader.lastName}</span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {leader.groupRole}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary & History */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Financial Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Financial Overview */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Total Savings</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(totalSavings)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <DollarSign className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Total Loans</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(totalLoans)}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <DollarSign className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Available Cash</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(group.availableCash || 0)}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Members Summary */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Members ({members.length})</h4>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <ScrollArea className="h-32">
                  {membersLoading ? (
                    <div className="flex items-center justify-center h-24">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : members.length === 0 ? (
                    <div className="text-center text-muted-foreground py-6">
                      No members in this group
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                            <p className="text-xs text-muted-foreground capitalize">{member.groupRole}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">{formatCurrency(member.savingsBalance)}</p>
                            <p className="text-xs text-muted-foreground">Savings</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              <Separator />

              {/* Transaction History */}
              <div>
                <h4 className="font-medium mb-3">Recent Transactions</h4>
                <ScrollArea className="h-40">
                  {transactionsLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      No transactions found
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions
                        .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                        .slice(0, 10) // Show last 10 transactions
                        .map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              transaction.type === 'deposit' ? 'bg-green-500' :
                              transaction.type === 'withdrawal' ? 'bg-red-500' :
                              transaction.type === 'loan_disbursement' ? 'bg-blue-500' :
                              'bg-yellow-500'
                            }`} />
                            <div>
                              <p className="text-sm font-medium capitalize">
                                {transaction.type.replace('_', ' ')}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className={`font-bold text-sm ${
                            transaction.type === 'deposit' || transaction.type === 'loan_disbursement' 
                              ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'deposit' || transaction.type === 'loan_disbursement' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
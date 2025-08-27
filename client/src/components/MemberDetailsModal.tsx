import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, User, Phone, Mail, MapPin, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Member, Transaction } from "@shared/schema";
import { format } from "date-fns";

interface MemberDetailsModalProps {
  member: Member | null;
  groupName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberDetailsModal({ member, groupName, isOpen, onClose }: MemberDetailsModalProps) {
  // Fetch member's transaction history
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", member?.id],
    enabled: !!member?.id && isOpen,
  });

  if (!member) return null;

  const savingsTransactions = transactions.filter(t => 
    t.type === 'deposit' || t.type === 'withdrawal'
  );

  const loanTransactions = transactions.filter(t => 
    t.type === 'loan_payment' || t.type === 'loan_disbursement'
  );

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'chairman': return 'destructive';
      case 'secretary': return 'default';
      case 'finance': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {member.firstName} {member.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                  <p className="font-medium">{member.firstName} {member.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gender</p>
                  <p className="font-medium">{member.gender === 'M' ? 'Male' : 'Female'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Role</p>
                  <Badge variant={getRoleBadgeVariant(member.groupRole)} className="capitalize">
                    {member.groupRole}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Group</p>
                  <p className="font-medium">{groupName}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                {member.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{member.email}</span>
                  </div>
                )}
                {member.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{member.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Joined: {format(new Date(member.joinDate), 'PPP')}</span>
                </div>
                {member.nextOfKin && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Next of Kin: {member.nextOfKin}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Current Savings</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(member.savingsBalance)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <DollarSign className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Current Loan</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(member.currentLoan)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Quick Stats</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Deposits:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(
                        savingsTransactions
                          .filter(t => t.type === 'deposit')
                          .reduce((sum, t) => sum + Number(t.amount), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Withdrawals:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(
                        savingsTransactions
                          .filter(t => t.type === 'withdrawal')
                          .reduce((sum, t) => sum + Number(t.amount), 0)
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Loan Payments:</span>
                    <span className="font-medium">
                      {formatCurrency(
                        loanTransactions
                          .filter(t => t.type === 'loan_payment')
                          .reduce((sum, t) => sum + Number(t.amount), 0)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Transaction History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {transactionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No transactions found
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions
                    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                    .map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          transaction.type === 'deposit' ? 'bg-green-500' :
                          transaction.type === 'withdrawal' ? 'bg-red-500' :
                          transaction.type === 'loan_disbursement' ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} />
                        <div>
                          <p className="font-medium capitalize">
                            {transaction.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(transaction.transactionDate), 'PPp')}
                          </p>
                          {transaction.description && (
                            <p className="text-sm text-muted-foreground">{transaction.description}</p>
                          )}
                        </div>
                      </div>
                      <div className={`font-bold ${
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
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
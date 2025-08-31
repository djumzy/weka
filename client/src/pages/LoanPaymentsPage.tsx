import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MinusCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function LoanPaymentsPage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [memberSession, setMemberSession] = useState<any>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Load member session for leadership roles
  useEffect(() => {
    const sessionData = localStorage.getItem('memberSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setMemberSession(session);
      if (session.member?.groupId) {
        setSelectedGroup(session.member.groupId);
      }
    }
  }, []);

  // Check if user is leadership role
  const isLeadershipRole = memberSession && ['chairman', 'secretary', 'finance'].includes(memberSession.member?.groupRole);

  // Fetch groups (only for admin users)
  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    enabled: isAuthenticated && !isLeadershipRole, // Only fetch for admin users
  });

  // Fetch members with active loans for selected group
  const { data: membersWithLoans = [] } = useQuery({
    queryKey: ["/api/groups", selectedGroup, "members-with-loans"],
    queryFn: async () => {
      if (!selectedGroup) return [];
      const response = await fetch(`/api/groups/${selectedGroup}/members-with-loans`);
      if (!response.ok) throw new Error('Failed to fetch members with loans');
      return response.json();
    },
    enabled: !!selectedGroup,
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: { groupId: string; memberId: string; amount: number }) => {
      const response = await apiRequest("POST", "/api/transactions/loan-payment", {
        groupId: data.groupId,
        memberId: data.memberId,
        amount: data.amount,
        processedBy: "admin" // Could be dynamic based on current user role
      });
      return response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Success",
        description: "Loan payment processed successfully",
      });
      setSelectedMember('');
      setPaymentAmount('');
      
      // Update localStorage if this is a member session
      if (memberSession && response.updatedMember) {
        const updatedSession = {
          ...memberSession,
          member: {
            ...memberSession.member,
            currentLoan: response.updatedMember.currentLoan,
            savingsBalance: response.updatedMember.savingsBalance
          },
          groupStats: response.updatedGroupStats || memberSession.groupStats
        };
        localStorage.setItem('memberSession', JSON.stringify(updatedSession));
        setMemberSession(updatedSession); // Also update local state
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/member-session"] });
      
      // Force refresh member dashboard if user is on it
      window.dispatchEvent(new CustomEvent('memberDataUpdated'));
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
    if (!selectedGroup || !selectedMember || !paymentAmount) {
      toast({
        title: "Missing Information",
        description: "Please select group, member and enter payment amount",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    const memberCurrentLoan = parseFloat(selectedMemberData?.currentLoan || '0');
    if (amount > memberCurrentLoan) {
      toast({
        title: "Payment Too High",
        description: `Payment cannot exceed current loan balance of ${formatCurrency(memberCurrentLoan)}`,
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      groupId: selectedGroup,
      memberId: selectedMember,
      amount: amount
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MinusCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Process Loan Payments</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Process Loan Payments for Group Members</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Show group selection only for admin users */}
            {!isLeadershipRole && (
              <div>
                <Label htmlFor="group-select">Select Group</Label>
                <Select value={selectedGroup} onValueChange={(value) => {
                  setSelectedGroup(value);
                  setSelectedMember(''); // Reset member selection when group changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {(groups as any[]).map((group: any) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.groupName} - {group.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Show group info for leadership users */}
            {isLeadershipRole && memberSession && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm">
                  <div><span className="font-medium">Group:</span> {memberSession.member?.groupName || 'Unknown Group'}</div>
                  <div><span className="font-medium">Your Role:</span> {memberSession.member?.groupRole}</div>
                </div>
              </div>
            )}

            {selectedGroup && (
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
            )}

            {selectedMemberData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm">
                  <div><span className="font-medium">Member:</span> {selectedMemberData.firstName} {selectedMemberData.lastName}</div>
                  <div><span className="font-medium">Outstanding Loan:</span> {formatCurrency(parseFloat(selectedMemberData.currentLoan))}</div>
                  <div><span className="font-medium">Phone:</span> {selectedMemberData.phone}</div>
                </div>
              </div>
            )}

            {selectedMember && (
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
                <div className="text-xs text-muted-foreground mt-1">
                  Maximum amount: {selectedMemberData ? formatCurrency(parseFloat(selectedMemberData.currentLoan)) : '0'}
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={paymentMutation.isPending || !selectedGroup || !selectedMember}
              className="w-full"
              data-testid="button-process-payment"
            >
              {paymentMutation.isPending ? "Processing..." : "Process Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
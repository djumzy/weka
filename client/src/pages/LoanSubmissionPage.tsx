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
import { FileText, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function LoanSubmissionPage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [repaymentPeriod, setRepaymentPeriod] = useState('');
  const [memberSession, setMemberSession] = useState<any>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Load member session for leadership roles
  useEffect(() => {
    // Fetch member session from backend instead of localStorage
    fetch('/api/member-session')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        return null;
      })
      .then(session => {
        if (session?.member) {
          setMemberSession(session);
          if (session.member.groupId) {
            setSelectedGroup(session.member.groupId);
          }
        }
      })
      .catch(error => {
        console.log('Member session not available:', error.message);
      });
  }, []);

  // Check if user is leadership role
  const isLeadershipRole = memberSession && ['chairman', 'secretary', 'finance'].includes(memberSession.member?.groupRole);

  // Fetch groups (only for admin users)
  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    enabled: isAuthenticated && !isLeadershipRole, // Only fetch for admin users
  });

  // Fetch all members for selected group (regardless of role)
  const { data: members = [] } = useQuery({
    queryKey: ["/api/groups", selectedGroup, "members"],
    enabled: !!selectedGroup,
  });

  // Get selected group data for loan limits
  const selectedGroupData = (groups as any[]).find((g: any) => g.id === selectedGroup);

  const submitLoanMutation = useMutation({
    mutationFn: async (data: { 
      groupId: string; 
      memberId: string; 
      amount: string; 
      purpose: string; 
      repaymentPeriodMonths: number; 
    }) => {
      const response = await apiRequest("POST", "/api/loans", {
        groupId: data.groupId,
        memberId: data.memberId,
        amount: data.amount,
        purpose: data.purpose,
        repaymentPeriodMonths: data.repaymentPeriodMonths,
        applicationDate: new Date().toISOString(),
        status: "approved", // Auto-approve for admin submission
        approvedBy: "admin",
        approvedDate: new Date().toISOString()
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Loan submitted successfully",
      });
      setSelectedMember('');
      setLoanAmount('');
      setLoanPurpose('');
      setRepaymentPeriod('');
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
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

  const selectedMemberData = members.find((m: any) => m.id === selectedMember);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedMember || !loanAmount || !loanPurpose || !repaymentPeriod) {
      toast({
        title: "Missing Information",
        description: "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(loanAmount);
    const maxLoanAmount = selectedGroupData ? parseFloat(selectedGroupData.maxLoanAmount || '0') : 0;

    if (maxLoanAmount > 0 && amount > maxLoanAmount) {
      toast({
        title: "Loan Amount Too High",
        description: `Maximum loan amount for this group is ${formatCurrency(maxLoanAmount)}`,
        variant: "destructive",
      });
      return;
    }

    submitLoanMutation.mutate({
      groupId: selectedGroup,
      memberId: selectedMember,
      amount: loanAmount,
      purpose: loanPurpose,
      repaymentPeriodMonths: parseInt(repaymentPeriod)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Submit Loan for Group Members</h1>
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
          <CardTitle>Submit Loan Application</CardTitle>
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

            {selectedGroup && selectedGroupData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <div className="text-sm">
                  <div><span className="font-medium">Group:</span> {selectedGroupData.groupName}</div>
                  <div><span className="font-medium">Interest Rate:</span> {selectedGroupData.interestRate}% per month</div>
                  <div><span className="font-medium">Max Loan Amount:</span> {formatCurrency(parseFloat(selectedGroupData.maxLoanAmount || '0'))}</div>
                </div>
              </div>
            )}

            {selectedGroup && (
              <div className="space-y-4">
                <Label htmlFor="member-select">Select Member for Loan</Label>
                
                {/* Role-based member selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Chairman</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select chairman" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.filter((member: any) => member.groupRole === 'chairman').map((member: any) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Secretary</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select secretary" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.filter((member: any) => member.groupRole === 'secretary').map((member: any) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Finance</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select finance" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.filter((member: any) => member.groupRole === 'finance').map((member: any) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Members</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.filter((member: any) => member.groupRole === 'member').map((member: any) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.firstName} {member.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Show selected member details */}
                {selectedMember && members.find((m: any) => m.id === selectedMember) && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Selected:</span> {' '}
                      {members.find((m: any) => m.id === selectedMember)?.firstName} {' '}
                      {members.find((m: any) => m.id === selectedMember)?.lastName} {' '}
                      ({members.find((m: any) => m.id === selectedMember)?.groupRole}) - {' '}
                      Current Loan: {formatCurrency(parseFloat(members.find((m: any) => m.id === selectedMember)?.currentLoan || '0'))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedMemberData && (
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="text-sm">
                  <div><span className="font-medium">Member:</span> {selectedMemberData.firstName} {selectedMemberData.lastName}</div>
                  <div><span className="font-medium">Role:</span> {selectedMemberData.groupRole}</div>
                  <div><span className="font-medium">Current Savings:</span> {formatCurrency(parseFloat(selectedMemberData.savingsBalance))}</div>
                  <div><span className="font-medium">Current Loan:</span> {formatCurrency(parseFloat(selectedMemberData.currentLoan))}</div>
                </div>
              </div>
            )}

            {selectedMember && (
              <>
                <div>
                  <Label htmlFor="loan-amount">Loan Amount (UGX)</Label>
                  <Input
                    id="loan-amount"
                    type="number"
                    placeholder="Enter loan amount"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    data-testid="input-loan-amount"
                  />
                  {selectedGroupData && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Maximum: {formatCurrency(parseFloat(selectedGroupData.maxLoanAmount || '0'))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="loan-purpose">Loan Purpose</Label>
                  <Input
                    id="loan-purpose"
                    placeholder="Enter the purpose of the loan"
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    data-testid="input-loan-purpose"
                  />
                </div>

                <div>
                  <Label htmlFor="repayment-period">Repayment Period (Months)</Label>
                  <Select value={repaymentPeriod} onValueChange={setRepaymentPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select repayment period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Month</SelectItem>
                      <SelectItem value="2">2 Months</SelectItem>
                      <SelectItem value="3">3 Months</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={submitLoanMutation.isPending || !selectedGroup || !selectedMember}
              className="w-full"
              data-testid="button-submit-loan"
            >
              {submitLoanMutation.isPending ? "Submitting..." : "Submit Loan Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
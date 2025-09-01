import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DollarSign, ArrowLeft } from "lucide-react";
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

  const selectedMemberData = (members as any[]).find((m: any) => m.id === selectedMember);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedMember || !loanAmount || !loanPurpose || !repaymentPeriod) {
      toast({
        title: "Missing Information",
        description: "Please select group, member, enter loan amount, purpose, and repayment period",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(loanAmount);
    const maxLoanAmount = selectedGroupData ? parseFloat(selectedGroupData.maxLoanAmount || '0') : 0;

    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Loan amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (maxLoanAmount > 0 && amount > maxLoanAmount) {
      toast({
        title: "Loan Amount Too High",
        description: `Maximum loan amount for this group is ${formatCurrency(maxLoanAmount)}`,
        variant: "destructive",
      });
      return;
    }

    // Check if member already has a loan
    const existingLoan = parseFloat(selectedMemberData?.currentLoan || '0');
    if (existingLoan > 0) {
      toast({
        title: "Existing Loan Found",
        description: `This member already has an outstanding loan of ${formatCurrency(existingLoan)}. Please clear existing loan before applying for a new one.`,
        variant: "destructive",
      });
      return;
    }

    // Convert string values to proper numeric types for validation
    const numericAmount = parseFloat(loanAmount);
    const numericTermMonths = parseInt(repaymentPeriod);
    
    // AUTO-DETECT: Get group ID from selected member
    const autoGroupId = selectedMemberData?.groupId;
    
    // AUTO-DETECT: Get interest rate from group agreement
    const groupData = groupsData?.find(group => group.id === autoGroupId);
    const autoInterestRate = groupData?.interestRate || 10; // Fallback to 10% if not found

    // Log data being sent for debugging with auto-detection info
    const loanSubmissionData = {
      groupId: autoGroupId, // AUTO-DETECTED from selected member
      memberId: selectedMember, // Selected member ID
      amount: numericAmount.toString(),
      purpose: loanPurpose || '',
      termMonths: numericTermMonths,
      interestRate: autoInterestRate.toString(), // AUTO-DETECTED from group agreement
      status: 'approved' // AUTO-APPROVED
    };
    
    console.log('=== FRONTEND LOAN SUBMISSION (AUTO-DETECTION) ===');
    console.log('✓ Auto-detected Group ID:', autoGroupId, 'from member:', selectedMemberData?.firstName, selectedMemberData?.lastName);
    console.log('✓ Auto-detected Interest Rate:', autoInterestRate + '%', 'from group agreement');
    console.log('✓ Auto-approved status: approved');
    console.log('Full submission data:', JSON.stringify(loanSubmissionData, null, 2));

    submitLoanMutation.mutate(loanSubmissionData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Submit Loan Application</h1>
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
          <CardTitle>Submit Loan Application for Group Members</CardTitle>
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

            {/* Show read-only group field for leadership users */}
            {isLeadershipRole && memberSession && (
              <div>
                <Label htmlFor="group-display">Group Information</Label>
                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md border">
                  <div className="text-sm">
                    <div className="font-medium">{memberSession.member?.groupName || 'Unknown Group'}</div>
                    <div className="text-xs text-gray-500 mt-1">Your Role: {memberSession.member?.groupRole}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">This group is automatically selected based on your membership.</p>
              </div>
            )}

            {selectedGroup && (
              <div className="space-y-4">
                <Label htmlFor="member-select">Select Member</Label>
                
                {/* Single searchable dropdown for all members */}
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a member from the group" />
                  </SelectTrigger>
                  <SelectContent>
                    {(members as any[]).map((member: any) => {
                      const memberName = `${member.firstName || 'N/A'} ${member.lastName || 'N/A'}`; 
                      const memberRole = member.groupRole ? ` (${member.groupRole})` : '';
                      return (
                        <SelectItem key={member.id} value={member.id}>
                          {memberName}{memberRole}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                {/* Show selected member details */}
                {selectedMember && (members as any[]).find((m: any) => m.id === selectedMember) && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm">
                      <span className="font-medium">Selected:</span> {' '}
                      {(members as any[]).find((m: any) => m.id === selectedMember)?.firstName} {' '}
                      {(members as any[]).find((m: any) => m.id === selectedMember)?.lastName} {' '}
                      ({(members as any[]).find((m: any) => m.id === selectedMember)?.groupRole}) - {' '}
                      Current Loan: {formatCurrency(parseFloat((members as any[]).find((m: any) => m.id === selectedMember)?.currentLoan || '0'))}
                    </p>
                  </div>
                )}
              </div>
            )}


            {selectedMember && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      Maximum: {formatCurrency(parseFloat(selectedGroupData.maxLoanAmount || '0'))} | Interest: {selectedGroupData.interestRate}%/month
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="repayment-period">Repayment Period</Label>
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
                
                <div className="md:col-span-2">
                  <Label htmlFor="loan-purpose">Loan Purpose</Label>
                  <Textarea
                    id="loan-purpose"
                    placeholder="Enter the purpose of the loan"
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    data-testid="input-loan-purpose"
                    className="resize-none"
                    rows={3}
                  />
                </div>
              </div>
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
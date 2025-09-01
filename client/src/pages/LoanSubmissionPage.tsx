import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DollarSign, ArrowLeft, Check, ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export default function LoanSubmissionPage() {
  const [selectedMember, setSelectedMember] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanPurpose, setLoanPurpose] = useState('');
  const [repaymentPeriod, setRepaymentPeriod] = useState('');
  const [memberSearchOpen, setMemberSearchOpen] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch all groups
  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    enabled: isAuthenticated,
  });

  // Fetch all members from all groups
  const { data: allMembers = [] } = useQuery({
    queryKey: ["/api/members"],
    enabled: isAuthenticated,
  });

  const submitLoanMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/loans', data);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Loan application submitted successfully and auto-approved!",
      });
      // Reset form
      setSelectedMember('');
      setLoanAmount('');
      setLoanPurpose('');
      setRepaymentPeriod('');
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
    },
    onError: (error: any) => {
      console.error('Loan submission error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit loan application",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!selectedMember || !loanAmount || !repaymentPeriod) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Find the selected member to get their group
    const selectedMemberData = allMembers.find((member: any) => member.id === selectedMember);
    if (!selectedMemberData) {
      toast({
        title: "Error",
        description: "Selected member not found.",
        variant: "destructive",
      });
      return;
    }

    // Find the group to get interest rate
    const memberGroup = groups.find((group: any) => group.id === selectedMemberData.groupId);
    const interestRate = memberGroup?.interestRate || 10; // Default 10% if not found

    // Prepare data exactly matching database structure
    const loanData = {
      groupId: selectedMemberData.groupId, // AUTO-DETECTED from member
      memberId: selectedMember,
      amount: loanAmount, // Keep as string for decimal
      interestRate: interestRate.toString(), // String for decimal
      termMonths: parseInt(repaymentPeriod), // Number as expected
      status: 'approved', // AUTO-APPROVED
      purpose: loanPurpose || 'General loan' // Optional field
    };

    console.log('=== SUBMITTING LOAN ===');
    console.log('Auto-detected Group ID:', selectedMemberData.groupId);
    console.log('Auto-detected Interest Rate:', interestRate + '%');
    console.log('Final loan data:', loanData);

    submitLoanMutation.mutate(loanData);
  };

  return (
    <div className="space-y-6" data-testid="loan-submission-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Submit Loan Application</h1>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Loan Application</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Member Selection with Search */}
            <div>
              <Label htmlFor="member-select">Select Member *</Label>
              <Popover open={memberSearchOpen} onOpenChange={setMemberSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={memberSearchOpen}
                    className="w-full justify-between"
                    data-testid="select-member"
                  >
                    {selectedMember
                      ? (() => {
                          const member = allMembers.find((m: any) => m.id === selectedMember);
                          const memberGroup = groups.find((g: any) => g.id === member?.groupId);
                          return `${member?.firstName} ${member?.lastName} (${memberGroup?.name || 'Unknown Group'})`;
                        })()
                      : "Search and select a member..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search by name, group, or phone..." />
                    <CommandEmpty>No member found.</CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {allMembers.map((member: any) => {
                        const memberGroup = groups.find((g: any) => g.id === member.groupId);
                        return (
                          <CommandItem
                            key={member.id}
                            value={`${member.firstName} ${member.lastName} ${memberGroup?.name || ''} ${member.phone || ''}`}
                            onSelect={() => {
                              setSelectedMember(member.id);
                              setMemberSearchOpen(false);
                            }}
                            data-testid={`option-member-${member.id}`}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedMember === member.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {member.firstName} {member.lastName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {memberGroup?.name || 'Unknown Group'} • {member.phone || 'No phone'}
                              </span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Loan Amount */}
            <div>
              <Label htmlFor="loan-amount">Loan Amount *</Label>
              <Input
                id="loan-amount"
                type="number"
                step="0.01"
                min="0"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="Enter amount (e.g., 1000.00)"
                data-testid="input-amount"
                required
              />
            </div>

            {/* Loan Purpose */}
            <div>
              <Label htmlFor="loan-purpose">Loan Purpose</Label>
              <Textarea
                id="loan-purpose"
                value={loanPurpose}
                onChange={(e) => setLoanPurpose(e.target.value)}
                placeholder="What is this loan for? (optional)"
                data-testid="input-purpose"
              />
            </div>

            {/* Repayment Period */}
            <div>
              <Label htmlFor="repayment-period">Repayment Period (months) *</Label>
              <Select 
                value={repaymentPeriod} 
                onValueChange={setRepaymentPeriod}
                data-testid="select-term"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose repayment period..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1" data-testid="option-term-1">1 month</SelectItem>
                  <SelectItem value="3" data-testid="option-term-3">3 months</SelectItem>
                  <SelectItem value="6" data-testid="option-term-6">6 months</SelectItem>
                  <SelectItem value="12" data-testid="option-term-12">12 months</SelectItem>
                  <SelectItem value="18" data-testid="option-term-18">18 months</SelectItem>
                  <SelectItem value="24" data-testid="option-term-24">24 months</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Auto-detected Info Display */}
            {selectedMember && (
              <div className="bg-blue-50 p-3 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Auto-detected Information:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>✓ Group: {groups.find((g: any) => g.id === allMembers.find((m: any) => m.id === selectedMember)?.groupId)?.name}</li>
                  <li>✓ Interest Rate: {groups.find((g: any) => g.id === allMembers.find((m: any) => m.id === selectedMember)?.groupId)?.interestRate || 10}% per month</li>
                  <li>✓ Status: Will be auto-approved</li>
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={submitLoanMutation.isPending}
              data-testid="button-submit"
            >
              {submitLoanMutation.isPending ? "Submitting..." : "Submit Loan Application"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
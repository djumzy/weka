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
import { PlusCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function SubmitSavingsPage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [welfareAmount, setWelfareAmount] = useState('');
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

  // Auto-select group for leadership roles
  useEffect(() => {
    if (isLeadershipRole && memberSession?.member?.groupId && !selectedGroup) {
      setSelectedGroup(memberSession.member.groupId);
    }
  }, [isLeadershipRole, memberSession, selectedGroup]);

  // Fetch groups (only for admin users)
  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
    enabled: isAuthenticated && !isLeadershipRole, // Only fetch for admin users
  });

  // Fetch members for selected group
  const { data: members = [] } = useQuery({
    queryKey: ["/api/groups", selectedGroup, "members"],
    enabled: !!selectedGroup,
  });

  const submitSavingsMutation = useMutation({
    mutationFn: async (data: { groupId: string; memberId: string; savingsAmount: number; welfareAmount: number }) => {
      const response = await apiRequest("POST", "/api/transactions/submit-savings", {
        groupId: data.groupId,
        memberId: data.memberId,
        savingsAmount: data.savingsAmount,
        welfareAmount: data.welfareAmount,
        submittedBy: "admin" // Could be dynamic based on current user role
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedMember || !savingsAmount) {
      toast({
        title: "Missing Information",
        description: "Please select group, member and enter savings amount",
        variant: "destructive",
      });
      return;
    }

    const savings = parseFloat(savingsAmount);
    const welfare = parseFloat(welfareAmount || '0');

    if (savings <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Savings amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    submitSavingsMutation.mutate({
      groupId: selectedGroup,
      memberId: selectedMember,
      savingsAmount: savings,
      welfareAmount: welfare
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlusCircle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Submit Member Savings & Welfare</h1>
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
          <CardTitle>Submit Savings and Welfare for Group Members</CardTitle>
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
                <Label htmlFor="group-display">Select Group</Label>
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
                      Current Savings: {formatCurrency(parseFloat((members as any[]).find((m: any) => m.id === selectedMember)?.savingsBalance || '0'))}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedMember && (
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
                    placeholder="Enter welfare amount (optional)"
                    value={welfareAmount}
                    onChange={(e) => setWelfareAmount(e.target.value)}
                    data-testid="input-welfare-amount"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={submitSavingsMutation.isPending || !selectedGroup || !selectedMember}
              className="w-full"
              data-testid="button-submit-savings"
            >
              {submitSavingsMutation.isPending ? "Submitting..." : "Submit Savings & Welfare"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
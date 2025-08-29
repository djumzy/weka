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
import { PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function SubmitSavingsPage() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [savingsAmount, setSavingsAmount] = useState('');
  const [welfareAmount, setWelfareAmount] = useState('');
  const [memberSession, setMemberSession] = useState<any>(null);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

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

  // Fetch members for selected group
  const { data: members = [] } = useQuery({
    queryKey: ["/api/groups", selectedGroup, "members"],
    enabled: !!selectedGroup,
    onSuccess: (data) => {
      console.log('Members data received:', data); // Debug log
    }
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
      <div className="flex items-center gap-2">
        <PlusCircle className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Submit Member Savings & Welfare</h1>
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
              <div className="space-y-4">
                <Label htmlFor="member-select">Select Member</Label>
                
                {/* Role-based member selection */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm font-medium">Chairman</Label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select chairman" />
                      </SelectTrigger>
                      <SelectContent>
                        {members.filter((member: any) => member.groupRole === 'chairman').map((member: any) => {
                          console.log('Chairman member:', member); // Debug log
                          return (
                            <SelectItem key={member.id} value={member.id}>
                              {member.firstName} {member.lastName}
                            </SelectItem>
                          );
                        })}
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
                      Current Savings: {formatCurrency(parseFloat(members.find((m: any) => m.id === selectedMember)?.savingsBalance || '0'))}
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
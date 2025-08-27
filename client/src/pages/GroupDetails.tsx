import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Plus, Edit, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { formatCurrency } from "@/lib/utils";
import { NewMemberModal } from "@/components/modals/NewMemberModal";
import { MemberDetailsModal } from "@/components/MemberDetailsModal";

export default function GroupDetails() {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isMemberDetailsOpen, setIsMemberDetailsOpen] = useState(false);

  // Fetch group details
  const { data: group, isLoading: groupLoading } = useQuery({
    queryKey: ["/api/groups", groupId],
  });

  // Fetch group members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["/api/members", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/members?groupId=${groupId}`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!groupId,
  });

  // Fetch group transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/transactions", groupId],
    queryFn: async () => {
      const response = await fetch(`/api/transactions?groupId=${groupId}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    enabled: !!groupId,
  });

  // Check if user can edit (admin, field_monitor, field_attendant)
  const canEdit = user?.role === 'admin' || user?.role === 'field_monitor' || user?.role === 'field_attendant';

  if (groupLoading || membersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading group details...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Group not found</div>
      </div>
    );
  }

  const totalSavings = members.reduce((sum: number, member: any) => 
    sum + parseFloat(member.savingsBalance || 0), 0
  );

  const totalLoans = members.reduce((sum: number, member: any) => 
    sum + parseFloat(member.currentLoan || 0), 0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="group-name">
                {group.name}
              </h1>
              <p className="text-muted-foreground">
                {group.location} • {members.length} members
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {canEdit && (
              <>
                <Button
                  onClick={() => setIsNewMemberModalOpen(true)}
                  data-testid="button-add-member"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
                <Button variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Group
                </Button>
              </>
            )}
            {!canEdit && (
              <Badge variant="secondary">
                <Eye className="w-3 h-3 mr-1" />
                View Only
              </Badge>
            )}
          </div>
        </div>

        {/* Group Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalLoans)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Available Cash</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(group.availableCash || 0))}</div>
            </CardContent>
          </Card>
        </div>

        {/* Group Information */}
        <Card>
          <CardHeader>
            <CardTitle>Group Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Basic Details</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Location:</span> {group.location}</div>
                <div><span className="font-medium">Registration Number:</span> {group.registrationNumber || 'N/A'}</div>
                <div><span className="font-medium">Meeting Frequency:</span> {group.meetingFrequency}</div>
                <div><span className="font-medium">Cycle Months:</span> {group.cycleMonths}</div>
                <div><span className="font-medium">Registration Date:</span> {new Date(group.registrationDate).toLocaleDateString()}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Activities</h4>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Main Activity:</span> {group.mainActivity || 'N/A'}</div>
                <div><span className="font-medium">Other Activities:</span> {group.otherActivities || 'N/A'}</div>
                {group.hasRunningBusiness && (
                  <>
                    <div><span className="font-medium">Business Name:</span> {group.businessName || 'N/A'}</div>
                    <div><span className="font-medium">Business Location:</span> {group.businessLocation || 'N/A'}</div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Group Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members in this group yet
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedMember(member);
                      setIsMemberDetailsOpen(true);
                    }}
                    data-testid={`member-${member.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-primary">
                          {member.firstName[0]}{member.lastName[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.firstName} {member.lastName}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.gender} • {member.groupRole} • {member.phone || 'No phone'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(parseFloat(member.savingsBalance || 0))}</p>
                      <p className="text-xs text-muted-foreground">Savings</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Member Modal */}
      <NewMemberModal
        open={isNewMemberModalOpen}
        onOpenChange={setIsNewMemberModalOpen}
        groupId={groupId!}
        groupName={group.name}
      />

      {/* Member Details Modal */}
      <MemberDetailsModal
        member={selectedMember}
        groupName={group.name}
        isOpen={isMemberDetailsOpen}
        onClose={() => {
          setIsMemberDetailsOpen(false);
          setSelectedMember(null);
        }}
      />
    </div>
  );
}
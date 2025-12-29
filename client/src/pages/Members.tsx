import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { NewMemberModal } from "@/components/modals/NewMemberModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, User } from "lucide-react";
import { format } from "date-fns";
import { formatCurrency } from "@/utils/currency";
import { useAuth } from "@/hooks/useAuth";

export default function Members() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [isNewMemberModalOpen, setIsNewMemberModalOpen] = useState(false);
  const [memberSession, setMemberSession] = useState<any>(null);
  const { user } = useAuth();

  // Load member session for group context
  useEffect(() => {
    const sessionData = localStorage.getItem('memberSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setMemberSession(session);
    }
  }, []);

  // Determine if this is a group leader or admin
  const isAdmin = !!user;
  const isGroupLeader = memberSession && ['chairman', 'secretary', 'finance'].includes(memberSession.member?.groupRole);
  const userGroupId = memberSession?.member?.groupId;

  // For group leaders, fetch only their group members; for admins, fetch all members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: isGroupLeader ? ["/api/groups", userGroupId, "members"] : ["/api/members"],
    queryFn: async () => {
      if (isGroupLeader && userGroupId) {
        const response = await fetch(`/api/groups/${userGroupId}/members`);
        if (!response.ok) throw new Error('Failed to fetch group members');
        return response.json();
      } else {
        // For admins or fallback
        const response = await fetch('/api/members');
        if (!response.ok) throw new Error('Failed to fetch members');
        return response.json();
      }
    },
    enabled: isAdmin || (isGroupLeader && !!userGroupId),
  });

  const { data: groups = [], isLoading: groupsLoading } = useQuery({
    queryKey: ["/api/groups"],
    enabled: !isGroupLeader, // Only fetch groups for admins
  });

  const getGroupName = (groupId: string) => {
    const group = groups.find((g: any) => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  const filteredMembers = members.filter((member: any) => {
    const matchesSearch = 
      `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm);
    
    // For group leaders, don't filter by group (already filtered by API)
    // For admins, filter by selected group
    const matchesGroup = isGroupLeader || selectedGroupId === "all" || member.groupId === selectedGroupId;
    
    return matchesSearch && matchesGroup;
  });

  if (membersLoading || (!isGroupLeader && groupsLoading)) {
    return (
      <div className="min-h-screen flex">
        <AdminSidebar userRole={memberSession?.member?.groupRole || 'admin'} />
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
    <div className="min-h-screen flex" data-testid="members-page">
      <AdminSidebar userRole={memberSession?.member?.groupRole || 'admin'} />

      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">
                {isGroupLeader ? 'Group Members' : 'All Members'}
              </h2>
              <p className="text-muted-foreground">
                {isGroupLeader ? 'Manage members in your group' : 'Manage all group members'}
              </p>
            </div>
            <Button onClick={() => setIsNewMemberModalOpen(true)} data-testid="button-add-member">
              <Plus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-88px)]">
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-members"
              />
            </div>
            {/* Only show group filter for admins */}
            {!isGroupLeader && (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="w-48" data-testid="select-group-filter">
                  <SelectValue placeholder="Filter by group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {(groups as any[]).map((group: any) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Members Table */}
          {filteredMembers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No members found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || selectedGroupId !== "all" 
                  ? "Try adjusting your filters" 
                  : "Add your first member to get started"
                }
              </p>
              {!searchTerm && selectedGroupId === "all" && (
                <Button data-testid="button-add-first-member">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Contact</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Group</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Join Date</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Savings Balance</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member: any) => (
                      <tr 
                        key={member.id} 
                        className="border-b border-border hover:bg-muted/25"
                        data-testid={`member-row-${member.id}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-secondary-foreground">
                                {member.firstName[0]}{member.lastName[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground" data-testid={`member-name-${member.id}`}>
                                {member.firstName} {member.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            {member.email && (
                              <p className="text-foreground">{member.email}</p>
                            )}
                            {member.phone && (
                              <p className="text-muted-foreground">{member.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-foreground" data-testid={`member-group-${member.id}`}>
                          {getGroupName(member.groupId)}
                        </td>
                        <td className="p-4">
                          <Badge 
                            variant={
                              member.groupRole === 'chairman' ? 'default' :
                              member.groupRole === 'finance' ? 'secondary' :
                              member.groupRole === 'secretary' ? 'outline' : 
                              'destructive'
                            }
                          >
                            {member.groupRole?.charAt(0).toUpperCase() + member.groupRole?.slice(1) || 'Member'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {format(new Date(member.joinDate), "MMM dd, yyyy")}
                        </td>
                        <td className="p-4 text-sm font-medium text-foreground" data-testid={`member-balance-${member.id}`}>
                          {formatCurrency(parseFloat(member.savingsBalance || 0))}
                        </td>
                        <td className="p-4">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              member.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {member.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm" data-testid={`button-view-member-${member.id}`}>
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

      {/* New Member Modal */}
      {isGroupLeader && memberSession?.member ? (
        <NewMemberModal 
          open={isNewMemberModalOpen} 
          onOpenChange={setIsNewMemberModalOpen}
          groupId={memberSession.member.groupId}
          groupName={memberSession.member.groupName}
        />
      ) : isAdmin && selectedGroupId !== "all" ? (
        <NewMemberModal 
          open={isNewMemberModalOpen} 
          onOpenChange={setIsNewMemberModalOpen}
          groupId={selectedGroupId}
          groupName={groups?.find((g: any) => g.id === selectedGroupId)?.name || "Selected Group"}
        />
      ) : null}
    </div>
  );
}

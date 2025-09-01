import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { GroupCard } from "@/components/GroupCard";
import { NewGroupModal } from "@/components/modals/NewGroupModal";
import { EditGroupModal } from "@/components/modals/EditGroupModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Search, Edit } from "lucide-react";
import type { Group } from "@shared/schema";

export default function Groups() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["/api/groups"],
  });

  const { data: members = [] } = useQuery({
    queryKey: ["/api/members"],
  });

  const filteredGroups = groups.filter((group: any) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupStats = (groupId: string) => {
    const groupMembers = members.filter((m: any) => m.groupId === groupId);
    const totalSavings = groupMembers.reduce((sum: number, m: any) => sum + parseFloat(m.savingsBalance || 0), 0);
    return { memberCount: groupMembers.length, totalSavings };
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => apiRequest(`/api/groups/${groupId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: "Success",
        description: "Group deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete group",
        variant: "destructive",
      });
    },
  });

  const handleDeleteGroup = (group: Group) => {
    if (window.confirm(`Are you sure you want to delete the group "${group.name}"? This action cannot be undone.`)) {
      deleteGroupMutation.mutate(group.id);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" data-testid="groups-page">
      <AdminSidebar />

      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">Groups</h2>
              <p className="text-muted-foreground">Manage all your VSLA groups</p>
            </div>
            <Button 
              onClick={() => setIsNewGroupModalOpen(true)}
              data-testid="button-new-group"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Group
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-88px)]">
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-groups"
              />
            </div>
          </div>

          {/* Groups Grid */}
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Plus className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No groups found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Try adjusting your search term" : "Create your first VSLA group to get started"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsNewGroupModalOpen(true)} data-testid="button-create-first-group">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Group
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group: any) => {
                const stats = getGroupStats(group.id);
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    memberCount={stats.memberCount}
                    totalSavings={stats.totalSavings}
                    onEditClick={(group) => setEditingGroup(group)}
                    onDeleteClick={isAdmin ? handleDeleteGroup : undefined}
                    showDeleteButton={isAdmin}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <NewGroupModal
        open={isNewGroupModalOpen}
        onOpenChange={setIsNewGroupModalOpen}
      />
      
      {editingGroup && (
        <EditGroupModal
          open={!!editingGroup}
          onOpenChange={(open) => !open && setEditingGroup(null)}
          group={editingGroup}
        />
      )}
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { NewGroupModal } from "@/components/modals/NewGroupModal";
import { EditGroupModal } from "@/components/modals/EditGroupModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Plus, Search, Edit, Trash2, MapPin, DollarSign, Users, Ban, CheckCircle, MoreVertical } from "lucide-react";
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

  const filteredGroups = (groups as any[]).filter((group: any) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getGroupStats = (groupId: string) => {
    const groupMembers = (members as any[]).filter((m: any) => m.groupId === groupId);
    const totalSavings = groupMembers.reduce((sum: number, m: any) => sum + parseFloat(m.savingsBalance || 0), 0);
    return { memberCount: groupMembers.length, totalSavings };
  };

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete group');
      }
      return response.json();
    },
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

  // Deactivate/Activate group mutation
  const toggleGroupStatusMutation = useMutation({
    mutationFn: async ({ groupId, isActive }: { groupId: string; isActive: boolean }) => {
      const response = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update group status');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/groups'] });
      toast({
        title: "Success",
        description: `Group ${variables.isActive ? 'activated' : 'deactivated'} successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update group status",
        variant: "destructive",
      });
    },
  });

  const handleDeleteGroup = (group: Group) => {
    deleteGroupMutation.mutate(group.id);
  };

  const handleToggleGroupStatus = (group: Group) => {
    toggleGroupStatusMutation.mutate({
      groupId: group.id,
      isActive: !group.isActive
    });
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

          {/* Groups List */}
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
            <div className="space-y-4">
              {filteredGroups.map((group: any, index: number) => {
                const stats = getGroupStats(group.id);
                return (
                  <div 
                    key={group.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/25 transition-colors"
                    data-testid={`group-list-item-${group.id}`}
                  >
                    <Link href={`/groups/${group.id}`} className="flex items-center space-x-4 flex-1 cursor-pointer">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold text-primary" data-testid={`group-number-${group.id}`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground hover:text-primary transition-colors" data-testid={`group-name-${group.id}`}>
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-6 mt-1">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span data-testid={`group-location-${group.id}`}>{group.location || 'No location set'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <DollarSign className="h-4 w-4" />
                            <span data-testid={`group-savings-${group.id}`}>${stats.totalSavings.toFixed(2)} saved</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span data-testid={`group-members-${group.id}`}>{stats.memberCount} members</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-4">
                        <p className={`text-sm font-medium ${group.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                          {group.isActive ? 'Active' : 'Inactive'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Interest: {group.interestRate || '0'}% monthly
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingGroup(group)}
                        className="flex items-center gap-1"
                        data-testid={`edit-group-${group.id}`}
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      
                      {isAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                              data-testid={`actions-group-${group.id}`}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleGroupStatus(group)}
                              className="flex items-center gap-2"
                              data-testid={`toggle-status-group-${group.id}`}
                            >
                              {group.isActive ? (
                                <>
                                  <Ban className="h-4 w-4" />
                                  Deactivate Group
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4" />
                                  Activate Group
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="flex items-center gap-2 text-red-600 focus:text-red-600"
                                  data-testid={`delete-group-${group.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Permanently
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Group Permanently</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to permanently delete the group "{group.name}"?
                                    <br /><br />
                                    <strong>This will delete:</strong>
                                    <br />• All {stats.memberCount} members in this group
                                    <br />• All transaction history (${stats.totalSavings.toFixed(2)})
                                    <br />• All loan records and payments
                                    <br />• All meeting records
                                    <br /><br />
                                    <strong>This action cannot be undone!</strong>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteGroup(group)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete Permanently
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
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

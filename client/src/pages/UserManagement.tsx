import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, UserCheck, UserX, QrCode, Eye, Edit, Save, X, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createUserSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["admin", "field_monitor", "field_attendant"]),
  location: z.string().optional(),
  userId: z.string().optional(), // Optional, will be auto-generated if not provided
  pin: z.string().length(6, "PIN must be exactly 6 digits"),
});

type CreateUserData = z.infer<typeof createUserSchema>;

// Schema for editing users (similar to create but with ID)
const editUserSchema = z.object({
  id: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["admin", "field_monitor", "field_attendant"]),
  location: z.string().optional(),
  userId: z.string().min(1, "User ID is required"),
  isActive: z.boolean(),
});

type EditUserData = z.infer<typeof editUserSchema>;

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [isQrCodeModalOpen, setIsQrCodeModalOpen] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const { toast } = useToast();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "field_attendant",
      pin: "",
    },
  });

  // Edit user form
  const { 
    register: editRegister, 
    handleSubmit: editHandleSubmit, 
    reset: editReset, 
    setValue: editSetValue, 
    formState: { errors: editErrors } 
  } = useForm<EditUserData>({
    resolver: zodResolver(editUserSchema),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    retry: false,
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserData) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      reset();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: EditUserData) => {
      const response = await apiRequest("PUT", `/api/users/${userData.id}`, userData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditMode(false);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateRandomUserId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `TD${randomNum}`;
  };

  const generateUserId = () => {
    const newUserId = generateRandomUserId();
    setValue("userId", newUserId);
  };

  const generateRandomPin = () => {
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    setValue("pin", randomPin);
  };

  const onSubmit = (data: CreateUserData) => {
    // Generate User ID if not provided
    if (!data.userId) {
      data.userId = generateRandomUserId();
    }
    createUserMutation.mutate(data);
  };

  const onEditSubmit = (data: EditUserData) => {
    updateUserMutation.mutate(data);
  };

  const openUserDetails = (user: any) => {
    setSelectedUser(user);
    setIsUserDetailsOpen(true);
    setIsEditMode(false);
    // Populate edit form with user data
    editSetValue("id", user.id);
    editSetValue("firstName", user.firstName);
    editSetValue("lastName", user.lastName);
    editSetValue("phone", user.phone);
    editSetValue("email", user.email || "");
    editSetValue("role", user.role);
    editSetValue("location", user.location || "");
    editSetValue("userId", user.userId);
    editSetValue("isActive", user.isActive);
  };

  const startEditing = () => {
    setIsEditMode(true);
  };

  const cancelEditing = () => {
    setIsEditMode(false);
    // Reset form to original values
    if (selectedUser) {
      openUserDetails(selectedUser);
    }
  };

  const openDeleteDialog = (user: any) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  const generateQRCode = async (user: any) => {
    try {
      // Generate QR code with user credentials for login
      const loginData = {
        userId: user.userId,
        // Note: In production, you might want to generate a temporary login token
        // For now, we'll include user ID and let them enter PIN manually
        type: 'login',
        timestamp: Date.now()
      };

      const response = await apiRequest("POST", "/api/users/generate-qr", {
        userId: user.id,
        loginData
      });

      const result = await response.json();
      setQrCodeDataUrl(result.qrCodeDataUrl);
      setSelectedUser(user);
      setIsQrCodeModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate QR code",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "field_monitor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "field_attendant":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage WEKA system users and their roles</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="users" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>All Users</span>
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Create User</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>System Users</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: any) => (
                        <TableRow 
                          key={user.id} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openUserDetails(user)}
                          data-testid={`user-row-${user.userId}`}
                        >
                          <TableCell className="font-mono">{user.userId}</TableCell>
                          <TableCell>{`${user.firstName} ${user.lastName}`}</TableCell>
                          <TableCell>{user.phone}</TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role.replace("_", " ").toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.location || "—"}</TableCell>
                          <TableCell>
                            {user.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <UserX className="w-3 h-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUserDetails(user);
                                }}
                                data-testid={`button-view-user-${user.userId}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openUserDetails(user);
                                  setTimeout(() => startEditing(), 100);
                                }}
                                data-testid={`button-edit-user-${user.userId}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateQRCode(user);
                                }}
                                data-testid={`button-qr-user-${user.userId}`}
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDeleteDialog(user);
                                }}
                                data-testid={`button-delete-user-${user.userId}`}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="create" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Create New User</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          {...register("firstName")}
                          data-testid="input-first-name"
                        />
                        {errors.firstName && (
                          <p className="text-sm text-red-600">{errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          {...register("lastName")}
                          data-testid="input-last-name"
                        />
                        {errors.lastName && (
                          <p className="text-sm text-red-600">{errors.lastName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          {...register("phone")}
                          data-testid="input-phone"
                        />
                        {errors.phone && (
                          <p className="text-sm text-red-600">{errors.phone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                          id="email"
                          type="email"
                          {...register("email")}
                          data-testid="input-email"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select onValueChange={(value) => setValue("role", value as any)}>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="field_monitor">Field Monitor</SelectItem>
                            <SelectItem value="field_attendant">Field Attendant</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.role && (
                          <p className="text-sm text-red-600">{errors.role.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="location">Location (Optional)</Label>
                        <Input
                          id="location"
                          {...register("location")}
                          data-testid="input-location"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="userId">User ID</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="userId"
                            {...register("userId")}
                            placeholder="Auto-generated if empty"
                            data-testid="input-user-id"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateUserId}
                            data-testid="button-generate-user-id"
                          >
                            Generate
                          </Button>
                        </div>
                        {errors.userId && (
                          <p className="text-sm text-red-600">{errors.userId.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="pin">PIN (6 digits)</Label>
                        <div className="flex space-x-2">
                          <Input
                            id="pin"
                            type="password"
                            maxLength={6}
                            {...register("pin")}
                            data-testid="input-pin"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generateRandomPin}
                            data-testid="button-generate-pin"
                          >
                            Generate
                          </Button>
                        </div>
                        {errors.pin && (
                          <p className="text-sm text-red-600">{errors.pin.message}</p>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={createUserMutation.isPending}
                      data-testid="button-create-user"
                    >
                      {createUserMutation.isPending ? "Creating..." : "Create User"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* User Details/Edit Modal */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {isEditMode ? "Edit User" : "User Details"}
              {selectedUser && (
                <Badge className={getRoleBadgeColor(selectedUser.role)} data-testid="user-detail-role-badge">
                  {selectedUser.role.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6">
              {!isEditMode ? (
                // View Mode
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                    <div className="font-mono text-sm bg-muted p-2 rounded" data-testid="user-detail-id">
                      {selectedUser.userId}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                    <div className="text-sm p-2" data-testid="user-detail-name">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    <div className="text-sm p-2" data-testid="user-detail-phone">
                      {selectedUser.phone}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <div className="text-sm p-2" data-testid="user-detail-email">
                      {selectedUser.email || "Not provided"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                    <div className="text-sm p-2" data-testid="user-detail-location">
                      {selectedUser.location || "Not specified"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                    <div className="text-sm p-2" data-testid="user-detail-status">
                      {selectedUser.isActive ? (
                        <Badge className="bg-green-100 text-green-800">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <UserX className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium text-muted-foreground">Created</Label>
                    <div className="text-sm p-2" data-testid="user-detail-created">
                      {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : "Not available"}
                    </div>
                  </div>
                </div>
              ) : (
                // Edit Mode
                <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="editFirstName">First Name</Label>
                      <Input
                        id="editFirstName"
                        {...editRegister("firstName")}
                        data-testid="input-edit-first-name"
                      />
                      {editErrors.firstName && (
                        <p className="text-sm text-red-600">{editErrors.firstName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editLastName">Last Name</Label>
                      <Input
                        id="editLastName"
                        {...editRegister("lastName")}
                        data-testid="input-edit-last-name"
                      />
                      {editErrors.lastName && (
                        <p className="text-sm text-red-600">{editErrors.lastName.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editPhone">Phone Number</Label>
                      <Input
                        id="editPhone"
                        type="tel"
                        {...editRegister("phone")}
                        data-testid="input-edit-phone"
                      />
                      {editErrors.phone && (
                        <p className="text-sm text-red-600">{editErrors.phone.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editEmail">Email</Label>
                      <Input
                        id="editEmail"
                        type="email"
                        {...editRegister("email")}
                        data-testid="input-edit-email"
                      />
                      {editErrors.email && (
                        <p className="text-sm text-red-600">{editErrors.email.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editRole">Role</Label>
                      <Select onValueChange={(value) => editSetValue("role", value as any)}>
                        <SelectTrigger data-testid="select-edit-role">
                          <SelectValue placeholder={selectedUser.role.replace("_", " ").toUpperCase()} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="field_monitor">Field Monitor</SelectItem>
                          <SelectItem value="field_attendant">Field Attendant</SelectItem>
                        </SelectContent>
                      </Select>
                      {editErrors.role && (
                        <p className="text-sm text-red-600">{editErrors.role.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editLocation">Location</Label>
                      <Input
                        id="editLocation"
                        {...editRegister("location")}
                        data-testid="input-edit-location"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="editUserId">User ID</Label>
                      <Input
                        id="editUserId"
                        {...editRegister("userId")}
                        className="font-mono"
                        data-testid="input-edit-user-id"
                      />
                      {editErrors.userId && (
                        <p className="text-sm text-red-600">{editErrors.userId.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            {...editRegister("isActive")} 
                            value="true" 
                            defaultChecked={selectedUser.isActive}
                            data-testid="radio-edit-active"
                          />
                          <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input 
                            type="radio" 
                            {...editRegister("isActive")} 
                            value="false" 
                            defaultChecked={!selectedUser.isActive}
                            data-testid="radio-edit-inactive"
                          />
                          <span className="text-sm">Inactive</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {/* Modal Actions */}
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsUserDetailsOpen(false)}
                  data-testid="button-close-user-details"
                >
                  Close
                </Button>
                <div className="flex gap-2">
                  {isEditMode ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditing}
                        data-testid="button-cancel-edit"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        onClick={editHandleSubmit(onEditSubmit)}
                        disabled={updateUserMutation.isPending}
                        data-testid="button-save-user"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      onClick={startEditing}
                      data-testid="button-start-edit"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit User
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user <strong>{userToDelete?.firstName} {userToDelete?.lastName}</strong>?
              <br />
              <span className="text-sm text-muted-foreground">User ID: {userToDelete?.userId}</span>
              <br />
              <span className="text-red-600 font-medium">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setUserToDelete(null);
              }}
              data-testid="button-cancel-delete"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Modal */}
      <Dialog open={isQrCodeModalOpen} onOpenChange={setIsQrCodeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Login QR Code
              {selectedUser && (
                <Badge className={getRoleBadgeColor(selectedUser.role)}>
                  {selectedUser.role.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan this QR code to auto-fill login credentials for <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                </p>
                
                {qrCodeDataUrl ? (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={qrCodeDataUrl} 
                      alt="Login QR Code" 
                      className="border rounded-lg"
                      data-testid="qr-code-image"
                    />
                  </div>
                ) : (
                  <div className="flex justify-center items-center h-48 bg-muted rounded-lg mb-4">
                    <div className="text-center">
                      <QrCode className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Generating QR Code...</p>
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>User ID:</strong> {selectedUser.userId}</p>
                  <p className="text-amber-600">
                    <strong>Note:</strong> User will still need to enter their PIN after scanning
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setIsQrCodeModalOpen(false)}
                  data-testid="button-close-qr-modal"
                >
                  Close
                </Button>
                <Button
                  onClick={() => generateQRCode(selectedUser)}
                  variant="outline"
                  data-testid="button-regenerate-qr"
                >
                  <QrCode className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
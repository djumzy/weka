import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminSidebar } from "@/components/AdminSidebar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, UserCheck, UserX, QrCode } from "lucide-react";
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

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState("users");
  const { toast } = useToast();

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: "field_attendant",
      pin: "",
    },
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
                        <TableRow key={user.id}>
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
                            <Button size="sm" variant="outline">
                              <QrCode className="w-4 h-4 mr-1" />
                              Barcode
                            </Button>
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
    </div>
  );
}
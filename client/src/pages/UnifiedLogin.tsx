import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCog, Camera } from "lucide-react";

interface LoginFormData {
  userType: 'member' | 'staff';
  phone?: string;
  pin?: string;
  userId?: string;
  password?: string;
  barcode?: string;
}

export default function UnifiedLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'member' | 'staff'>('member');
  
  // Member login form
  const [memberPhone, setMemberPhone] = useState("");
  const [memberPin, setMemberPin] = useState("");
  
  // Staff login form
  const [staffUserId, setStaffUserId] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (formData: LoginFormData) => {
      const endpoint = formData.userType === 'member' 
        ? '/api/auth/member-login' 
        : '/api/auth/staff-login';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Store session data
      if (data.userType === 'member') {
        localStorage.setItem('memberSession', JSON.stringify(data));
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.member.firstName}!`,
        });
        setLocation(`/member-dashboard/${data.member.id}`);
      } else {
        localStorage.setItem('staffSession', JSON.stringify(data));
        toast({
          title: "Login successful", 
          description: `Welcome back, ${data.user.firstName}!`,
        });
        // Route to appropriate dashboard based on role
        if (data.user.role === 'admin') {
          setLocation('/');
        } else {
          setLocation('/field-dashboard');
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleMemberLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberPhone || !memberPin) {
      toast({
        title: "Missing information",
        description: "Please enter both phone number and PIN",
        variant: "destructive",
      });
      return;
    }
    
    if (memberPin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Member PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate({
      userType: 'member',
      phone: memberPhone,
      pin: memberPin,
    });
  };

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if at least one identifier (userId or phone) and password are provided
    if ((!staffUserId && !staffPhone) || !staffPassword) {
      toast({
        title: "Missing information",
        description: "Please enter either User ID or phone number, plus password",
        variant: "destructive",
      });
      return;
    }
    
    loginMutation.mutate({
      userType: 'staff',
      userId: staffUserId || undefined,
      phone: staffPhone || undefined,
      password: staffPassword,
    });
  };

  const handleBarcodeScan = () => {
    setIsScanning(true);
    // TODO: Implement barcode scanning functionality
    toast({
      title: "Camera opening",
      description: "Barcode scanning will be implemented",
    });
    setTimeout(() => setIsScanning(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">WEKA VSLA</h1>
          <p className="text-muted-foreground">Village Savings and Loan Association</p>
        </div>

        {/* Login Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'member' | 'staff')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="member" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Member
                </TabsTrigger>
                <TabsTrigger value="staff" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  Staff
                </TabsTrigger>
              </TabsList>

              {/* Member Login */}
              <TabsContent value="member" className="mt-6">
                <form onSubmit={handleMemberLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="member-phone">Phone Number</Label>
                    <Input
                      id="member-phone"
                      type="tel"
                      placeholder="256700000000"
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      data-testid="input-member-phone"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="member-pin">PIN (4 digits)</Label>
                    <Input
                      id="member-pin"
                      type="password"
                      placeholder="****"
                      maxLength={4}
                      value={memberPin}
                      onChange={(e) => setMemberPin(e.target.value.replace(/\D/g, ''))}
                      data-testid="input-member-pin"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-member-login"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In as Member"}
                  </Button>
                </form>
              </TabsContent>

              {/* Staff Login */}
              <TabsContent value="staff" className="mt-6">
                <form onSubmit={handleStaffLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-userid">User ID (Optional)</Label>
                    <Input
                      id="staff-userid"
                      type="text"
                      placeholder="TD123456"
                      value={staffUserId}
                      onChange={(e) => setStaffUserId(e.target.value.toUpperCase())}
                      data-testid="input-staff-userid"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="staff-phone">Phone Number (Optional if User ID provided)</Label>
                    <Input
                      id="staff-phone"
                      type="tel"
                      placeholder="256700000000"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      data-testid="input-staff-phone"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      placeholder="Enter your password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      data-testid="input-staff-password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Barcode Scanner</Label>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleBarcodeScan}
                      disabled={isScanning}
                      data-testid="button-barcode-scan"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      {isScanning ? "Opening Camera..." : "Scan ID Card"}
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-staff-login"
                  >
                    {loginMutation.isPending ? "Signing in..." : "Sign In as Staff"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
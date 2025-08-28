import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { BarcodeScanner } from "@/components/BarcodeScanner";
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
  const [staffIdentifier, setStaffIdentifier] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (formData: LoginFormData) => {
      let endpoint, body;
      
      if (formData.userType === 'member') {
        endpoint = '/api/auth/member-login';
        body = { phone: formData.phone, pin: formData.pin };
      } else {
        // Use the working original login endpoint for staff
        endpoint = '/api/login';
        const phoneOrUserId = formData.userId || formData.phone;
        body = { phoneOrUserId, pin: formData.pin };
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify(body),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Handle different response formats
      if (data.userType === 'member') {
        localStorage.setItem('memberSession', JSON.stringify(data));
        toast({
          title: "Login successful",
          description: `Welcome back, ${data.member.firstName}!`,
        });
        setLocation(`/member-dashboard/${data.member.id}`);
      } else if (data.userType === 'staff') {
        // New staff login response format
        localStorage.setItem('staffSession', JSON.stringify(data));
        toast({
          title: "Login successful", 
          description: `Welcome back, ${data.user.firstName}!`,
        });
        if (data.user.role === 'admin') {
          setLocation('/');
        } else {
          setLocation('/field-dashboard');
        }
      } else {
        // Original login response format (staff via /api/login)
        toast({
          title: "Login successful", 
          description: `Welcome back, ${data.firstName}!`,
        });
        if (data.role === 'admin') {
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
    
    // Check if identifier and PIN are provided
    if (!staffIdentifier || !staffPassword) {
      toast({
        title: "Missing information",
        description: "Please enter your User ID or phone number, plus PIN",
        variant: "destructive",
      });
      return;
    }
    
    // Determine if the identifier is a User ID (starts with TD) or phone number
    const isUserId = staffIdentifier.toUpperCase().startsWith('TD');
    
    loginMutation.mutate({
      userType: 'staff',
      userId: isUserId ? staffIdentifier.toUpperCase() : undefined,
      phone: !isUserId ? staffIdentifier : undefined,
      pin: staffPassword,
    });
  };

  const handleBarcodeScan = () => {
    setIsScannerOpen(true);
  };

  const handleScanSuccess = (barcodeData: string) => {
    // Parse barcode data - expecting format: "TD123456:123456" (userId:pin)
    const parsedData = parseBarcodeData(barcodeData);
    if (parsedData) {
      // Auto-fill the form and submit
      setStaffIdentifier(parsedData.userId);
      setStaffPassword(parsedData.pin);
      
      // Auto-login with scanned credentials
      loginMutation.mutate({
        userType: 'staff',
        userId: parsedData.userId,
        pin: parsedData.pin,
      });
    } else {
      toast({
        title: "Invalid barcode",
        description: "Barcode format should be: TD123456:123456",
        variant: "destructive",
      });
    }
  };

  const parseBarcodeData = (data: string): { userId: string; pin: string } | null => {
    try {
      // Expected format: "TD123456:123456" (userId:pin)
      const parts = data.split(':');
      if (parts.length !== 2) {
        return null;
      }

      const [userId, pin] = parts;
      
      // Validate userId format (should start with TD)
      if (!userId.toUpperCase().startsWith('TD')) {
        return null;
      }

      // Validate PIN (should be numeric)
      if (!/^\d+$/.test(pin)) {
        return null;
      }

      return {
        userId: userId.toUpperCase(),
        pin: pin
      };
    } catch (error) {
      console.error('Error parsing barcode data:', error);
      return null;
    }
  };

  const handleScanError = (error: string) => {
    toast({
      title: "Scan error",
      description: error,
      variant: "destructive",
    });
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
                    <Label htmlFor="staff-identifier">User ID or Phone Number</Label>
                    <Input
                      id="staff-identifier"
                      type="text"
                      placeholder="TD123456 or 256700000000"
                      value={staffIdentifier}
                      onChange={(e) => setStaffIdentifier(e.target.value)}
                      data-testid="input-staff-identifier"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">PIN</Label>
                    <Input
                      id="staff-password"
                      type="password"
                      placeholder="Enter your PIN"
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
                      data-testid="button-barcode-scan"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Scan ID Card
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

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScan={handleScanSuccess}
        />
      </div>
    </div>
  );
}
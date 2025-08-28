import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { BarcodeScanner } from "@/components/BarcodeScanner";
import { useToast } from "@/hooks/use-toast";
import { Camera, Phone, KeyRound, Users, UserCog } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import wekaLogo from "@assets/WEKA_1756289094166.png";
import dreamersLogo from "@assets/updated logo the dreamers_1756291084041.png";

interface LoginCredentials {
  phoneOrUserId: string;
  pin: string;
}

interface MemberLoginData {
  phone: string;
  pin: string;
}

export default function Login() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    phoneOrUserId: "",
    pin: "",
  });
  const [memberCredentials, setMemberCredentials] = useState<MemberLoginData>({
    phone: "",
    pin: "",
  });
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest("POST", "/api/login", credentials);
      return await response.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Member login mutation
  const memberLoginMutation = useMutation({
    mutationFn: async (memberData: MemberLoginData) => {
      const response = await fetch('/api/auth/member-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(memberData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Member login failed');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem('memberSession', JSON.stringify(data));
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.member.firstName}!`,
      });
      window.location.href = `/member-dashboard/${data.member.id}`;
    },
    onError: (error: Error) => {
      toast({
        title: "Member Login Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const barcodeLoginMutation = useMutation({
    mutationFn: async (barcodeData: string) => {
      const response = await apiRequest("POST", "/api/login/barcode", { barcodeData });
      return await response.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({
        title: "Login Successful",
        description: "Barcode login successful",
      });
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Barcode Login Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStaffLogin = () => {
    if (!credentials.phoneOrUserId.trim() || !credentials.pin.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number/User ID and PIN",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(credentials);
  };

  const handleMemberLogin = () => {
    if (!memberCredentials.phone.trim() || !memberCredentials.pin.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your phone number and PIN",
        variant: "destructive",
      });
      return;
    }

    if (memberCredentials.pin.length !== 4) {
      toast({
        title: "Invalid PIN",
        description: "Member PIN must be 4 digits",
        variant: "destructive",
      });
      return;
    }

    memberLoginMutation.mutate(memberCredentials);
  };

  const handleBarcodeLogin = () => {
    setShowBarcodeScanner(true);
  };

  const handleBarcodeScan = (barcodeData: string) => {
    setShowBarcodeScanner(false);
    
    // Parse barcode data - expecting format: "TD123456:123456" (userId:pin)
    const parsedData = parseBarcodeData(barcodeData);
    if (parsedData) {
      // Auto-fill staff form and login
      setCredentials({
        phoneOrUserId: parsedData.userId,
        pin: parsedData.pin,
      });
      
      // Auto-login with scanned credentials
      loginMutation.mutate({
        phoneOrUserId: parsedData.userId,
        pin: parsedData.pin,
      });
    } else {
      toast({
        title: "Invalid Barcode",
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
    } catch {
      return null;
    }
  };

  const handleCloseBarcodeScanner = () => {
    setShowBarcodeScanner(false);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4"
      data-testid="login-page"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <img 
              src={wekaLogo} 
              alt="WEKA Logo" 
              className="w-16 h-16 object-contain"
            />
            <img 
              src={dreamersLogo} 
              alt="The Dreamers Logo" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold">WEKA</CardTitle>
          <p className="text-muted-foreground">
            Wealth, Equity, Knowledge, and Accessibility
          </p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="staff" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="staff" className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                Staff
              </TabsTrigger>
              <TabsTrigger value="member" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Member
              </TabsTrigger>
            </TabsList>

            {/* Staff Login Tab */}
            <TabsContent value="staff" className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneOrUserId">Phone Number or User ID</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phoneOrUserId"
                      type="text"
                      placeholder="Enter phone or User ID (TDXXXXXX)"
                      className="pl-10"
                      value={credentials.phoneOrUserId}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          phoneOrUserId: e.target.value,
                        }))
                      }
                      data-testid="input-phone-userid"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pin">PIN</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="pin"
                      type="password"
                      placeholder="Enter 6-digit PIN"
                      className="pl-10"
                      maxLength={6}
                      value={credentials.pin}
                      onChange={(e) =>
                        setCredentials((prev) => ({
                          ...prev,
                          pin: e.target.value,
                        }))
                      }
                      data-testid="input-pin"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleStaffLogin}
                  className="w-full"
                  disabled={loginMutation.isPending}
                  data-testid="button-staff-login"
                >
                  {loginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </div>

              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-background px-2 text-xs text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>

              {/* Barcode Login */}
              <Button
                variant="outline"
                onClick={handleBarcodeLogin}
                className="w-full"
                disabled={barcodeLoginMutation.isPending}
                data-testid="button-barcode-login"
              >
                <Camera className="w-4 h-4 mr-2" />
                {barcodeLoginMutation.isPending ? "Processing..." : "Scan ID Card"}
              </Button>
            </TabsContent>

            {/* Member Login Tab */}
            <TabsContent value="member" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberPhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="memberPhone"
                      type="tel"
                      placeholder="Enter your phone number"
                      className="pl-10"
                      value={memberCredentials.phone}
                      onChange={(e) =>
                        setMemberCredentials((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      data-testid="input-member-phone"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="memberPin">PIN</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="memberPin"
                      type="password"
                      placeholder="Enter 4-digit PIN"
                      className="pl-10"
                      maxLength={4}
                      value={memberCredentials.pin}
                      onChange={(e) =>
                        setMemberCredentials((prev) => ({
                          ...prev,
                          pin: e.target.value,
                        }))
                      }
                      data-testid="input-member-pin"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleMemberLogin}
                  className="w-full"
                  disabled={memberLoginMutation.isPending}
                  data-testid="button-member-login"
                >
                  {memberLoginMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showBarcodeScanner}
        onScan={handleBarcodeScan}
        onClose={handleCloseBarcodeScanner}
      />
    </div>
  );
}
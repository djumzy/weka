import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Camera, Phone, KeyRound } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LoginCredentials {
  phoneOrUserId: string;
  pin: string;
}

export default function Login() {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    phoneOrUserId: "",
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

  const handleLogin = () => {
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

  const handleBarcodeLogin = () => {
    // This would integrate with a barcode scanning library
    // For now, we'll simulate the process
    setShowBarcodeScanner(true);
    toast({
      title: "Barcode Scanner",
      description: "Camera functionality will be integrated here",
    });
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4"
      data-testid="login-page"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <DollarSign className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">WEKA</CardTitle>
          <p className="text-muted-foreground">
            Wealth, Equity, Knowledge, and Accessibility
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Manual Login Form */}
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
              onClick={handleLogin}
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
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
            data-testid="button-barcode-login"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scan Barcode to Login
          </Button>

          {showBarcodeScanner && (
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Camera integration will be implemented here
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBarcodeScanner(false)}
                className="mt-2"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
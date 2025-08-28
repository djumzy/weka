import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Reset() {
  useEffect(() => {
    // Clear all localStorage
    localStorage.clear();
    
    // Clear all session cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos) : c;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  }, []);

  const handleClearAndReload = async () => {
    try {
      // Clear server session
      await fetch('/api/clear-session', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Session clear error:', error);
    }

    // Clear everything and reload
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Session Reset</CardTitle>
          <CardDescription>
            Clearing corrupted session data to fix loading issues
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            All session data has been cleared. Click below to return to the login page.
          </p>
          <Button onClick={handleClearAndReload} className="w-full">
            Continue to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { formatCurrency } from "@/utils/currency";
import { Users, MapPin, Clock, LogOut, User } from "lucide-react";

export default function FieldDashboard() {
  const [, setLocation] = useLocation();
  
  // Get staff session data
  const staffSession = JSON.parse(localStorage.getItem('staffSession') || '{}');
  const staffUser = staffSession.user;

  // Fetch field-specific data
  const { data: fieldGroups = [], isLoading } = useQuery({
    queryKey: ["/api/groups"],
    enabled: !!staffUser?.id,
  });

  const handleLogout = () => {
    localStorage.removeItem('staffSession');
    setLocation('/login');
  };

  if (!staffUser) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-primary/10 p-2 rounded-lg">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Field Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {staffUser.firstName} {staffUser.lastName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <MapPin className="h-3 w-3" />
                {staffUser.location || 'Not Set'}
              </Badge>
              <Badge variant="secondary">
                {staffUser.role}
              </Badge>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Staff Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Staff Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Staff ID</p>
                <p className="text-lg font-semibold">{staffUser.userId}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Phone</p>
                <p className="text-lg">{staffUser.phone}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p className="text-lg">{staffUser.email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant="secondary">{staffUser.role}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Groups Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Groups in Your Area
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Loading groups...</p>
              ) : fieldGroups.length === 0 ? (
                <p className="text-muted-foreground">No groups found in your area.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {fieldGroups.slice(0, 6).map((group: any) => (
                    <div
                      key={group.id}
                      className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground">{group.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {group.memberCount} members
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>Share Value: {formatCurrency(group.shareValue)}</p>
                        <p>Location: {group.location}</p>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{group.meetingFrequency}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-semibold">Visit Group</div>
                    <div className="text-sm text-muted-foreground">Attend group meeting</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-semibold">Training Session</div>
                    <div className="text-sm text-muted-foreground">Conduct member training</div>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start h-auto p-4">
                  <div className="text-left">
                    <div className="font-semibold">Reports</div>
                    <div className="text-sm text-muted-foreground">Submit field reports</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
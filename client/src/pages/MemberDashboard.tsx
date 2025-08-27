import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { 
  Users, 
  DollarSign, 
  Share, 
  Heart, 
  Wallet, 
  FileText,
  LogOut,
  User,
  Building2
} from "lucide-react";

interface MemberSession {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    groupRole: string;
    groupId: string;
    totalShares: number;
    savingsBalance: string;
    welfareBalance: string;
    currentLoan: string;
  };
  groupStats: {
    totalMembers: number;
    totalSavings: number;
    totalWelfare: number;
    totalShares: number;
    shareValue: number;
    totalCashInBox: number;
    totalLoansOutstanding: number;
    groupWelfareAmount: number;
    interestRate: number;
  };
}

export default function MemberDashboard() {
  const { memberId } = useParams<{ memberId: string }>();
  const [, setLocation] = useLocation();
  const [memberSession, setMemberSession] = useState<MemberSession | null>(null);

  // Load member session from localStorage
  useEffect(() => {
    const sessionData = localStorage.getItem('memberSession');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setMemberSession(session);
    } else {
      // Redirect to login if no session
      setLocation('/member-login');
    }
  }, [setLocation]);

  // Fetch fresh member dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["/api/members", memberId, "dashboard"],
    queryFn: async () => {
      const response = await fetch(`/api/members/${memberId}/dashboard`);
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      return response.json();
    },
    enabled: !!memberId && !!memberSession,
  });

  const handleLogout = () => {
    localStorage.removeItem('memberSession');
    setLocation('/member-login');
  };

  if (!memberSession || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  const member = dashboardData?.member || memberSession.member;
  const group = dashboardData?.group;
  const groupStats = dashboardData?.groupStats || memberSession.groupStats;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'chairman': return 'bg-blue-100 text-blue-800';
      case 'secretary': return 'bg-green-100 text-green-800';
      case 'finance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {member.firstName} {member.lastName}
              </h1>
              <div className="flex items-center gap-2">
                <Badge className={getRoleColor(member.groupRole)}>
                  {member.groupRole}
                </Badge>
                {group && (
                  <span className="text-muted-foreground">
                    • {group.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Personal Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Share className="h-4 w-4" />
                My Shares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {member.totalShares || 0}
              </div>
              <div className="text-xs text-muted-foreground">
                @ {formatCurrency(groupStats.shareValue)} each
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                My Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(parseFloat(member.savingsBalance || '0'))}
              </div>
              <div className="text-xs text-muted-foreground">
                {member.totalShares || 0} shares
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Heart className="h-4 w-4" />
                My Welfare
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(parseFloat(member.welfareBalance || '0'))}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatCurrency(groupStats.groupWelfareAmount)} expected
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                My Loan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(parseFloat(member.currentLoan || '0'))}
              </div>
              <div className="text-xs text-muted-foreground">
                {groupStats.interestRate}% per month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Group Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Group Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Group Totals</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Members:</span>
                    <span className="font-medium">{groupStats.totalMembers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Shares:</span>
                    <span className="font-medium">{groupStats.totalShares}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Share Value:</span>
                    <span className="font-medium">{formatCurrency(groupStats.shareValue)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Group Finances</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Total Savings:</span>
                    <span className="font-medium">{formatCurrency(groupStats.totalSavings)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Welfare:</span>
                    <span className="font-medium">{formatCurrency(groupStats.totalWelfare)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cash in Box:</span>
                    <span className="font-medium text-green-600">{formatCurrency(groupStats.totalCashInBox)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Loan Information</div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Outstanding Loans:</span>
                    <span className="font-medium">{formatCurrency(groupStats.totalLoansOutstanding)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate:</span>
                    <span className="font-medium">{groupStats.interestRate}% per month</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available for Loans:</span>
                    <span className="font-medium text-green-600">{formatCurrency(groupStats.totalCashInBox)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role-based Information */}
        {(member.groupRole === 'chairman' || member.groupRole === 'secretary' || member.groupRole === 'finance') && (
          <Card>
            <CardHeader>
              <CardTitle>Leadership Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                As a {member.groupRole}, you have access to group management functions.
                Use the admin dashboard for full group management capabilities.
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
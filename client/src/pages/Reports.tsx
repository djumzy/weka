import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/utils/currency";
import { 
  BarChart3, 
  Download, 
  Filter, 
  Users, 
  DollarSign, 
  Building, 
  Calendar,
  FileText,
  TrendingUp
} from "lucide-react";

export default function Reports() {
  const [filters, setFilters] = useState({
    groupId: "all",
    location: "",
    dateFrom: "",
    dateTo: "",
    gender: "all",
    reportType: "groups"
  });

  // Fetch data for filters
  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["/api/groups/locations"],
  });

  // Fetch report data based on filters
  const { data: reportData = [], isLoading } = useQuery({
    queryKey: ["/api/reports", filters.reportType, filters],
    enabled: true,
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = () => {
    // TODO: Implement export functionality
    console.log("Exporting report with filters:", filters);
  };

  const clearFilters = () => {
    setFilters({
      groupId: "all",
      location: "",
      dateFrom: "",
      dateTo: "",
      gender: "all",
      reportType: "groups"
    });
  };

  return (
    <div className="min-h-screen flex" data-testid="reports-page">
      <AdminSidebar />
      
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">
                Reports & Analytics
              </h2>
              <p className="text-muted-foreground">
                Comprehensive reporting with advanced filtering capabilities
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
              <Button onClick={exportReport} data-testid="button-export-report">
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6 overflow-y-auto h-[calc(100vh-88px)]">
          {/* Filters Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Report Filters
              </CardTitle>
              <CardDescription>
                Use filters to customize your report data and view specific insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select 
                    value={filters.reportType} 
                    onValueChange={(value) => handleFilterChange("reportType", value)}
                  >
                    <SelectTrigger id="report-type" data-testid="select-report-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groups">Groups Report</SelectItem>
                      <SelectItem value="members">Members Report</SelectItem>
                      <SelectItem value="financial">Financial Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group-filter">Group</Label>
                  <Select 
                    value={filters.groupId} 
                    onValueChange={(value) => handleFilterChange("groupId", value)}
                  >
                    <SelectTrigger id="group-filter" data-testid="select-group">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Groups</SelectItem>
                      {groups.map((group: any) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location-filter">Location</Label>
                  <Input 
                    id="location-filter"
                    placeholder="Enter location"
                    value={filters.location}
                    onChange={(e) => handleFilterChange("location", e.target.value)}
                    data-testid="input-location"
                  />
                </div>

                {filters.reportType === "members" && (
                  <div className="space-y-2">
                    <Label htmlFor="gender-filter">Gender</Label>
                    <Select 
                      value={filters.gender} 
                      onValueChange={(value) => handleFilterChange("gender", value)}
                    >
                      <SelectTrigger id="gender-filter" data-testid="select-gender">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Genders</SelectItem>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="date-from">Date From</Label>
                  <Input 
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                    data-testid="input-date-from"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-to">Date To</Label>
                  <Input 
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                    data-testid="input-date-to"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Report Content */}
          <Tabs value={filters.reportType} onValueChange={(value) => handleFilterChange("reportType", value)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="groups" data-testid="tab-groups">Groups Report</TabsTrigger>
              <TabsTrigger value="members" data-testid="tab-members">Members Report</TabsTrigger>
              <TabsTrigger value="financial" data-testid="tab-financial">Financial Report</TabsTrigger>
            </TabsList>

            <TabsContent value="groups" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Groups Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Group Name</th>
                            <th className="text-left p-3 font-semibold">Location</th>
                            <th className="text-left p-3 font-semibold">Members</th>
                            <th className="text-left p-3 font-semibold">Total Savings</th>
                            <th className="text-left p-3 font-semibold">Available Cash</th>
                            <th className="text-left p-3 font-semibold">Interest Rate</th>
                            <th className="text-left p-3 font-semibold">Cycle (Months)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((group: any, index: number) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{group.name}</td>
                              <td className="p-3">{group.location}</td>
                              <td className="p-3">
                                <Badge variant="secondary">{group.memberCount || 0}</Badge>
                              </td>
                              <td className="p-3 font-semibold text-green-600">
                                {formatCurrency(parseFloat(group.totalSavings || 0))}
                              </td>
                              <td className="p-3 font-semibold text-blue-600">
                                {formatCurrency(parseFloat(group.availableCash || 0))}
                              </td>
                              <td className="p-3">
                                <Badge>{group.interestRate}%</Badge>
                              </td>
                              <td className="p-3">
                                <Badge variant="outline">{group.cycleMonths} months</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No groups found matching the selected criteria
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Members Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Name</th>
                            <th className="text-left p-3 font-semibold">Gender</th>
                            <th className="text-left p-3 font-semibold">Group</th>
                            <th className="text-left p-3 font-semibold">Location</th>
                            <th className="text-left p-3 font-semibold">Savings Balance</th>
                            <th className="text-left p-3 font-semibold">Join Date</th>
                            <th className="text-left p-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((member: any, index: number) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">
                                {member.firstName} {member.lastName}
                              </td>
                              <td className="p-3">
                                <Badge variant={member.gender === 'M' ? 'default' : 'secondary'}>
                                  {member.gender === 'M' ? 'Male' : 'Female'}
                                </Badge>
                              </td>
                              <td className="p-3">{member.groupName}</td>
                              <td className="p-3">{member.groupLocation}</td>
                              <td className="p-3 font-semibold text-green-600">
                                {formatCurrency(parseFloat(member.savingsBalance || 0))}
                              </td>
                              <td className="p-3">
                                {new Date(member.joinDate).toLocaleDateString()}
                              </td>
                              <td className="p-3">
                                <Badge variant={member.isActive ? 'default' : 'secondary'}>
                                  {member.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No members found matching the selected criteria
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Financial Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-12 bg-muted rounded"></div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-3 font-semibold">Group</th>
                            <th className="text-left p-3 font-semibold">Transaction Type</th>
                            <th className="text-left p-3 font-semibold">Total Amount</th>
                            <th className="text-left p-3 font-semibold">Transaction Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.map((financial: any, index: number) => (
                            <tr key={index} className="border-b hover:bg-muted/50">
                              <td className="p-3 font-medium">{financial.groupName}</td>
                              <td className="p-3">
                                <Badge 
                                  variant={financial.transactionType === 'deposit' ? 'default' : 'destructive'}
                                >
                                  {financial.transactionType}
                                </Badge>
                              </td>
                              <td className="p-3 font-semibold">
                                {formatCurrency(parseFloat(financial.totalAmount || 0))}
                              </td>
                              <td className="p-3">
                                <Badge variant="secondary">{financial.transactionCount}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {reportData.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No financial data found matching the selected criteria
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

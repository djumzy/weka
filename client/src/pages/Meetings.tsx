import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminSidebar } from "@/components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScheduleMeetingModal } from "@/components/modals/ScheduleMeetingModal";
import { MeetingCountdown } from "@/components/MeetingCountdown";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Calendar, Clock, MapPin, Bell, Users, AlertCircle } from "lucide-react";
import { format, isToday, isTomorrow, differenceInHours } from "date-fns";

export default function Meetings() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const { user } = useAuth();

  // Check if user can schedule meetings
  const canScheduleMeetings = user?.role === 'admin' || 
    ['chairman', 'secretary', 'finance'].includes(user?.groupRole || '');

  const { data: meetings = [], isLoading: meetingsLoading } = useQuery({
    queryKey: ["/api/meetings"],
  });

  const { data: groups = [] } = useQuery({
    queryKey: ["/api/groups"],
  });

  const getGroupName = (groupId: string) => {
    const group = (groups as any[]).find((g: any) => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  const filteredMeetings = (meetings as any[]).filter((meeting: any) => {
    const matchesGroup = selectedGroupId === "all" || meeting.groupId === selectedGroupId;
    const matchesStatus = selectedStatus === "all" || meeting.status === selectedStatus;
    return matchesGroup && matchesStatus;
  });

  // Separate upcoming meetings with priority for notifications
  const upcomingMeetingsWithAlarms = (meetings as any[]).filter((meeting: any) => {
    const meetingDate = new Date(meeting.date);
    const now = new Date();
    const hoursUntil = differenceInHours(meetingDate, now);
    return meetingDate > now && meeting.status === 'scheduled' && hoursUntil <= 24;
  }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getStatusStyle = (status: string) => {
    const styles = {
      scheduled: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800";
  };

  const upcomingMeetings = (meetings as any[]).filter((meeting: any) => {
    const meetingDate = new Date(meeting.date);
    const now = new Date();
    return meetingDate > now && meeting.status === 'scheduled';
  }).slice(0, 3);

  if (meetingsLoading) {
    return (
      <div className="min-h-screen flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" data-testid="meetings-page">
      <AdminSidebar />

      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground" data-testid="page-title">Meetings</h2>
              <p className="text-muted-foreground">Schedule and manage group meetings</p>
            </div>
            {canScheduleMeetings ? (
              <Button 
                onClick={() => setIsScheduleModalOpen(true)}
                data-testid="button-schedule-meeting"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </Button>
            ) : (
              <Badge variant="secondary">
                <Users className="w-3 h-3 mr-1" />
                View Only Access
              </Badge>
            )}
          </div>
        </header>

        {/* Content */}
        <div className="p-6 overflow-y-auto h-[calc(100vh-88px)]">
          {/* Meeting Alarms - Priority Notifications */}
          {upcomingMeetingsWithAlarms.length > 0 && (
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 rounded-lg border border-orange-200 dark:border-orange-800 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="h-6 w-6 text-orange-600 animate-bounce" />
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  🔔 Meeting Alerts & Countdowns
                </h3>
                <Badge variant="destructive" className="animate-pulse">
                  {upcomingMeetingsWithAlarms.length} URGENT
                </Badge>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {upcomingMeetingsWithAlarms.slice(0, 2).map((meeting: any) => (
                  <MeetingCountdown
                    key={meeting.id}
                    meeting={meeting}
                    groupName={getGroupName(meeting.groupId)}
                  />
                ))}
              </div>
              {upcomingMeetingsWithAlarms.length > 2 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    And {upcomingMeetingsWithAlarms.length - 2} more meetings within 24 hours...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Regular Upcoming Meetings Card */}
          {upcomingMeetings.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Meetings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMeetings.map((meeting: any) => (
                  <div 
                    key={meeting.id} 
                    className="p-4 border border-border rounded-lg hover:bg-muted/25 transition-colors"
                    data-testid={`upcoming-meeting-${meeting.id}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-foreground" data-testid={`meeting-group-${meeting.id}`}>
                        {getGroupName(meeting.groupId)}
                      </h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Upcoming
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(meeting.date), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(meeting.date), "h:mm a")}</span>
                      </div>
                      {meeting.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{meeting.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger className="w-48" data-testid="select-group-filter">
                <SelectValue placeholder="Filter by group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {(groups as any[]).map((group: any) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48" data-testid="select-status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meetings Table */}
          {filteredMeetings.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <Calendar className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No meetings found</h3>
              <p className="text-muted-foreground mb-4">
                {selectedGroupId !== "all" || selectedStatus !== "all" 
                  ? "Try adjusting your filters" 
                  : "Schedule your first group meeting to get started"
                }
              </p>
              {selectedGroupId === "all" && selectedStatus === "all" && canScheduleMeetings && (
                <Button 
                  onClick={() => setIsScheduleModalOpen(true)}
                  data-testid="button-first-meeting"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule First Meeting
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Group</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date & Time</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Location</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Attendees</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMeetings.map((meeting: any) => (
                      <tr 
                        key={meeting.id} 
                        className="border-b border-border hover:bg-muted/25"
                        data-testid={`meeting-row-${meeting.id}`}
                      >
                        <td className="p-4 text-sm text-foreground" data-testid={`meeting-group-${meeting.id}`}>
                          {getGroupName(meeting.groupId)}
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          <div>
                            <div className="font-medium">
                              {format(new Date(meeting.date), "MMM dd, yyyy")}
                            </div>
                            <div className="text-muted-foreground">
                              {format(new Date(meeting.date), "h:mm a")}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {meeting.location || "Not specified"}
                        </td>
                        <td className="p-4 text-sm text-foreground">
                          {meeting.attendees ? meeting.attendees.length : 0} attendees
                        </td>
                        <td className="p-4">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(meeting.status)}`}
                            data-testid={`meeting-status-${meeting.id}`}
                          >
                            {meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" data-testid={`button-view-meeting-${meeting.id}`}>
                              View
                            </Button>
                            {meeting.status === 'scheduled' && (
                              <Button variant="ghost" size="sm" data-testid={`button-edit-meeting-${meeting.id}`}>
                                Edit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        open={isScheduleModalOpen}
        onOpenChange={setIsScheduleModalOpen}
      />
    </div>
  );
}

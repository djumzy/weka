import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Clock, Calendar, MapPin, X, AlertTriangle } from "lucide-react";
import { format, differenceInHours, differenceInMinutes } from "date-fns";

interface MeetingNotificationsProps {
  groupId?: string;
  memberId?: string;
}

export function MeetingNotifications({ groupId }: MeetingNotificationsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Fetch meetings for the group
  const { data: meetings = [] } = useQuery({
    queryKey: ["/api/meetings", groupId],
    queryFn: async () => {
      if (!groupId) return [];
      const response = await fetch(`/api/meetings?groupId=${groupId}`);
      if (!response.ok) throw new Error('Failed to fetch meetings');
      return response.json();
    },
    enabled: !!groupId,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Filter upcoming meetings
  const upcomingMeetings = meetings.filter((meeting: any) => {
    const meetingDate = new Date(meeting.date);
    const now = new Date();
    const hoursUntil = differenceInHours(meetingDate, now);
    return meetingDate > now && meeting.status === 'scheduled' && hoursUntil <= 24;
  }).filter((meeting: any) => !dismissedAlerts.includes(meeting.id));

  const dismissAlert = (meetingId: string) => {
    setDismissedAlerts(prev => [...prev, meetingId]);
  };

  if (upcomingMeetings.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {upcomingMeetings.map((meeting: any) => {
        const meetingDate = new Date(meeting.date);
        const now = new Date();
        const hoursUntil = differenceInHours(meetingDate, now);
        const minutesUntil = differenceInMinutes(meetingDate, now);
        
        const isUrgent = minutesUntil <= 60; // Less than 1 hour
        const isHappeningSoon = minutesUntil <= 5; // Less than 5 minutes

        return (
          <Card 
            key={meeting.id}
            className={`${
              isHappeningSoon 
                ? 'border-red-500 bg-red-50 dark:bg-red-950/20 animate-pulse' 
                : isUrgent 
                ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' 
                : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {isHappeningSoon ? (
                    <AlertTriangle className="h-5 w-5 text-red-600 animate-bounce" />
                  ) : (
                    <Bell className="h-5 w-5 text-orange-600" />
                  )}
                  Meeting Alert
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={
                      isHappeningSoon 
                        ? "destructive" 
                        : isUrgent 
                        ? "secondary" 
                        : "outline"
                    }
                  >
                    {isHappeningSoon 
                      ? "🚨 STARTING NOW" 
                      : isUrgent 
                      ? "⏰ STARTING SOON" 
                      : "📅 24H REMINDER"
                    }
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissAlert(meeting.id)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Countdown */}
                <div className="text-center">
                  <p className={`text-2xl font-bold ${
                    isHappeningSoon 
                      ? 'text-red-600' 
                      : isUrgent 
                      ? 'text-orange-600' 
                      : 'text-yellow-600'
                  }`}>
                    {hoursUntil > 0 
                      ? `${hoursUntil}h ${minutesUntil % 60}m` 
                      : `${minutesUntil}m`
                    } remaining
                  </p>
                  <p className="text-sm text-muted-foreground">Until meeting starts</p>
                </div>

                {/* Meeting Details */}
                <div className="space-y-2 text-sm border-t pt-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(meetingDate, "EEEE, MMMM do")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{format(meetingDate, "h:mm a")}</span>
                  </div>
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{meeting.location}</span>
                    </div>
                  )}
                  {meeting.agenda && (
                    <div className="mt-2">
                      <p className="font-medium mb-1">Agenda:</p>
                      <p className="text-muted-foreground">{meeting.agenda}</p>
                    </div>
                  )}
                </div>

                {/* Action Message */}
                <div className={`p-3 rounded-lg text-center ${
                  isHappeningSoon 
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                    : isUrgent 
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200' 
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                }`}>
                  <p className="font-medium">
                    {isHappeningSoon 
                      ? "🔔 Meeting is starting now! Please join your group." 
                      : isUrgent 
                      ? "⏰ Meeting starts in less than 1 hour. Get ready!" 
                      : "📅 Reminder: You have a meeting tomorrow. Mark your calendar!"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
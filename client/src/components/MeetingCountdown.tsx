import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, Calendar, MapPin, AlertTriangle } from "lucide-react";
import { format, isToday, isTomorrow, differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";

interface MeetingCountdownProps {
  meeting: {
    id: string;
    groupId: string;
    date: string;
    location?: string;
    agenda?: string;
    status: string;
  };
  groupName: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
}

export function MeetingCountdown({ meeting, groupName }: MeetingCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [shouldShowAlarm, setShouldShowAlarm] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const meetingDate = new Date(meeting.date);
      const totalMs = meetingDate.getTime() - now.getTime();

      if (totalMs <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });
        return;
      }

      const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds, total: totalMs });

      // Show alarm for meetings happening in next 24 hours or right now (within 5 minutes)
      const isWithin24Hours = totalMs <= 24 * 60 * 60 * 1000;
      const isHappeningNow = totalMs <= 5 * 60 * 1000; // 5 minutes before
      setShouldShowAlarm(isWithin24Hours || isHappeningNow);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [meeting.date]);

  const meetingDate = new Date(meeting.date);
  const now = new Date();
  
  // Determine urgency level
  const getUrgencyLevel = () => {
    const totalHours = timeRemaining.total / (1000 * 60 * 60);
    if (totalHours <= 0.083) return 'happening-now'; // 5 minutes
    if (totalHours <= 1) return 'urgent'; // 1 hour
    if (totalHours <= 24) return 'soon'; // 24 hours
    return 'scheduled';
  };

  const urgencyLevel = getUrgencyLevel();

  const getUrgencyStyle = () => {
    switch (urgencyLevel) {
      case 'happening-now':
        return 'border-red-500 bg-red-50 dark:bg-red-950/20';
      case 'urgent':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'soon':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const getUrgencyBadge = () => {
    switch (urgencyLevel) {
      case 'happening-now':
        return { text: 'HAPPENING NOW', variant: 'destructive' as const };
      case 'urgent':
        return { text: 'STARTING SOON', variant: 'destructive' as const };
      case 'soon':
        return { text: '24H REMINDER', variant: 'secondary' as const };
      default:
        return { text: 'SCHEDULED', variant: 'outline' as const };
    }
  };

  const badge = getUrgencyBadge();

  if (timeRemaining.total <= 0 && meeting.status === 'scheduled') {
    return (
      <Card className="border-gray-500 bg-gray-50 dark:bg-gray-950/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              {groupName}
            </CardTitle>
            <Badge variant="secondary">MEETING TIME</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-lg font-semibold text-gray-600 mb-2">
              Meeting is happening now!
            </p>
            <p className="text-sm text-muted-foreground">
              {format(meetingDate, "h:mm a")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${getUrgencyStyle()} transition-colors ${shouldShowAlarm ? 'animate-pulse' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {shouldShowAlarm && <Bell className="h-5 w-5 text-orange-600 animate-bounce" />}
            <Calendar className="h-5 w-5" />
            {groupName}
          </CardTitle>
          <Badge variant={badge.variant}>{badge.text}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Countdown Display */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
              <div className="text-xl font-bold text-primary">{timeRemaining.days}</div>
              <div className="text-xs text-muted-foreground">Days</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
              <div className="text-xl font-bold text-primary">{timeRemaining.hours}</div>
              <div className="text-xs text-muted-foreground">Hours</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
              <div className="text-xl font-bold text-primary">{timeRemaining.minutes}</div>
              <div className="text-xs text-muted-foreground">Minutes</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border">
              <div className="text-xl font-bold text-primary">{timeRemaining.seconds}</div>
              <div className="text-xs text-muted-foreground">Seconds</div>
            </div>
          </div>

          {/* Meeting Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{format(meetingDate, "EEEE, MMMM do 'at' h:mm a")}</span>
            </div>
            {meeting.location && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{meeting.location}</span>
              </div>
            )}
            {meeting.agenda && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-1">Agenda:</p>
                <p className="text-sm text-muted-foreground">{meeting.agenda}</p>
              </div>
            )}
          </div>

          {/* Alarm Notification */}
          {urgencyLevel === 'happening-now' && (
            <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <span className="text-sm text-red-800 dark:text-red-200 font-medium">
                🔔 MEETING ALARM: This meeting is starting now!
              </span>
            </div>
          )}
          
          {urgencyLevel === 'soon' && (
            <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Bell className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                🕐 24-Hour Reminder: Don't forget about tomorrow's meeting!
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
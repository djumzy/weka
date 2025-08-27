import { Group } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";

interface GroupCardProps {
  group: Group;
  memberCount: number;
  totalSavings: number;
  nextMeeting?: Date;
}

export function GroupCard({ group, memberCount, totalSavings, nextMeeting }: GroupCardProps) {
  const initials = group.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/groups/${group.id}`}>
      <div 
        className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/25 transition-colors cursor-pointer"
        data-testid={`group-card-${group.id}`}
      >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-sm font-semibold text-primary" data-testid={`group-initials-${group.id}`}>
            {initials}
          </span>
        </div>
        <div>
          <p className="font-medium text-foreground" data-testid={`group-name-${group.id}`}>
            {group.name}
          </p>
          <p className="text-sm text-muted-foreground" data-testid={`group-stats-${group.id}`}>
            {memberCount} members • ${totalSavings.toFixed(2)} total savings
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-medium ${group.isActive ? 'text-green-600' : 'text-gray-600'}`}>
          {group.isActive ? 'Active' : 'Inactive'}
        </p>
        {nextMeeting && (
          <p className="text-xs text-muted-foreground" data-testid={`next-meeting-${group.id}`}>
            Next meeting: {format(nextMeeting, "MMM dd")}
          </p>
        )}
      </div>
      </div>
    </Link>
  );
}

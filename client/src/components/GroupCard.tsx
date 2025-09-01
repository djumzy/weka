import { Group } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2 } from "lucide-react";

interface GroupCardProps {
  group: Group;
  memberCount: number;
  totalSavings: number;
  nextMeeting?: Date;
  onViewClick?: (group: Group) => void;
  onEditClick?: (group: Group) => void;
  onDeleteClick?: (group: Group) => void;
  showDeleteButton?: boolean;
}

export function GroupCard({ group, memberCount, totalSavings, nextMeeting, onViewClick, onEditClick, onDeleteClick, showDeleteButton }: GroupCardProps) {
  const initials = group.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/25 transition-colors"
      data-testid={`group-card-${group.id}`}
    >
      <Link href={`/groups/${group.id}`} className="flex-1">
        <div className="flex items-center space-x-3 cursor-pointer">
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
      </Link>
      
      <div className="flex items-center gap-3">
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
        
        <div className="flex gap-2">
          {onEditClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEditClick(group);
              }}
              className="flex items-center gap-1"
              data-testid={`edit-group-${group.id}`}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          {showDeleteButton && onDeleteClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteClick(group);
              }}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              data-testid={`delete-group-${group.id}`}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          {onViewClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onViewClick(group);
              }}
              className="flex items-center gap-1"
              data-testid={`view-group-${group.id}`}
            >
              <Eye className="h-4 w-4" />
              View
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

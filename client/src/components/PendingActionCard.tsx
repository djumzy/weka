import { LucideIcon } from "lucide-react";

interface PendingActionCardProps {
  type: "loan" | "member" | "meeting";
  title: string;
  description: string;
  details: string;
  icon: LucideIcon;
  onReview: () => void;
}

const typeStyles = {
  loan: "border-amber-200 bg-amber-50",
  member: "border-blue-200 bg-blue-50",
  meeting: "border-green-200 bg-green-50",
};

const iconStyles = {
  loan: "bg-amber-100 text-amber-600",
  member: "bg-blue-100 text-blue-600",
  meeting: "bg-green-100 text-green-600",
};

export function PendingActionCard({ 
  type, 
  title, 
  description, 
  details, 
  icon: Icon, 
  onReview 
}: PendingActionCardProps) {
  const cardStyle = typeStyles[type];
  const iconStyle = iconStyles[type];

  return (
    <div className={`p-4 rounded-lg border ${cardStyle}`} data-testid={`pending-action-${type}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${iconStyle}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-foreground" data-testid={`action-title-${type}`}>
              {title}
            </p>
            <p className="text-sm text-muted-foreground" data-testid={`action-description-${type}`}>
              {description}
            </p>
            <p className="text-xs text-muted-foreground mt-1" data-testid={`action-details-${type}`}>
              {details}
            </p>
          </div>
        </div>
        <button 
          className="text-sm text-primary font-medium hover:underline"
          onClick={onReview}
          data-testid={`button-review-${type}`}
        >
          Review
        </button>
      </div>
    </div>
  );
}

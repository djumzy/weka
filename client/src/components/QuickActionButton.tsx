import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  onClick: () => void;
  testId: string;
}

export function QuickActionButton({
  title,
  description,
  icon: Icon,
  iconColor,
  iconBgColor,
  onClick,
  testId,
}: QuickActionButtonProps) {
  return (
    <button
      className="w-full flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
      onClick={onClick}
      data-testid={testId}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBgColor}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="text-left">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

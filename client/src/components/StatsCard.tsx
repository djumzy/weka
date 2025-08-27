import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  trend?: {
    value: string;
    label: string;
    isPositive?: boolean;
  };
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  iconBgColor, 
  trend 
}: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6" data-testid="stats-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-foreground mt-2" data-testid={`stat-value-${title.toLowerCase().replace(' ', '-')}`}>
            {value}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBgColor}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-4 text-sm">
          <span className={`font-medium ${trend.isPositive !== false ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-muted-foreground ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

import { LucideIcon } from "lucide-react";
import { formatCurrency, formatCurrencyCompact } from "@/utils/currency";

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
  onClick?: () => void;
  className?: string;
  isCurrency?: boolean;
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  iconBgColor, 
  trend,
  onClick,
  className = "",
  isCurrency = false
}: StatsCardProps) {
  // Format value based on type and screen size
  const formatValue = (val: string | number) => {
    if (isCurrency && typeof val === 'number') {
      // Use compact format for currency on mobile
      return formatCurrencyCompact(val);
    }
    return val;
  };

  return (
    <div 
      className={`bg-card rounded-lg border border-border p-4 sm:p-6 ${className}`} 
      data-testid="stats-card"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-foreground mt-1 sm:mt-2 break-words" data-testid={`stat-value-${title.toLowerCase().replace(' ', '-')}`}>
            {formatValue(value)}
          </p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgColor}`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center mt-3 sm:mt-4 text-xs sm:text-sm">
          <span className={`font-medium ${trend.isPositive !== false ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-muted-foreground ml-1 truncate">{trend.label}</span>
        </div>
      )}
    </div>
  );
}

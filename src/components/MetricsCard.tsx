import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "success" | "warning" | "default";
}

const variantStyles = {
  primary: "bg-gradient-primary text-primary-foreground shadow-medium",
  secondary: "bg-secondary text-secondary-foreground shadow-soft",
  success: "bg-success text-success-foreground shadow-soft",
  warning: "bg-warning text-warning-foreground shadow-soft",
  default: "bg-gradient-card text-card-foreground shadow-soft border",
};

export function MetricsCard({ 
  title, 
  value, 
  change, 
  trend = "neutral", 
  icon, 
  variant = "default" 
}: MetricsCardProps) {
  return (
    <Card className={cn(
      "p-6 transition-all duration-300 hover:shadow-medium hover:scale-[1.02]",
      variantStyles[variant]
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change && (
            <p className={cn(
              "text-sm font-medium",
              trend === "up" ? "text-green-400" : 
              trend === "down" ? "text-red-400" : 
              "opacity-70"
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="opacity-60">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Menu, 
  X, 
  BarChart3, 
  Users, 
  CheckCircle, 
  Clock, 
  Brain, 
  Activity,
  Database,
  Settings,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AISidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  selectedBatch?: string;
  onBatchChange?: (batchId: string) => void;
  batches?: Array<{ id: string; name: string; type: 'Fresh' | 'QCed'; jobCount: number }>;
  anomalyCount?: number;
}

export function AISidebar({ 
  currentView, 
  onViewChange, 
  selectedBatch, 
  onBatchChange,
  batches = [],
  anomalyCount = 0
}: AISidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      category: "AI Dashboard",
      items: [
        { id: "overview", label: "Overview", icon: BarChart3, active: true },
        { id: "production", label: "Production", icon: Activity },
        { id: "quality", label: "Quality", icon: CheckCircle },
        { id: "user-tracking", label: "User Tracking", icon: Users },
        { id: "operations", label: "Operations", icon: Settings },
      ]
    },
    {
      category: "AI Insights",
      items: [
        { 
          id: "ai-insights", 
          label: "Anomaly Detection", 
          icon: Brain, 
          badge: anomalyCount > 0 ? anomalyCount : undefined,
          badgeVariant: "destructive" as const
        },
        { id: "pattern-analysis", label: "Pattern Analysis", icon: TrendingUp },
        { id: "alerts", label: "Smart Alerts", icon: AlertTriangle },
      ]
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-gradient-card border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-80",
        "lg:static lg:z-auto"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-sm">AI Dashboard</h2>
                <p className="text-xs text-muted-foreground">Annotation Platform</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? <Menu size={16} /> : <X size={16} />}
          </Button>
        </div>

        {/* Batch Selection */}
        {!isCollapsed && batches.length > 0 && (
          <div className="p-4 border-b border-border">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">ACTIVE BATCH</label>
              <select 
                value={selectedBatch || ''}
                onChange={(e) => onBatchChange?.(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Batches</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name} ({batch.type}) - {batch.jobCount} jobs
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navigationItems.map((section, sectionIndex) => (
            <div key={section.category} className="mb-6">
              {!isCollapsed && (
                <h3 className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {section.category}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => onViewChange(item.id)}
                      className={cn(
                        "w-full justify-start gap-3 h-9",
                        isCollapsed ? "px-2" : "px-3",
                        isActive && "bg-primary/10 text-primary border-l-2 border-primary"
                      )}
                    >
                      <Icon size={16} className="shrink-0" />
                      {!isCollapsed && (
                        <>
                          <span className="text-sm">{item.label}</span>
                          {item.badge && (
                            <Badge 
                              variant={item.badgeVariant || "secondary"} 
                              className="ml-auto h-5 px-1.5 text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  );
                })}
              </div>
              {sectionIndex < navigationItems.length - 1 && !isCollapsed && (
                <Separator className="my-4" />
              )}
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="bg-success/10 p-2 rounded-lg">
                <Activity className="h-4 w-4 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium">System Status</p>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </div>
              <Badge variant="success" className="h-5 px-1.5 text-xs">
                Live
              </Badge>
            </div>
          </div>
        )}
      </aside>

      {/* Main content spacer */}
      <div className={cn(
        "transition-all duration-300 lg:block hidden",
        isCollapsed ? "w-16" : "w-80"
      )} />
    </>
  );
}
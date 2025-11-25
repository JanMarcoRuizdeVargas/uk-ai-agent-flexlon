import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricsCard({ title, value, subtitle, icon: Icon, trend, className }: MetricsCardProps) {
  return (
    <Card className={`p-6 bg-card border-panel-border hover:border-primary/50 transition-all ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${
          trend === 'up' ? 'bg-energy-low/10 text-energy-low' :
          trend === 'down' ? 'bg-destructive/10 text-destructive' :
          'bg-primary/10 text-primary'
        }`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  );
}

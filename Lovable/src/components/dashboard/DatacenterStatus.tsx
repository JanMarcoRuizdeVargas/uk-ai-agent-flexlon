import { Card } from '@/components/ui/card';
import { Datacenter } from '@/types/orchestration';
import { Server, Battery, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface DatacenterStatusProps {
  datacenters: Datacenter[];
}

export function DatacenterStatus({ datacenters }: DatacenterStatusProps) {
  const getBatteryColor = (level: number) => {
    if (level >= 70) return 'text-energy-low';
    if (level >= 30) return 'text-energy-medium';
    return 'text-energy-high';
  };

  const getLoadColor = (current: number, capacity: number) => {
    const percent = (current / capacity) * 100;
    if (percent >= 80) return 'text-energy-high';
    if (percent >= 50) return 'text-energy-medium';
    return 'text-energy-low';
  };

  return (
    <Card className="p-6 bg-card border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Data Centers</h3>
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">{datacenters.length} Active</span>
        </div>
      </div>

      <div className="space-y-4">
        {datacenters.map((dc) => {
          const loadPercent = (dc.currentLoadKW / dc.capacityKW) * 100;
          
          return (
            <div
              key={dc.id}
              className="p-4 rounded-lg border border-border bg-panel-bg hover:border-primary/50 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-foreground">{dc.name}</h4>
                  <p className="text-xs text-muted-foreground">{dc.region}</p>
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Power Draw</span>
                  </div>
                  <span className={`text-sm font-semibold ${getLoadColor(dc.currentLoadKW, dc.capacityKW)}`}>
                    {dc.currentLoadKW.toFixed(0)} / {dc.capacityKW.toFixed(0)} kW
                  </span>
                </div>
                <Progress value={loadPercent} className="h-2 transition-all duration-700" />
                <p className="text-xs text-muted-foreground text-right">
                  {loadPercent.toFixed(1)}% utilized
                </p>
              </div>

              {/* Battery */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Battery className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Battery Storage</span>
                  </div>
                   <span className={`text-sm font-semibold transition-all duration-700 ${getBatteryColor(dc.batteryLevelPercent)}`}>
                     {dc.batteryLevelPercent.toFixed(0)}%
                   </span>
                </div>
                <Progress value={dc.batteryLevelPercent} className="h-2 transition-all duration-700" />
                <p className="text-xs text-muted-foreground text-right">
                  {((dc.batteryCapacityKWh * dc.batteryLevelPercent) / 100).toFixed(1)} / {dc.batteryCapacityKWh.toFixed(0)} kWh
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

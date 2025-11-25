import { Card } from '@/components/ui/card';
import { OrchestrationDecision } from '@/types/orchestration';
import { Badge } from '@/components/ui/badge';
import { FileText, Leaf, DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

interface DecisionLogProps {
  decisions: OrchestrationDecision[];
  simulationTime: Date;
}

export function DecisionLog({ decisions }: DecisionLogProps) {
  const [optimizationPreference, setOptimizationPreference] = useState(50); // 0 = cost-efficient, 100 = low-carbon

  // Generate exemplary workloads if none exist
  const workloadDecisions = useMemo(() => {
    if (decisions.length > 0) return decisions;
    
    // Create exemplary workloads distributed across the day
    return [
      { id: '1', timestamp: new Date(2025, 0, 25, 2, 0), action: 'execute' as const, workloadId: 'batch-1', reason: 'Low-cost overnight processing', expectedSavings: { cost: 15.2, carbon: 5.3 }, beckn: { stage: 'complete' as const } },
      { id: '2', timestamp: new Date(2025, 0, 25, 3, 30), action: 'execute' as const, workloadId: 'ai-train-1', reason: 'Off-peak training', expectedSavings: { cost: 22.1, carbon: 8.1 }, beckn: { stage: 'complete' as const } },
      { id: '3', timestamp: new Date(2025, 0, 25, 11, 0), action: 'execute' as const, workloadId: 'inference-1', reason: 'Solar-powered inference', expectedSavings: { cost: 8.5, carbon: 12.4 }, beckn: { stage: 'complete' as const } },
      { id: '4', timestamp: new Date(2025, 0, 25, 13, 0), action: 'execute' as const, workloadId: 'batch-2', reason: 'Peak solar generation', expectedSavings: { cost: 6.3, carbon: 15.7 }, beckn: { stage: 'complete' as const } },
      { id: '5', timestamp: new Date(2025, 0, 25, 14, 30), action: 'execute' as const, workloadId: 'ai-train-2', reason: 'Renewable energy available', expectedSavings: { cost: 9.1, carbon: 14.2 }, beckn: { stage: 'complete' as const } },
      { id: '6', timestamp: new Date(2025, 0, 25, 19, 0), action: 'execute' as const, workloadId: 'batch-3', reason: 'Evening processing', expectedSavings: { cost: 11.4, carbon: 7.6 }, beckn: { stage: 'complete' as const } },
      { id: '7', timestamp: new Date(2025, 0, 25, 22, 30), action: 'execute' as const, workloadId: 'inference-2', reason: 'Low-cost overnight slot', expectedSavings: { cost: 18.9, carbon: 4.2 }, beckn: { stage: 'complete' as const } },
      { id: '8', timestamp: new Date(2025, 0, 25, 23, 30), action: 'execute' as const, workloadId: 'batch-4', reason: 'Off-peak batch job', expectedSavings: { cost: 21.3, carbon: 3.8 }, beckn: { stage: 'complete' as const } },
    ];
  }, [decisions]);
  // Calculate optimal scheduling based on preference
  // 0 = cost-efficient (spread across off-peak hours)
  // 100 = low-carbon (concentrated around noon: 11-15)
  const getOptimalHour = (originalHour: number, preference: number): number => {
    // Low-carbon target: noon (12:00)
    const lowCarbonTarget = 12;
    // Cost-efficient: keep original off-peak times
    const costEfficientHour = originalHour;
    
    // Interpolate between original and noon based on preference
    const interpolationFactor = preference / 100;
    const shiftedHour = costEfficientHour + (lowCarbonTarget - costEfficientHour) * interpolationFactor;
    
    return Math.round(shiftedHour) % 24;
  };

  // Prepare data for 24-hour chart with smooth transitions
  const chartData = useMemo(() => {
    return Array.from({ length: 24 }, (_, hour) => {
      const scheduledTasks = workloadDecisions
        .filter(d => d.action === 'execute' || d.action === 'defer')
        .filter(d => {
          const originalHour = d.timestamp.getHours();
          const taskHour = getOptimalHour(originalHour, optimizationPreference);
          return taskHour === hour;
        })
        .length;

      return {
        hour: `${hour.toString().padStart(2, '0')}:00`,
        tasks: scheduledTasks,
        hourNum: hour,
      };
    });
  }, [workloadDecisions, optimizationPreference]);

  const getBarColor = (hour: number): string => {
    // Color based on typical carbon intensity pattern
    if (hour >= 10 && hour <= 16) return 'hsl(var(--energy-low))'; // Low carbon (solar)
    if (hour >= 0 && hour <= 6 || hour >= 22) return 'hsl(var(--primary))'; // Low cost
    return 'hsl(var(--compute-active))'; // Medium
  };
  
  return (
    <Card className="p-6 bg-card border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Optimal Workload Schedule</h3>
        <Badge variant="outline" className="text-xs">
          {workloadDecisions.length} Tasks
        </Badge>
      </div>
      
      <div className="flex gap-6">
        {/* Chart */}
        <div className="flex-1 transition-all duration-300">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Time (24h)', position: 'insideBottom', offset: -5, fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Number of Tasks', angle: -90, position: 'insideLeft', fill: 'hsl(var(--foreground))' }}
                domain={[0, 8]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
              />
              <Bar 
                dataKey="tasks" 
                name="Scheduled Tasks" 
                radius={[4, 4, 0, 0]}
                animationDuration={600}
                animationEasing="ease-in-out"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getBarColor(entry.hourNum)}
                    className="transition-all duration-500"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Vertical Slider */}
        <div className="flex flex-col items-center gap-4 py-4 px-6 rounded-lg bg-panel-bg border border-panel-border">
          <div className="flex items-center gap-2 text-xs text-energy-low">
            <Leaf className="w-4 h-4" />
            <span className="font-semibold">Low Carbon</span>
          </div>
          
          <div className="h-[300px] flex items-center px-4 py-3 rounded-md bg-background/50">
            <Slider
              orientation="vertical"
              value={[optimizationPreference]}
              onValueChange={([value]) => setOptimizationPreference(value)}
              max={100}
              min={0}
              step={1}
              className="h-full"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-primary">
            <DollarSign className="w-4 h-4" />
            <span className="font-semibold">Cost Efficient</span>
          </div>
          
          <div className="text-center mt-2">
            <p className="text-xs text-muted-foreground">Preference</p>
            <p className="text-sm font-semibold text-foreground">{optimizationPreference}%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

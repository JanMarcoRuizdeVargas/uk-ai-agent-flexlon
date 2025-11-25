import { Card } from '@/components/ui/card';
import { ComputeWorkload } from '@/types/orchestration';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cpu, Clock, Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WorkloadListProps {
  workloads: ComputeWorkload[];
  simulationTime: Date;
  className?: string;
}

export function WorkloadList({ workloads, className }: WorkloadListProps) {
  const getStatusColor = (status: ComputeWorkload['status']) => {
    switch (status) {
      case 'running':
        return 'bg-compute-active/20 text-compute-active border-compute-active';
      case 'deferred':
        return 'bg-compute-deferred/20 text-compute-deferred border-compute-deferred';
      case 'completed':
        return 'bg-compute-completed/20 text-compute-completed border-compute-completed';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };
  
  const getPriorityColor = (priority: ComputeWorkload['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/20 text-destructive border-destructive';
      case 'medium':
        return 'bg-energy-medium/20 text-energy-medium border-energy-medium';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };
  
  return (
    <Card className={cn("p-6 bg-card border-panel-border", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Compute Workloads</h3>
        <Badge variant="outline" className="text-xs">
          {workloads.length} Total
        </Badge>
      </div>
      
      <ScrollArea className="h-[800px] pr-4">
        <div className="space-y-3">
          {workloads.map((workload) => (
            <div
              key={workload.id}
              className="p-4 rounded-lg border border-border bg-panel-bg hover:border-primary/50 transition-all animate-slide-in"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-foreground">{workload.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{workload.id}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(workload.status)}>
                    {workload.status}
                  </Badge>
                  <Badge className={getPriorityColor(workload.priority)}>
                    {workload.priority}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium text-foreground">{workload.type}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Power:</span>
                  <span className="font-medium text-foreground">{workload.powerRequirement} kW</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium text-foreground">{workload.duration} min</span>
                </div>
                
                {workload.flexibility > 0 && (
                  <div className="col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertCircle className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Flex:</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-foreground">
                        {workload.createdTime.toLocaleString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="text-muted-foreground"> - </span>
                      <span className="text-foreground">
                        {new Date(workload.createdTime.getTime() + workload.flexibility * 60 * 60 * 1000).toLocaleString('en-GB', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="text-energy-low ml-2">({workload.flexibility}h window)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}

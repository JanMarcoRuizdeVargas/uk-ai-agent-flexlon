import { useState, useEffect } from "react";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { GridStatus } from "@/components/dashboard/GridStatus";
import { WorkloadList } from "@/components/dashboard/WorkloadList";
import { DecisionLog } from "@/components/dashboard/DecisionLog";
import { BecknLog } from "@/components/dashboard/BecknLog";
import { DatacenterStatus } from "@/components/dashboard/DatacenterStatus";
import { ComputeWorkload, GridSignal, OrchestrationDecision, SystemMetrics, BecknMessage, Datacenter } from "@/types/orchestration";
import { OrchestrationEngine } from "@/lib/orchestrationEngine";
import { generateMockWorkload, generateMockGridSignal } from "@/lib/simulationData";
import { generateMockDatacenters } from "@/lib/datacenterData";
import { Zap, DollarSign, Cloud, TrendingUp, Activity, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import flexlonLogo from "@/assets/flexlon-logo.png";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [simulationTime, setSimulationTime] = useState<Date>(new Date());
  const [workloads, setWorkloads] = useState<ComputeWorkload[]>([]);
  const [gridSignal, setGridSignal] = useState<GridSignal>(generateMockGridSignal());
  const [datacenters, setDatacenters] = useState<Datacenter[]>(generateMockDatacenters());
  const [decisions, setDecisions] = useState<OrchestrationDecision[]>([]);
  const [becknMessages, setBecknMessages] = useState<BecknMessage[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    totalWorkloads: 0,
    activeWorkloads: 0,
    deferredWorkloads: 0,
    completedWorkloads: 0,
    totalCostSaved: 0,
    totalCarbonReduced: 0,
    flexibilityRevenue: 0,
    currentPowerDraw: 0,
    averageCostPerInference: 0,
  });
  const [engine] = useState(() => new OrchestrationEngine());
  const [isRunning, setIsRunning] = useState(false);
  const [flaskUrl, setFlaskUrl] = useState('');
  const [isCallingFlask, setIsCallingFlask] = useState(false);
  const { toast } = useToast();

  // Simulation clock - advances 60x faster than real time
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSimulationTime((prev) => new Date(prev.getTime() + 60000)); // Add 1 minute per real second
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Initialize with some workloads
  useEffect(() => {
    const initialWorkloads = Array.from({ length: 5 }, (_, i) => generateMockWorkload(i, simulationTime));
    setWorkloads(initialWorkloads);
  }, []);

  // Update grid signal periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGridSignal(generateMockGridSignal());
      // Update datacenters with slight variations
      setDatacenters(generateMockDatacenters());
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Process workloads
  useEffect(() => {
    if (!isRunning || workloads.length === 0) return;

    const interval = setInterval(() => {
      setWorkloads((prevWorkloads) => {
        const updated = [...prevWorkloads];

        // Find a queued workload to process
        const queuedIndex = updated.findIndex((w) => w.status === "queued");
        if (queuedIndex !== -1) {
          const workload = updated[queuedIndex];
          const decision = engine.evaluateWorkload(workload, gridSignal, simulationTime);

          setDecisions((prev) => [decision, ...prev].slice(0, 50)); // Keep last 50

          // Generate corresponding Beckn protocol messages for the decision
          const becknStageMessages = generateBecknMessagesForDecision(decision, simulationTime);
          setBecknMessages((prev) => [...becknStageMessages, ...prev].slice(0, 100));

          if (decision.action === "defer") {
            updated[queuedIndex] = { ...workload, status: "deferred" };
            toast({
              title: "Workload Deferred",
              description: `${workload.name} deferred to optimize cost/carbon`,
            });
          } else if (decision.action === "reroute") {
            updated[queuedIndex] = { ...workload, status: "running" };
            toast({
              title: "Workload Rerouted",
              description: `${workload.name} rerouted to lower-carbon region`,
            });
          } else if (decision.action === "battery-activation") {
            updated[queuedIndex] = { ...workload, status: "running" };
            toast({
              title: "Battery Activated",
              description: `${workload.name} powered by battery storage`,
            });
          } else {
            updated[queuedIndex] = { ...workload, status: "running" };
            toast({
              title: "Workload Executing",
              description: `${workload.name} started execution`,
            });
          }
        }

        // Progress running workloads
        const runningIndices = updated.map((w, i) => ({ w, i })).filter(({ w }) => w.status === "running");

        if (runningIndices.length > 0 && Math.random() > 0.7) {
          const { i } = runningIndices[Math.floor(Math.random() * runningIndices.length)];
          updated[i] = { ...updated[i], status: "completed", completedTime: new Date() };
          toast({
            title: "Workload Completed",
            description: `${updated[i].name} finished successfully`,
            variant: "default",
          });
        }

        // Sometimes process deferred workloads
        if (gridSignal.carbonIntensity < 150 && Math.random() > 0.8) {
          const deferredIndex = updated.findIndex((w) => w.status === "deferred");
          if (deferredIndex !== -1) {
            updated[deferredIndex] = { ...updated[deferredIndex], status: "running" };
          }
        }

        return updated;
      });

      // Update metrics
      setMetrics(engine.calculateMetrics(workloads));
    }, 3000); // Process every 3 seconds

    return () => clearInterval(interval);
  }, [isRunning, workloads, gridSignal, engine, toast]);

  // Add new workload periodically
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        // 40% chance
        const newWorkload = generateMockWorkload(workloads.length, simulationTime);
        setWorkloads((prev) => [...prev, newWorkload]);
        toast({
          title: "New Workload",
          description: `${newWorkload.name} added to queue`,
        });
      }
    }, 8000); // Check every 8 seconds

    return () => clearInterval(interval);
  }, [isRunning, workloads.length, toast]);

  const toggleSimulation = () => {
    setIsRunning(!isRunning);
    toast({
      title: isRunning ? "Simulation Paused" : "Simulation Started",
      description: isRunning ? "Agent orchestration paused" : "Agent actively processing workloads",
    });
  };

  const generateBecknMessagesForDecision = (decision: OrchestrationDecision, time: Date): BecknMessage[] => {
    const transactionId = decision.id;
    const messages: BecknMessage[] = [];
    
    // Generate search messages
    messages.push({
      id: `${transactionId}-search`,
      timestamp: new Date(time.getTime() - 3000),
      type: 'search',
      from: 'compute-agent',
      to: 'grid-agent',
      data: {
        context: {
          domain: 'beckn.one:DEG:compute-energy:1.0',
          action: 'discover',
          transaction_id: transactionId,
        }
      }
    });

    messages.push({
      id: `${transactionId}-on_search`,
      timestamp: new Date(time.getTime() - 2500),
      type: 'on_search',
      from: 'grid-agent',
      to: 'compute-agent',
      data: {
        context: {
          domain: 'beckn.one:DEG:compute-energy:1.0',
          action: 'on_search',
          transaction_id: transactionId,
        }
      }
    });

    // Generate select messages based on Beckn stage
    if (decision.beckn.stage === 'select' || decision.beckn.stage === 'confirm' || decision.beckn.stage === 'complete') {
      messages.push({
        id: `${transactionId}-select`,
        timestamp: new Date(time.getTime() - 2000),
        type: 'select',
        from: 'compute-agent',
        to: 'grid-agent',
        data: {
          context: {
            domain: 'beckn.one:DEG:compute-energy:1.0',
            action: 'select',
            transaction_id: transactionId,
          }
        }
      });

      messages.push({
        id: `${transactionId}-on_select`,
        timestamp: new Date(time.getTime() - 1500),
        type: 'on_select',
        from: 'grid-agent',
        to: 'compute-agent',
        data: {
          context: {
            domain: 'beckn.one:DEG:compute-energy:1.0',
            action: 'on_select',
            transaction_id: transactionId,
          }
        }
      });
    }

    // Generate init messages
    if (decision.beckn.stage === 'init' || decision.beckn.stage === 'confirm' || decision.beckn.stage === 'complete') {
      messages.push({
        id: `${transactionId}-init`,
        timestamp: new Date(time.getTime() - 1000),
        type: 'init',
        from: 'compute-agent',
        to: 'grid-agent',
        data: {
          context: {
            domain: 'beckn.one:DEG:compute-energy:1.0',
            action: 'init',
            transaction_id: transactionId,
          }
        }
      });

      messages.push({
        id: `${transactionId}-on_init`,
        timestamp: new Date(time.getTime() - 500),
        type: 'on_init',
        from: 'grid-agent',
        to: 'compute-agent',
        data: {
          context: {
            domain: 'beckn.one:DEG:compute-energy:1.0',
            action: 'on_init',
            transaction_id: transactionId,
          }
        }
      });
    }

    // Generate confirm messages
    if (decision.beckn.stage === 'confirm' || decision.beckn.stage === 'complete') {
      messages.push({
        id: `${transactionId}-confirm`,
        timestamp: new Date(time.getTime()),
        type: 'confirm',
        from: 'compute-agent',
        to: 'grid-agent',
        data: {
          context: {
            domain: 'beckn.one:DEG:compute-energy:1.0',
            action: 'confirm',
            transaction_id: transactionId,
          }
        }
      });

      messages.push({
        id: `${transactionId}-on_confirm`,
        timestamp: new Date(time.getTime() + 500),
        type: 'on_confirm',
        from: 'grid-agent',
        to: 'compute-agent',
        data: {
          context: {
            domain: 'beckn.one:DEG:compute-energy:1.0',
            action: 'on_confirm',
            transaction_id: transactionId,
          }
        }
      });
    }

    return messages;
  };

  const resetSimulation = () => {
    setIsRunning(false);
    const resetTime = new Date();
    setSimulationTime(resetTime);
    const initialWorkloads = Array.from({ length: 5 }, (_, i) => generateMockWorkload(i, resetTime));
    setWorkloads(initialWorkloads);
    setDatacenters(generateMockDatacenters());
    setDecisions([]);
    setBecknMessages([]);
    setMetrics({
      totalWorkloads: 0,
      activeWorkloads: 0,
      deferredWorkloads: 0,
      completedWorkloads: 0,
      totalCostSaved: 0,
      totalCarbonReduced: 0,
      flexibilityRevenue: 0,
      currentPowerDraw: 0,
      averageCostPerInference: 0,
    });
    setGridSignal(generateMockGridSignal());
    toast({
      title: "Simulation Reset",
      description: "All data cleared and simulation ready to restart",
    });
  };

  const callFlaskApi = async () => {
    if (!flaskUrl) {
      toast({
        title: "Flask URL Required",
        description: "Please enter your Flask API URL",
        variant: "destructive",
      });
      return;
    }

    setIsCallingFlask(true);
    try {
      const { data, error } = await supabase.functions.invoke('call-flask-api', {
        body: { flaskUrl }
      });

      if (error) throw error;

      // Add Flask output to Beckn messages
      const outputLines = Array.isArray(data.data.output) 
        ? data.data.output 
        : [JSON.stringify(data.data)];

      const newMessages: BecknMessage[] = outputLines.map((line: string, index: number) => ({
        id: `flask-${Date.now()}-${index}`,
        timestamp: new Date(),
        type: 'status' as const,
        from: 'compute-agent' as const,
        to: 'grid-agent' as const,
        data: {
          context: {
            domain: 'flask-api',
            action: 'output',
            transaction_id: `flask-${Date.now()}`
          },
          output: line
        }
      }));

      setBecknMessages((prev) => [...newMessages, ...prev]);

      toast({
        title: "Flask API Called",
        description: `Received ${outputLines.length} output lines`,
      });
    } catch (error) {
      console.error('Error calling Flask API:', error);
      toast({
        title: "Error",
        description: "Failed to call Flask API",
        variant: "destructive",
      });
    } finally {
      setIsCallingFlask(false);
    }
  };

  const clearBecknLogs = () => {
    setBecknMessages([]);
    toast({
      title: "Logs Cleared",
      description: "Beckn protocol logs have been cleared",
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between -my-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img src={flexlonLogo} alt="FlexLon Logo" className="h-32 w-auto" />
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  <span style={{ color: "#088ca4" }}>Orchestration</span>
                </h1>
                <p style={{ color: "#088ca4" }}>The flex point between compute and energy</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Button onClick={resetSimulation} size="lg" variant="outline" className="gap-2">
              <Activity className="w-5 h-5" />
              Restart
            </Button>
            <Button onClick={toggleSimulation} size="lg" className="gap-2">
              <Settings className="w-5 h-5" />
              {isRunning ? "Pause Simulation" : "Start Simulation"}
            </Button>
          </div>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <MetricsCard
            title="Total Saved"
            value={`£${metrics.totalCostSaved.toFixed(0)}`}
            subtitle="Cost optimization"
            icon={DollarSign}
            trend="up"
          />
          <MetricsCard
            title="Carbon Reduced"
            value={`${metrics.totalCarbonReduced.toFixed(1)} kg`}
            subtitle="CO2 emissions"
            icon={Cloud}
            trend="up"
          />
          <MetricsCard
            title="P415 Revenue"
            value={`£${metrics.flexibilityRevenue.toFixed(0)}`}
            subtitle="Flexibility market"
            icon={TrendingUp}
            trend="up"
          />
          <MetricsCard
            title="Active Workloads"
            value={metrics.activeWorkloads}
            subtitle={`${metrics.currentPowerDraw.toFixed(0)} kW draw`}
            icon={Activity}
          />
          <MetricsCard
            title="Avg Cost/Inference"
            value={`£${metrics.averageCostPerInference.toFixed(2)}`}
            subtitle="Optimized pricing"
            icon={Zap}
            trend="down"
          />
        </div>

        {/* Optimal Workload Schedule */}
        <div className="grid grid-cols-1">
          <DecisionLog decisions={decisions} simulationTime={simulationTime} />
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Grid Status, Datacenter */}
          <div className="lg:col-span-1 space-y-6">
            <GridStatus signal={gridSignal} simulationTime={simulationTime} />
            <DatacenterStatus datacenters={datacenters} />
          </div>
          
          {/* Right Column - Workloads */}
          <div className="lg:col-span-1">
            <WorkloadList
              workloads={workloads.slice(-10)}
              simulationTime={simulationTime}
              className="h-full"
            />
          </div>
        </div>

        {/* Beckn Protocol Logs */}
        <div className="grid grid-cols-1">
          <BecknLog 
            messages={becknMessages}
            flaskUrl={flaskUrl}
            setFlaskUrl={setFlaskUrl}
            isCallingFlask={isCallingFlask}
            onCallFlaskApi={callFlaskApi}
            onClearLogs={clearBecknLogs}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;

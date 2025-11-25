export interface ComputeWorkload {
  id: string;
  name: string;
  type: 'ai-training' | 'inference' | 'batch-processing';
  powerRequirement: number; // kW
  duration: number; // minutes
  flexibility: number; // hours window for deferral
  priority: 'high' | 'medium' | 'low';
  status: 'queued' | 'running' | 'deferred' | 'completed';
  createdTime: Date;
  scheduledTime?: Date;
  completedTime?: Date;
}

export interface GridSignal {
  timestamp: Date;
  price: number; // £/MWh
  carbonIntensity: number; // gCO2/kWh
  renewableMix: number; // percentage
  gridLoad: number; // percentage of capacity
  forecast: {
    nextHour: { price: number; carbon: number };
    next4Hours: { price: number; carbon: number };
  };
}

export interface OrchestrationDecision {
  id: string;
  timestamp: Date;
  workloadId: string;
  action: 'defer' | 'execute' | 'reroute' | 'battery-activation';
  reason: string;
  expectedSavings: {
    cost: number;
    carbon: number;
  };
  beckn: {
    stage: 'discover' | 'select' | 'init' | 'confirm' | 'status' | 'complete';
    payload?: any;
  };
}

export interface Datacenter {
  id: string;
  name: string;
  region: string;
  capacityKW: number;
  currentLoadKW: number;
  batteryCapacityKWh: number;
  batteryLevelPercent: number;
}

export interface SystemMetrics {
  totalWorkloads: number;
  activeWorkloads: number;
  deferredWorkloads: number;
  completedWorkloads: number;
  totalCostSaved: number;
  totalCarbonReduced: number; // kg CO2
  flexibilityRevenue: number; // P415 revenue
  currentPowerDraw: number; // kW
  averageCostPerInference: number; // £
}

export interface BecknMessage {
  id: string;
  timestamp: Date;
  type: 'search' | 'select' | 'init' | 'confirm' | 'status' | 'on_search' | 'on_select' | 'on_init' | 'on_confirm' | 'on_status';
  from: 'compute-agent' | 'grid-agent';
  to: 'compute-agent' | 'grid-agent';
  data: any;
}

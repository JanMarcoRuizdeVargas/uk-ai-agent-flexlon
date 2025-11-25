import { ComputeWorkload, GridSignal, OrchestrationDecision, SystemMetrics } from '@/types/orchestration';

const CARBON_CAP = 200; // gCO2/kWh
const TARGET_COST_THRESHOLD = 100; // £/MWh
const FLEXIBILITY_PAYMENT = 25; // £/MWh for P415 participation

export class OrchestrationEngine {
  private decisions: OrchestrationDecision[] = [];
  
  evaluateWorkload(
    workload: ComputeWorkload,
    gridSignal: GridSignal,
    currentTime?: Date
  ): OrchestrationDecision {
    const timestamp = currentTime || new Date();
    const carbonIntensity = gridSignal.carbonIntensity;
    const price = gridSignal.price;
    
    let action: OrchestrationDecision['action'] = 'execute';
    let reason = '';
    let costSavings = 0;
    let carbonReduction = 0;
    let becknStage: OrchestrationDecision['beckn']['stage'] = 'discover';
    
    // Random chance to use battery or reroute for geographic flexibility
    const randomChoice = Math.random();
    
    // Decision logic based on carbon cap and cost optimization
    if (carbonIntensity > CARBON_CAP && workload.flexibility > 0) {
      // Sometimes reroute to different region instead of defer
      if (randomChoice > 0.7) {
        action = 'reroute';
        reason = `Carbon intensity (${carbonIntensity.toFixed(0)} gCO2/kWh) exceeds cap. Rerouting to lower-carbon region.`;
      } else {
        action = 'defer';
        reason = `Carbon intensity (${carbonIntensity.toFixed(0)} gCO2/kWh) exceeds cap of ${CARBON_CAP} gCO2/kWh. Deferring until cleaner energy available.`;
      }
      
      // Calculate potential savings
      const currentCarbonCost = (workload.powerRequirement * carbonIntensity * workload.duration) / 60;
      const forecastCarbon = gridSignal.forecast.next4Hours.carbon;
      carbonReduction = currentCarbonCost - (workload.powerRequirement * forecastCarbon * workload.duration) / 60;
      
      costSavings = (price - gridSignal.forecast.next4Hours.price) * 
                    (workload.powerRequirement * workload.duration) / (60 * 1000);
      
      // Add flexibility revenue
      costSavings += FLEXIBILITY_PAYMENT * (workload.powerRequirement * workload.duration) / (60 * 1000);
      
      becknStage = 'select';
    } else if (price > TARGET_COST_THRESHOLD && workload.flexibility > 0 && workload.priority !== 'high') {
      // Sometimes use battery instead of defer
      if (randomChoice > 0.65) {
        action = 'battery-activation';
        reason = `High energy price (£${price.toFixed(2)}/MWh). Activating battery storage to offset grid demand.`;
      } else {
        action = 'defer';
        reason = `Energy price (£${price.toFixed(2)}/MWh) above target threshold. Deferring to optimize cost.`;
      }
      
      costSavings = (price - gridSignal.forecast.next4Hours.price) * 
                    (workload.powerRequirement * workload.duration) / (60 * 1000);
      
      costSavings += FLEXIBILITY_PAYMENT * (workload.powerRequirement * workload.duration) / (60 * 1000);
      
      becknStage = 'select';
    } else if (carbonIntensity < 100 && gridSignal.renewableMix > 60) {
      action = 'execute';
      reason = `Optimal conditions: Low carbon (${carbonIntensity.toFixed(0)} gCO2/kWh), high renewables (${gridSignal.renewableMix.toFixed(0)}%). Executing immediately.`;
      becknStage = 'confirm';
    } else {
      action = 'execute';
      reason = `Standard execution: Carbon within limits, acceptable price (£${price.toFixed(2)}/MWh).`;
      becknStage = 'confirm';
    }
    
    const decision: OrchestrationDecision = {
      id: `dec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      workloadId: workload.id,
      action,
      reason,
      expectedSavings: {
        cost: Math.max(0, costSavings),
        carbon: Math.max(0, carbonReduction / 1000), // Convert to kg
      },
      beckn: {
        stage: becknStage,
        payload: {
          workload_id: workload.id,
          power_requirement: workload.powerRequirement,
          duration: workload.duration,
          flexibility_window: workload.flexibility,
        },
      },
    };
    
    this.decisions.push(decision);
    return decision;
  }
  
  calculateMetrics(workloads: ComputeWorkload[]): SystemMetrics {
    const totalWorkloads = workloads.length;
    const activeWorkloads = workloads.filter(w => w.status === 'running').length;
    const deferredWorkloads = workloads.filter(w => w.status === 'deferred').length;
    const completedWorkloads = workloads.filter(w => w.status === 'completed').length;
    
    const totalCostSaved = this.decisions.reduce((sum, d) => sum + d.expectedSavings.cost, 0);
    const totalCarbonReduced = this.decisions.reduce((sum, d) => sum + d.expectedSavings.carbon, 0);
    
    const flexibilityRevenue = deferredWorkloads * FLEXIBILITY_PAYMENT * 0.5; // Simplified calculation
    
    const currentPowerDraw = workloads
      .filter(w => w.status === 'running')
      .reduce((sum, w) => sum + w.powerRequirement, 0);
    
    const averageCostPerInference = totalCostSaved > 0 
      ? (100 - (totalCostSaved / (totalWorkloads * 10))) 
      : 100; // Simplified
    
    return {
      totalWorkloads,
      activeWorkloads,
      deferredWorkloads,
      completedWorkloads,
      totalCostSaved,
      totalCarbonReduced,
      flexibilityRevenue,
      currentPowerDraw,
      averageCostPerInference,
    };
  }
  
  getRecentDecisions(limit: number = 10): OrchestrationDecision[] {
    return this.decisions.slice(-limit).reverse();
  }
}

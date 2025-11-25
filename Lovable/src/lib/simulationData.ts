import { ComputeWorkload, GridSignal } from '@/types/orchestration';

const WORKLOAD_NAMES = [
  'GPT-4 Training Batch',
  'Image Recognition Model',
  'Video Transcoding Job',
  'Database Backup Process',
  'ML Inference Cluster',
  'Data Analytics Pipeline',
  'Neural Network Training',
  'Recommendation Engine',
  'Natural Language Processing',
  'Computer Vision Model',
];

export function generateMockWorkload(index: number, currentTime: Date = new Date()): ComputeWorkload {
  const types: ComputeWorkload['type'][] = ['ai-training', 'inference', 'batch-processing'];
  const priorities: ComputeWorkload['priority'][] = ['high', 'medium', 'low'];
  
  return {
    id: `wl_${Date.now()}_${index}`,
    name: WORKLOAD_NAMES[index % WORKLOAD_NAMES.length] + ` #${Math.floor(index / WORKLOAD_NAMES.length) + 1}`,
    type: types[Math.floor(Math.random() * types.length)],
    powerRequirement: Math.floor(Math.random() * 500) + 100, // 100-600 kW
    duration: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
    flexibility: Math.random() > 0.3 ? Math.floor(Math.random() * 8) + 1 : 0, // 0-8 hours, 70% have flexibility
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status: 'queued',
    createdTime: new Date(currentTime),
  };
}

export function generateMockGridSignal(): GridSignal {
  const hour = new Date().getHours();
  
  // Simulate time-of-day pricing and carbon patterns
  const isOffPeak = hour < 7 || hour > 22;
  const isPeakRenewable = hour >= 11 && hour <= 16; // Solar peak
  
  const basePrice = isOffPeak ? 60 : 120;
  const priceVariation = Math.random() * 40 - 20;
  const price = Math.max(40, basePrice + priceVariation);
  
  const baseCarbonIntensity = isPeakRenewable ? 120 : 220;
  const carbonVariation = Math.random() * 60 - 30;
  const carbonIntensity = Math.max(80, baseCarbonIntensity + carbonVariation);
  
  const renewableMix = isPeakRenewable 
    ? Math.random() * 20 + 60 // 60-80%
    : Math.random() * 30 + 30; // 30-60%
  
  const gridLoad = Math.random() * 30 + 50; // 50-80%
  
  return {
    timestamp: new Date(),
    price,
    carbonIntensity,
    renewableMix,
    gridLoad,
    forecast: {
      nextHour: {
        price: price + (Math.random() * 20 - 10),
        carbon: carbonIntensity + (Math.random() * 20 - 10),
      },
      next4Hours: {
        price: price - (Math.random() * 30), // Generally cheaper in forecast
        carbon: carbonIntensity - (Math.random() * 40), // Generally cleaner
      },
    },
  };
}

export function getCarbonIntensityLevel(carbon: number): 'low' | 'medium' | 'high' {
  if (carbon < 150) return 'low';
  if (carbon < 250) return 'medium';
  return 'high';
}

export function getPriceLevel(price: number): 'low' | 'medium' | 'high' {
  if (price < 80) return 'low';
  if (price < 120) return 'medium';
  return 'high';
}

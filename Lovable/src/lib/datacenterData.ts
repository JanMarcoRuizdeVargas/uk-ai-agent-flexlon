import { Datacenter } from '@/types/orchestration';

export function generateMockDatacenters(): Datacenter[] {
  return [
    {
      id: 'dc-uk-1',
      name: 'London DC-1',
      region: 'UK South',
      capacityKW: 5000,
      currentLoadKW: 3200 + Math.random() * 500,
      batteryCapacityKWh: 2000,
      batteryLevelPercent: 65 + Math.random() * 20,
    },
    {
      id: 'dc-scot-1',
      name: 'Edinburgh DC-1',
      region: 'Scotland',
      capacityKW: 3500,
      currentLoadKW: 1800 + Math.random() * 400,
      batteryCapacityKWh: 1500,
      batteryLevelPercent: 45 + Math.random() * 25,
    },
    {
      id: 'dc-ire-1',
      name: 'Dublin DC-1',
      region: 'Ireland',
      capacityKW: 4000,
      currentLoadKW: 2500 + Math.random() * 600,
      batteryCapacityKWh: 1800,
      batteryLevelPercent: 70 + Math.random() * 15,
    },
  ];
}

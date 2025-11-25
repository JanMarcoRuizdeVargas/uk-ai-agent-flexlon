import { Card } from '@/components/ui/card';
import { GridSignal } from '@/types/orchestration';
import { getCarbonIntensityLevel, getPriceLevel } from '@/lib/simulationData';
import { Zap, Cloud, TrendingUp, Wind, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface GridStatusProps {
  signal: GridSignal;
  simulationTime: Date;
}

export function GridStatus({ signal, simulationTime }: GridStatusProps) {
  const carbonLevel = getCarbonIntensityLevel(signal.carbonIntensity);
  const priceLevel = getPriceLevel(signal.price);
  
  // Generate smooth, time-based forecast data that appears to scroll from right to left
  const generateForecast = (baseValue: number, variance: number, offset: number) => {
    // Use simulation time as seed for stable, slowly evolving data
    const timeSeed = Math.floor(simulationTime.getTime() / 30000); // Changes every 30 seconds of simulation time
    
    return Array.from({ length: 6 }, (_, i) => {
      // Create a sine wave pattern that slowly shifts over time
      const phase = (timeSeed / 10) + (i / 3) + offset;
      const wave = Math.sin(phase) * 0.5 + Math.sin(phase * 2) * 0.3;
      const value = baseValue + wave * variance;
      
      return {
        hour: i + 1,
        value: Math.max(0, value)
      };
    });
  };
  
  const priceForecast = generateForecast(signal.price, 15, 0);
  const carbonForecast = generateForecast(signal.carbonIntensity, 30, 1);
  const renewableForecast = generateForecast(signal.renewableMix, 20, 2);
  const loadForecast = generateForecast(signal.gridLoad, 18, 3);
  
  const carbonColor = {
    low: 'text-carbon-low',
    medium: 'text-carbon-medium',
    high: 'text-carbon-high',
  }[carbonLevel];
  
  const priceColor = {
    low: 'text-energy-low',
    medium: 'text-energy-medium',
    high: 'text-energy-high',
  }[priceLevel];
  
  return (
    <Card className="p-6 bg-card border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Grid Status</h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-energy-low animate-pulse-glow"></div>
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Live</span>
        </div>
      </div>
      
      <div className="mb-6 p-3 bg-background/50 rounded-lg border border-border">
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-lg font-mono font-semibold text-foreground">
            {simulationTime.toLocaleString('en-GB', { 
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit', 
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Energy Price</span>
          </div>
          <p className={`text-2xl font-bold ${priceColor}`}>
            £{signal.price.toFixed(2)}
          </p>
          <p className="text-xs text-muted-foreground">/MWh</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Carbon Intensity</span>
          </div>
          <p className={`text-2xl font-bold ${carbonColor}`}>
            {signal.carbonIntensity.toFixed(0)}
          </p>
          <p className="text-xs text-muted-foreground">gCO2/kWh</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Renewable Mix</span>
          </div>
          <p className="text-2xl font-bold text-energy-low">
            {signal.renewableMix.toFixed(1)}%
          </p>
          <Progress value={signal.renewableMix} className="h-1" />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Grid Load</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {signal.gridLoad.toFixed(1)}%
          </p>
          <Progress value={signal.gridLoad} className="h-1" />
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-4">6-Hour Forecast</p>
        <div className="grid grid-cols-2 gap-4">
          {/* Energy Price Chart */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3 h-3 text-primary" />
              <p className="text-xs text-muted-foreground">Energy Price</p>
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={priceForecast}>
                <YAxis domain={['auto', 'auto']} hide />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#088ca4" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground">
              £{Math.min(...priceForecast.map(f => f.value)).toFixed(1)} - £{Math.max(...priceForecast.map(f => f.value)).toFixed(1)} /MWh
            </p>
          </div>

          {/* Carbon Intensity Chart */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cloud className="w-3 h-3 text-primary" />
              <p className="text-xs text-muted-foreground">Carbon Intensity</p>
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={carbonForecast}>
                <YAxis domain={['auto', 'auto']} hide />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#088ca4" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground">
              {Math.min(...carbonForecast.map(f => f.value)).toFixed(0)} - {Math.max(...carbonForecast.map(f => f.value)).toFixed(0)} gCO2/kWh
            </p>
          </div>

          {/* Renewable Mix Chart */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wind className="w-3 h-3 text-primary" />
              <p className="text-xs text-muted-foreground">Renewable Mix</p>
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={renewableForecast}>
                <YAxis domain={[0, 100]} hide />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#088ca4" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground">
              {Math.min(...renewableForecast.map(f => f.value)).toFixed(1)}% - {Math.max(...renewableForecast.map(f => f.value)).toFixed(1)}%
            </p>
          </div>

          {/* Grid Load Chart */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3 h-3 text-primary" />
              <p className="text-xs text-muted-foreground">Grid Load</p>
            </div>
            <ResponsiveContainer width="100%" height={60}>
              <LineChart data={loadForecast}>
                <YAxis domain={[0, 100]} hide />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#088ca4" 
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={500}
                  animationEasing="ease-in-out"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground">
              {Math.min(...loadForecast.map(f => f.value)).toFixed(1)}% - {Math.max(...loadForecast.map(f => f.value)).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

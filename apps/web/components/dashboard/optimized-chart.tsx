'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useChartOptimization } from '../../hooks/use-chart-optimization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { Switch } from '@repo/ui/components/ui/switch';
import { Label } from '@repo/ui/components/ui/label';
import { TrendingUp, Zap, Settings, Info } from 'lucide-react';

interface OptimizedChartProps {
  data: any[];
  title: string;
  description?: string;
  type?: 'line' | 'bar' | 'pie';
  xKey: string;
  yKey: string;
  className?: string;
  height?: number;
  enableOptimization?: boolean;
  maxDataPoints?: number;
  onDataUpdate?: (message: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function OptimizedChart({
  data,
  title,
  description,
  type = 'line',
  xKey,
  yKey,
  className,
  height = 300,
  enableOptimization = true,
  maxDataPoints = 500,
  onDataUpdate
}: OptimizedChartProps) {
  const [chartType, setChartType] = useState(type);
  const [showOptimizationInfo, setShowOptimizationInfo] = useState(false);
  const [aggregationLevel, setAggregationLevel] = useState<'none' | 'hour' | 'day' | 'week' | 'month'>('none');
  const [enableAnimations, setEnableAnimations] = useState(true);

  // Use chart optimization hook
  const {
    optimizedData,
    dataStats,
    performanceMetrics,
    trackRenderPerformance,
    getAggregatedData,
    isOptimized
  } = useChartOptimization(data, {
    maxDataPoints,
    enableVirtualization: true,
    debounceMs: 300
  });

  // Get final data based on aggregation level
  const finalData = useMemo(() => {
    if (aggregationLevel === 'none') {
      return optimizedData;
    }
    return getAggregatedData(aggregationLevel);
  }, [optimizedData, aggregationLevel, getAggregatedData]);

  // Performance tracking
  useEffect(() => {
    const endTracking = trackRenderPerformance();
    return endTracking;
  }, [finalData, trackRenderPerformance]);

  // Notify parent of data updates
  useEffect(() => {
    if (onDataUpdate && isOptimized) {
      onDataUpdate(`Chart optimized: ${dataStats.originalCount} → ${dataStats.optimizedCount} points`);
    }
  }, [isOptimized, dataStats, onDataUpdate]);

  // Custom tooltip with performance info
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{`${xKey}: ${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
            </p>
          ))}
          {payload[0]?.payload?.aggregatedCount && (
            <p className="text-xs text-muted-foreground">
              Aggregated from {payload[0].payload.aggregatedCount} points
            </p>
          )}
        </div>
      );
    }
    return null;
  }, [xKey]);

  // Render different chart types
  const renderChart = () => {
    const commonProps = {
      data: finalData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={xKey} 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={yKey} 
              fill="#0088FE" 
              radius={[2, 2, 0, 0]}
              animationDuration={enableAnimations ? 300 : 0}
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={finalData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={yKey}
              animationDuration={enableAnimations ? 300 : 0}
            >
              {finalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        );

      default: // line
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey={xKey} 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => typeof value === 'number' ? value.toFixed(0) : value}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey={yKey} 
              stroke="#0088FE" 
              strokeWidth={2}
              dot={finalData.length <= 50}
              activeDot={{ r: 4, stroke: '#0088FE', strokeWidth: 2, fill: '#fff' }}
              animationDuration={enableAnimations ? 300 : 0}
            />
          </LineChart>
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {title}
              {isOptimized && (
                <Badge variant="secondary" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Optimized
                </Badge>
              )}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOptimizationInfo(!showOptimizationInfo)}
              aria-label="Toggle optimization information"
            >
              <Info className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowOptimizationInfo(!showOptimizationInfo)}
              aria-label="Chart settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chart Controls */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="chart-type" className="text-sm">Type:</Label>
            <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="aggregation" className="text-sm">Aggregate:</Label>
            <Select value={aggregationLevel} onValueChange={(value: any) => setAggregationLevel(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="hour">Hour</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="animations"
              checked={enableAnimations}
              onCheckedChange={setEnableAnimations}
            />
            <Label htmlFor="animations" className="text-sm">Animations</Label>
          </div>
        </div>

        {/* Optimization Info */}
        {showOptimizationInfo && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm">
            <h4 className="font-medium mb-2">Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Data Points</Label>
                <p className="font-medium">
                  {dataStats.optimizedCount.toLocaleString()}
                  {dataStats.originalCount !== dataStats.optimizedCount && (
                    <span className="text-muted-foreground">
                      /{dataStats.originalCount.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Reduction</Label>
                <p className="font-medium">
                  {(dataStats.reductionRatio * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Render Time</Label>
                <p className="font-medium">
                  {performanceMetrics.lastRenderTime.toFixed(1)}ms
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Memory Est.</Label>
                <p className="font-medium">
                  {(dataStats.memoryEstimate / 1024).toFixed(1)}KB
                </p>
              </div>
            </div>
            
            {dataStats.isDecimated && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-3 w-3" />
                Data has been optimized using LTTB algorithm for better performance
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div 
          style={{ height }}
          role="img"
          aria-label={`${title} chart showing ${finalData.length} data points`}
        >
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>

        {/* Accessibility information */}
        <div className="sr-only">
          <h3>Chart Data Summary</h3>
          <p>
            {title} contains {finalData.length} data points. 
            {isOptimized && ` Data has been optimized from ${dataStats.originalCount} original points.`}
            The chart shows values ranging from {Math.min(...finalData.map(d => d[yKey]))} to {Math.max(...finalData.map(d => d[yKey]))}.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

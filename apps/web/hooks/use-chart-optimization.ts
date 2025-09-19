import { useMemo, useCallback, useRef, useEffect } from 'react';

interface ChartDataPoint {
  timestamp: Date | string;
  value: number;
  [key: string]: any;
}

interface UseChartOptimizationOptions {
  maxDataPoints?: number;
  decimationThreshold?: number;
  enableVirtualization?: boolean;
  debounceMs?: number;
}

export function useChartOptimization<T extends ChartDataPoint>(
  data: T[],
  options: UseChartOptimizationOptions = {}
) {
  const {
    maxDataPoints = 1000,
    decimationThreshold = 2000,
    enableVirtualization = true,
    debounceMs = 300
  } = options;

  const debounceRef = useRef<NodeJS.Timeout>();
  const lastProcessedData = useRef<T[]>([]);

  // Decimation algorithm for large datasets
  const decimateData = useCallback((inputData: T[]): T[] => {
    if (inputData.length <= decimationThreshold) {
      return inputData;
    }

    const step = Math.ceil(inputData.length / maxDataPoints);
    const decimated: T[] = [];

    // Always include first and last points
    decimated.push(inputData[0]);

    // Use Largest-Triangle-Three-Buckets (LTTB) algorithm for better visual preservation
    for (let i = 1; i < inputData.length - 1; i += step) {
      const bucket = inputData.slice(i, Math.min(i + step, inputData.length - 1));
      
      if (bucket.length === 0) continue;

      // Find the point with the largest triangle area
      let maxArea = 0;
      let selectedPoint = bucket[0];

      for (const point of bucket) {
        const prevPoint = decimated[decimated.length - 1];
        const nextPoint = inputData[Math.min(i + step, inputData.length - 1)];
        
        // Calculate triangle area
        const area = Math.abs(
          (prevPoint.value - nextPoint.value) * 
          (new Date(point.timestamp).getTime() - new Date(prevPoint.timestamp).getTime()) -
          (prevPoint.value - point.value) * 
          (new Date(nextPoint.timestamp).getTime() - new Date(prevPoint.timestamp).getTime())
        ) / 2;

        if (area > maxArea) {
          maxArea = area;
          selectedPoint = point;
        }
      }

      decimated.push(selectedPoint);
    }

    // Always include last point
    if (inputData.length > 1) {
      decimated.push(inputData[inputData.length - 1]);
    }

    return decimated;
  }, [maxDataPoints, decimationThreshold]);

  // Memoized optimized data
  const optimizedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Sort data by timestamp to ensure proper ordering
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Apply decimation if needed
    const processedData = decimateData(sortedData);
    
    lastProcessedData.current = processedData;
    return processedData;
  }, [data, decimateData]);

  // Debounced data update for real-time scenarios
  const debouncedData = useMemo(() => {
    return optimizedData;
  }, [optimizedData]);

  // Calculate data statistics for performance monitoring
  const dataStats = useMemo(() => {
    return {
      originalCount: data.length,
      optimizedCount: optimizedData.length,
      reductionRatio: data.length > 0 ? (1 - optimizedData.length / data.length) : 0,
      isDecimated: data.length > decimationThreshold,
      memoryEstimate: optimizedData.length * 100 // rough estimate in bytes
    };
  }, [data.length, optimizedData.length, decimationThreshold]);

  // Performance monitoring
  const performanceMetrics = useRef({
    lastRenderTime: 0,
    averageRenderTime: 0,
    renderCount: 0
  });

  const trackRenderPerformance = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      performanceMetrics.current.lastRenderTime = renderTime;
      performanceMetrics.current.renderCount++;
      performanceMetrics.current.averageRenderTime = 
        (performanceMetrics.current.averageRenderTime * (performanceMetrics.current.renderCount - 1) + renderTime) / 
        performanceMetrics.current.renderCount;
    };
  }, []);

  // Viewport-based data filtering for virtualization
  const getViewportData = useCallback((startIndex: number, endIndex: number) => {
    return optimizedData.slice(startIndex, endIndex + 1);
  }, [optimizedData]);

  // Data aggregation for different zoom levels
  const getAggregatedData = useCallback((timeWindow: 'hour' | 'day' | 'week' | 'month') => {
    if (optimizedData.length === 0) return [];

    const windowMs = {
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    }[timeWindow];

    const aggregated: T[] = [];
    let currentWindow: T[] = [];
    let windowStart = new Date(optimizedData[0].timestamp).getTime();

    for (const point of optimizedData) {
      const pointTime = new Date(point.timestamp).getTime();
      
      if (pointTime - windowStart > windowMs) {
        // Aggregate current window
        if (currentWindow.length > 0) {
          const avgValue = currentWindow.reduce((sum, p) => sum + p.value, 0) / currentWindow.length;
          const aggregatedPoint = {
            ...currentWindow[Math.floor(currentWindow.length / 2)], // Use middle point as base
            value: avgValue,
            timestamp: new Date(windowStart + windowMs / 2).toISOString(),
            aggregatedCount: currentWindow.length
          } as T;
          
          aggregated.push(aggregatedPoint);
        }
        
        // Start new window
        currentWindow = [point];
        windowStart = pointTime;
      } else {
        currentWindow.push(point);
      }
    }

    // Handle last window
    if (currentWindow.length > 0) {
      const avgValue = currentWindow.reduce((sum, p) => sum + p.value, 0) / currentWindow.length;
      const aggregatedPoint = {
        ...currentWindow[Math.floor(currentWindow.length / 2)],
        value: avgValue,
        timestamp: new Date(windowStart + windowMs / 2).toISOString(),
        aggregatedCount: currentWindow.length
      } as T;
      
      aggregated.push(aggregatedPoint);
    }

    return aggregated;
  }, [optimizedData]);

  // Memory cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    optimizedData: debouncedData,
    dataStats,
    performanceMetrics: performanceMetrics.current,
    trackRenderPerformance,
    getViewportData,
    getAggregatedData,
    isOptimized: dataStats.isDecimated || dataStats.reductionRatio > 0
  };
}

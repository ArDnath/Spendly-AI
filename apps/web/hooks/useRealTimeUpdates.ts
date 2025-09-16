"use client";

import { useEffect, useRef, useState } from 'react';
import { useDashboardStore } from '../stores/dashboard-store';
import { useApi } from './useApi';

interface UseRealTimeUpdatesOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  onError?: (error: string) => void;
}

export function useRealTimeUpdates({
  interval = 30000, // 30 seconds default
  enabled = true,
  onError
}: UseRealTimeUpdatesOptions = {}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { 
    setApiKeys, 
    setUsageSummary, 
    setUser,
    setAlerts 
  } = useDashboardStore();
  
  const { 
    fetchApiKeys, 
    fetchUsageSummary, 
    fetchUserProfile,
    fetchUsageAnalytics 
  } = useApi();

  const updateData = async () => {
    if (!enabled) return;
    
    setIsUpdating(true);
    try {
      const [keysData, summaryData, userData] = await Promise.all([
        fetchApiKeys(),
        fetchUsageSummary(),
        fetchUserProfile()
      ]);

      if (keysData.success && keysData.data) {
        setApiKeys(keysData.data);
      }
      
      if (summaryData.success && summaryData.data) {
        setUsageSummary(summaryData.data);
      }
      
      if (userData.success && userData.data) {
        setUser(userData.data);
      }
    } catch (error) {
      console.error('Real-time update failed:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Update failed');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const startUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(updateData, interval);
  };

  const stopUpdates = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const forceUpdate = () => {
    updateData();
  };

  useEffect(() => {
    if (enabled) {
      startUpdates();
    } else {
      stopUpdates();
    }

    return () => {
      stopUpdates();
    };
  }, [enabled, interval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUpdates();
    };
  }, []);

  return {
    isUpdating,
    startUpdates,
    stopUpdates,
    forceUpdate
  };
}

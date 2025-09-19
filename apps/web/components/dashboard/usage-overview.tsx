'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Progress } from '@repo/ui/components/ui/progress';
import { Badge } from '@repo/ui/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Zap, Clock, AlertTriangle } from 'lucide-react';

interface UsageOverviewProps {
  className?: string;
  onDataUpdate?: (message: string) => void;
}

interface UsageData {
  currentMonth: {
    cost: number;
    tokens: number;
    requests: number;
  };
  projectedMonth: {
    cost: number;
    tokens: number;
    requests: number;
  };
  dailyAverage: {
    cost: number;
    tokens: number;
    requests: number;
  };
  budget?: {
    amount: number;
    used: number;
    percentage: number;
  };
  trend: 'up' | 'down' | 'stable';
  daysRemaining: number;
}

export function UsageOverview({ className }: UsageOverviewProps) {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/usage/summary');
      if (response.ok) {
        const usageData = await response.json();
        
        // Calculate additional metrics
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        const daysRemaining = daysInMonth - currentDay;
        
        // Determine trend
        const dailySpend = usageData.currentMonth.cost / currentDay;
        const projectedDaily = usageData.projectedMonth.cost / daysInMonth;
        const trend = projectedDaily > dailySpend * 1.1 ? 'up' : 
                     projectedDaily < dailySpend * 0.9 ? 'down' : 'stable';

        setData({
          ...usageData,
          trend,
          daysRemaining,
          budget: {
            amount: 100, // This would come from user's budget settings
            used: usageData.currentMonth.cost,
            percentage: (usageData.currentMonth.cost / 100) * 100
          }
        });
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 w-4 bg-muted rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16 mb-2"></div>
              <div className="h-3 bg-muted rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Failed to load usage data</p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatNumber = (num: number) => num.toLocaleString();

  const getBudgetStatus = () => {
    if (!data.budget) return 'default';
    if (data.budget.percentage >= 90) return 'destructive';
    if (data.budget.percentage >= 75) return 'secondary';
    return 'default';
  };

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <TrendingUp className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Current Month Spend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.currentMonth.cost)}</div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(data.currentMonth.requests)} requests
          </p>
          {data.budget && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Budget Usage</span>
                <span>{data.budget.percentage.toFixed(0)}%</span>
              </div>
              <Progress 
                value={data.budget.percentage} 
                className="h-1"
                indicatorClassName={
                  data.budget.percentage >= 90 ? 'bg-red-500' :
                  data.budget.percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projected Spend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Month</CardTitle>
          {getTrendIcon()}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.projectedMonth.cost)}</div>
          <p className="text-xs text-muted-foreground">
            Based on current usage
          </p>
          <div className="mt-2">
            <Badge variant={getBudgetStatus()} className="text-xs">
              {data.budget && data.projectedMonth.cost > data.budget.amount ? (
                <>
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Over Budget
                </>
              ) : (
                'On Track'
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Daily Average */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(data.dailyAverage.cost)}</div>
          <p className="text-xs text-muted-foreground">
            {formatNumber(data.dailyAverage.tokens)} tokens/day
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {formatNumber(data.dailyAverage.requests)} requests/day
          </p>
        </CardContent>
      </Card>

      {/* Days Remaining */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.daysRemaining}</div>
          <p className="text-xs text-muted-foreground">
            Until month end
          </p>
          {data.budget && (
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency((data.budget.amount - data.budget.used) / data.daysRemaining)} 
              /day remaining
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

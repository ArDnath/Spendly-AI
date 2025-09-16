"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign,
  Calendar,
  BarChart3
} from "lucide-react";

interface UsageData {
  date: string;
  tokens: number;
  cost: number;
  requests: number;
}

interface ProviderUsage {
  provider: string;
  percentage: number;
  cost: number;
  color: string;
}

interface UsageAnalyticsProps {
  usageData: UsageData[];
  providerBreakdown: ProviderUsage[];
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageCostPerRequest: number;
  costTrend: number; // percentage change
  tokenTrend: number; // percentage change
}

export function UsageAnalytics({
  usageData,
  providerBreakdown,
  totalRequests,
  totalTokens,
  totalCost,
  averageCostPerRequest,
  costTrend,
  tokenTrend
}: UsageAnalyticsProps) {
  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatTokens = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-red-600";
    if (trend < 0) return "text-green-600";
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Total Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Total Tokens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTokens(totalTokens)}</div>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(tokenTrend)}
                <span className={`text-xs ${getTrendColor(tokenTrend)}`}>
                  {Math.abs(tokenTrend).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Cost
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon(costTrend)}
                <span className={`text-xs ${getTrendColor(costTrend)}`}>
                  {Math.abs(costTrend).toFixed(1)}% vs last month
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Avg Cost/Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(averageCostPerRequest)}</div>
              <p className="text-xs text-gray-500 mt-1">Per API call</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Usage Trends
              </CardTitle>
              <CardDescription>
                Daily token usage and cost over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis 
                      yAxisId="tokens"
                      orientation="left"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatTokens}
                    />
                    <YAxis 
                      yAxisId="cost"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      tickFormatter={formatCurrency}
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        name === 'tokens' ? formatTokens(value as number) : formatCurrency(value as number),
                        name === 'tokens' ? 'Tokens' : 'Cost'
                      ]}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Area
                      yAxisId="tokens"
                      type="monotone"
                      dataKey="tokens"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="cost"
                      type="monotone"
                      dataKey="cost"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Provider Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Provider Breakdown
              </CardTitle>
              <CardDescription>
                Cost distribution by AI provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="percentage"
                      >
                        {providerBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Usage']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-3">
                  {providerBreakdown.map((provider, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: provider.color }}
                        />
                        <span className="text-sm font-medium">{provider.provider}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{provider.percentage.toFixed(1)}%</div>
                        <div className="text-xs text-gray-500">{formatCurrency(provider.cost)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

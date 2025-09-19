'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Badge } from '@repo/ui/components/ui/badge';
import { Button } from '@repo/ui/components/ui/button';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Calendar, Filter, TrendingUp, Eye } from 'lucide-react';

interface CostBreakdownProps {
  className?: string;
}

interface CostData {
  daily: Array<{
    date: string;
    cost: number;
    tokens: number;
    requests: number;
  }>;
  byEndpoint: Array<{
    endpoint: string;
    cost: number;
    percentage: number;
    requests: number;
  }>;
  byModel: Array<{
    model: string;
    cost: number;
    percentage: number;
    tokens: number;
  }>;
  byProject: Array<{
    projectId: string;
    projectName: string;
    cost: number;
    percentage: number;
  }>;
  expensiveCalls: Array<{
    id: string;
    timestamp: string;
    model: string;
    cost: number;
    tokens: number;
    projectName?: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function CostBreakdownChart({ className }: CostBreakdownProps) {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');

  useEffect(() => {
    fetchCostData();
  }, [timeRange, selectedProject]);

  const fetchCostData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeRange,
        ...(selectedProject !== 'all' && { projectId: selectedProject })
      });
      
      const response = await fetch(`/api/usage/breakdown?${params}`);
      if (response.ok) {
        const costData = await response.json();
        setData(costData);
      }
    } catch (error) {
      console.error('Failed to fetch cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!data?.daily.length) return null;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={formatCurrency}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="cost" fill="#0088FE" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.byModel}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ model, percentage }) => `${model} (${percentage.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="cost"
              >
                {data.byModel.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.daily}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                className="text-xs"
              />
              <YAxis 
                tickFormatter={formatCurrency}
                className="text-xs"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="cost" 
                stroke="#0088FE" 
                strokeWidth={2}
                dot={{ fill: '#0088FE', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="h-6 bg-muted rounded w-32 mb-2"></div>
              <div className="h-4 bg-muted rounded w-48"></div>
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-muted rounded w-20"></div>
              <div className="h-8 bg-muted rounded w-20"></div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Usage Trends
              </CardTitle>
              <CardDescription>
                Daily spending and usage patterns
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pie">Pie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      {/* Breakdown Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Most Expensive Endpoints */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Endpoints</CardTitle>
            <CardDescription>Highest cost by endpoint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.byEndpoint.slice(0, 5).map((endpoint, index) => (
              <div key={endpoint.endpoint} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm font-medium truncate">
                    {endpoint.endpoint.replace('/v1/', '')}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(endpoint.cost)}</div>
                  <div className="text-xs text-muted-foreground">
                    {endpoint.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Models Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Models Used</CardTitle>
            <CardDescription>Cost by AI model</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.byModel.slice(0, 5).map((model, index) => (
              <div key={model.model} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm font-medium">{model.model}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(model.cost)}</div>
                  <div className="text-xs text-muted-foreground">
                    {model.tokens.toLocaleString()} tokens
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Expensive Calls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Expensive Calls
            </CardTitle>
            <CardDescription>Recent high-cost API calls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data?.expensiveCalls.slice(0, 5).map((call) => (
              <div key={call.id} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {call.model}
                  </Badge>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(call.cost)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{call.tokens.toLocaleString()} tokens</span>
                  <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                </div>
                {call.projectName && (
                  <div className="text-xs text-muted-foreground">
                    Project: {call.projectName}
                  </div>
                )}
              </div>
            ))}
            {data?.expensiveCalls.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No expensive calls found
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Badge } from '@repo/ui/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Bug, Search, ExternalLink, AlertTriangle, Clock, DollarSign, Zap, Filter, Download } from 'lucide-react';
import { useToast } from '@repo/ui/components/ui/use-toast';

interface DebuggingToolsProps {
  className?: string;
}

interface ExpensiveCall {
  id: string;
  timestamp: Date;
  apiKeyId: string;
  apiKeyName: string;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
  statusCode: number;
  projectId?: string;
  projectName?: string;
  requestId: string;
  userAgent?: string;
  ipAddress?: string;
}

interface ErrorLog {
  id: string;
  timestamp: Date;
  apiKeyId: string;
  apiKeyName: string;
  endpoint: string;
  errorType: string;
  errorMessage: string;
  statusCode: number;
  retryCount: number;
  projectId?: string;
  projectName?: string;
  requestId: string;
}

interface UsagePattern {
  endpoint: string;
  model: string;
  totalCalls: number;
  totalCost: number;
  avgCost: number;
  avgTokens: number;
  peakHour: string;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export function DebuggingTools({ className }: DebuggingToolsProps) {
  const [expensiveCalls, setExpensiveCalls] = useState<ExpensiveCall[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [usagePatterns, setUsagePatterns] = useState<UsagePattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<ExpensiveCall | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);
  const { toast } = useToast();

  // Filter state
  const [filters, setFilters] = useState({
    timeRange: '24h',
    minCost: '',
    endpoint: '',
    model: '',
    projectId: '',
    apiKeyId: ''
  });

  useEffect(() => {
    fetchDebuggingData();
  }, [filters]);

  const fetchDebuggingData = async () => {
    try {
      setLoading(true);
      
      // Fetch expensive calls
      const expensiveResponse = await fetch(`/api/debugging/expensive-calls?${new URLSearchParams({
        timeRange: filters.timeRange,
        ...(filters.minCost && { minCost: filters.minCost }),
        ...(filters.endpoint && { endpoint: filters.endpoint }),
        ...(filters.model && { model: filters.model }),
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.apiKeyId && { apiKeyId: filters.apiKeyId })
      })}`);
      
      if (expensiveResponse.ok) {
        const expensiveData = await expensiveResponse.json();
        setExpensiveCalls(expensiveData.calls);
      }

      // Fetch error logs
      const errorResponse = await fetch(`/api/debugging/errors?${new URLSearchParams({
        timeRange: filters.timeRange,
        ...(filters.endpoint && { endpoint: filters.endpoint }),
        ...(filters.projectId && { projectId: filters.projectId }),
        ...(filters.apiKeyId && { apiKeyId: filters.apiKeyId })
      })}`);
      
      if (errorResponse.ok) {
        const errorData = await errorResponse.json();
        setErrorLogs(errorData.errors);
      }

      // Fetch usage patterns
      const patternsResponse = await fetch(`/api/debugging/patterns?${new URLSearchParams({
        timeRange: filters.timeRange,
        ...(filters.projectId && { projectId: filters.projectId })
      })}`);
      
      if (patternsResponse.ok) {
        const patternsData = await patternsResponse.json();
        setUsagePatterns(patternsData.patterns);
      }

    } catch (error) {
      console.error('Failed to fetch debugging data:', error);
      toast({
        title: "Error",
        description: "Failed to load debugging data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async (type: 'expensive' | 'errors' | 'patterns') => {
    try {
      const response = await fetch(`/api/debugging/export?type=${type}&${new URLSearchParams(filters)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Data exported successfully"
        });
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(4)}`;
  const formatDuration = (ms: number) => `${ms}ms`;
  const formatTokens = (tokens: number) => tokens.toLocaleString();

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge variant="default">Success</Badge>;
    } else if (statusCode >= 400 && statusCode < 500) {
      return <Badge variant="destructive">Client Error</Badge>;
    } else if (statusCode >= 500) {
      return <Badge variant="destructive">Server Error</Badge>;
    }
    return <Badge variant="outline">{statusCode}</Badge>;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 mb-2"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Debugging Tools
            </CardTitle>
            <CardDescription>
              Track expensive calls, errors, and usage patterns
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4" />
            <Label className="font-medium">Filters</Label>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time-range">Time Range</Label>
              <Select value={filters.timeRange} onValueChange={(value) => setFilters({ ...filters, timeRange: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1h">Last Hour</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-cost">Min Cost ($)</Label>
              <Input
                id="min-cost"
                type="number"
                step="0.01"
                value={filters.minCost}
                onChange={(e) => setFilters({ ...filters, minCost: e.target.value })}
                placeholder="0.10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint</Label>
              <Input
                id="endpoint"
                value={filters.endpoint}
                onChange={(e) => setFilters({ ...filters, endpoint: e.target.value })}
                placeholder="chat/completions"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={filters.model}
                onChange={(e) => setFilters({ ...filters, model: e.target.value })}
                placeholder="gpt-4"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project ID</Label>
              <Input
                id="project"
                value={filters.projectId}
                onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                placeholder="proj_123"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key ID</Label>
              <Input
                id="api-key"
                value={filters.apiKeyId}
                onChange={(e) => setFilters({ ...filters, apiKeyId: e.target.value })}
                placeholder="key_123"
              />
            </div>
          </div>
        </div>

        <Tabs defaultValue="expensive" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="expensive">Expensive Calls</TabsTrigger>
            <TabsTrigger value="errors">Error Logs</TabsTrigger>
            <TabsTrigger value="patterns">Usage Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="expensive" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Most Expensive API Calls</h3>
              <Button variant="outline" onClick={() => handleExportData('expensive')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {expensiveCalls.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No expensive calls found</h3>
                <p className="text-muted-foreground">
                  No API calls above the cost threshold in the selected time range
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expensiveCalls.map((call) => (
                      <TableRow key={call.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(call.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{call.apiKeyName}</div>
                            {call.projectName && (
                              <div className="text-xs text-muted-foreground">{call.projectName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{call.endpoint}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{call.model}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatTokens(call.totalTokens)} total</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTokens(call.inputTokens)} in, {formatTokens(call.outputTokens)} out
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-red-600">{formatCurrency(call.cost)}</div>
                        </TableCell>
                        <TableCell>{formatDuration(call.duration)}</TableCell>
                        <TableCell>{getStatusBadge(call.statusCode)}</TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedCall(call)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>API Call Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about this API call
                                </DialogDescription>
                              </DialogHeader>
                              {selectedCall && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Request ID</Label>
                                      <code className="block text-xs bg-muted p-2 rounded mt-1">{selectedCall.requestId}</code>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Timestamp</Label>
                                      <p className="text-sm mt-1">{new Date(selectedCall.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">API Key</Label>
                                      <p className="text-sm mt-1">{selectedCall.apiKeyName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Project</Label>
                                      <p className="text-sm mt-1">{selectedCall.projectName || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Endpoint</Label>
                                      <code className="block text-xs bg-muted p-2 rounded mt-1">{selectedCall.endpoint}</code>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Model</Label>
                                      <p className="text-sm mt-1">{selectedCall.model}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Input Tokens</Label>
                                      <p className="text-sm mt-1">{formatTokens(selectedCall.inputTokens)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Output Tokens</Label>
                                      <p className="text-sm mt-1">{formatTokens(selectedCall.outputTokens)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Total Cost</Label>
                                      <p className="text-sm mt-1 font-medium text-red-600">{formatCurrency(selectedCall.cost)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Duration</Label>
                                      <p className="text-sm mt-1">{formatDuration(selectedCall.duration)}</p>
                                    </div>
                                  </div>
                                  {selectedCall.userAgent && (
                                    <div>
                                      <Label className="text-sm font-medium">User Agent</Label>
                                      <code className="block text-xs bg-muted p-2 rounded mt-1">{selectedCall.userAgent}</code>
                                    </div>
                                  )}
                                  {selectedCall.ipAddress && (
                                    <div>
                                      <Label className="text-sm font-medium">IP Address</Label>
                                      <p className="text-sm mt-1">{selectedCall.ipAddress}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Error Logs</h3>
              <Button variant="outline" onClick={() => handleExportData('errors')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {errorLogs.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No errors found</h3>
                <p className="text-muted-foreground">
                  No API errors in the selected time range
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Error Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Retries</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {errorLogs.map((error) => (
                      <TableRow key={error.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(error.timestamp).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{error.apiKeyName}</div>
                            {error.projectName && (
                              <div className="text-xs text-muted-foreground">{error.projectName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">{error.endpoint}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">{error.errorType}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(error.statusCode)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{error.retryCount}</Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedError(error)}>
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[600px]">
                              <DialogHeader>
                                <DialogTitle>Error Details</DialogTitle>
                                <DialogDescription>
                                  Detailed information about this error
                                </DialogDescription>
                              </DialogHeader>
                              {selectedError && (
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Request ID</Label>
                                      <code className="block text-xs bg-muted p-2 rounded mt-1">{selectedError.requestId}</code>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Timestamp</Label>
                                      <p className="text-sm mt-1">{new Date(selectedError.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">API Key</Label>
                                      <p className="text-sm mt-1">{selectedError.apiKeyName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Project</Label>
                                      <p className="text-sm mt-1">{selectedError.projectName || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Endpoint</Label>
                                      <code className="block text-xs bg-muted p-2 rounded mt-1">{selectedError.endpoint}</code>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Error Type</Label>
                                      <p className="text-sm mt-1">{selectedError.errorType}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Status Code</Label>
                                      <p className="text-sm mt-1">{selectedError.statusCode}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Retry Count</Label>
                                      <p className="text-sm mt-1">{selectedError.retryCount}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Error Message</Label>
                                    <code className="block text-xs bg-muted p-3 rounded mt-1 whitespace-pre-wrap">{selectedError.errorMessage}</code>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Usage Patterns</h3>
              <Button variant="outline" onClick={() => handleExportData('patterns')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>

            {usagePatterns.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No usage patterns found</h3>
                <p className="text-muted-foreground">
                  No usage data available for pattern analysis
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {usagePatterns.map((pattern, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getTrendIcon(pattern.trend)}</span>
                        <div>
                          <h4 className="font-medium">{pattern.endpoint}</h4>
                          <p className="text-sm text-muted-foreground">{pattern.model}</p>
                        </div>
                      </div>
                      <Badge variant={pattern.trend === 'increasing' ? 'destructive' : pattern.trend === 'decreasing' ? 'default' : 'outline'}>
                        {pattern.trend}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Calls</Label>
                        <p className="font-medium">{pattern.totalCalls.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Cost</Label>
                        <p className="font-medium">{formatCurrency(pattern.totalCost)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Avg Cost/Call</Label>
                        <p className="font-medium">{formatCurrency(pattern.avgCost)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Avg Tokens/Call</Label>
                        <p className="font-medium">{formatTokens(pattern.avgTokens)}</p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Peak usage: {pattern.peakHour}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Switch } from '@repo/ui/components/ui/switch';
import { Label } from '@repo/ui/components/ui/label';
import { 
  BarChart3, 
  Shield, 
  Bell, 
  Bug, 
  Crown, 
  RefreshCw, 
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

// Import our dashboard components
import { UsageOverview } from './usage-overview';
import { CostBreakdownChart } from './cost-breakdown-chart';
import { BudgetControls } from './budget-controls';
import { AlertsManagement } from './alerts-management';
import { DebuggingTools } from './debugging-tools';
import { SubscriptionTier } from './subscription-tier';

interface DashboardMainProps {
  className?: string;
}

export function DashboardMain({ className }: DashboardMainProps) {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Accessibility: Announce updates to screen readers
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const handleManualRefresh = () => {
    setLastRefresh(new Date());
    setAnnouncements(['Dashboard data refreshed']);
    // Trigger refresh for all components
    window.dispatchEvent(new CustomEvent('dashboard-refresh'));
  };

  const addAnnouncement = (message: string) => {
    setAnnouncements(prev => [...prev.slice(-2), message]);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Screen reader announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Spendly Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your OpenAI API usage, costs, and spending patterns
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Auto-refresh controls */}
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              aria-describedby="auto-refresh-description"
            />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh
            </Label>
            <span id="auto-refresh-description" className="sr-only">
              Automatically refresh dashboard data every {refreshInterval} seconds
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleManualRefresh}
            aria-label="Manually refresh dashboard data"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <div className="text-xs text-muted-foreground">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$127.45</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 within limits
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">
              1 triggered today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
          <TabsTrigger 
            value="overview" 
            className="flex items-center gap-2"
            aria-label="Overview dashboard tab"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger 
            value="budgets" 
            className="flex items-center gap-2"
            aria-label="Budget controls tab"
          >
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Budgets</span>
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            className="flex items-center gap-2"
            aria-label="Alerts and notifications tab"
          >
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger 
            value="debugging" 
            className="flex items-center gap-2"
            aria-label="Debugging tools tab"
          >
            <Bug className="h-4 w-4" />
            <span className="hidden sm:inline">Debug</span>
          </TabsTrigger>
          <TabsTrigger 
            value="subscription" 
            className="flex items-center gap-2"
            aria-label="Subscription management tab"
          >
            <Crown className="h-4 w-4" />
            <span className="hidden sm:inline">Plan</span>
          </TabsTrigger>
          <TabsTrigger 
            value="settings" 
            className="flex items-center gap-2"
            aria-label="Dashboard settings tab"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UsageOverview 
              className="lg:col-span-1" 
              onDataUpdate={(message) => addAnnouncement(message)}
            />
            <CostBreakdownChart 
              className="lg:col-span-1"
              onDataUpdate={(message) => addAnnouncement(message)}
            />
          </div>
        </TabsContent>

        <TabsContent value="budgets" className="space-y-6">
          <BudgetControls onDataUpdate={(message) => addAnnouncement(message)} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <AlertsManagement onDataUpdate={(message) => addAnnouncement(message)} />
        </TabsContent>

        <TabsContent value="debugging" className="space-y-6">
          <DebuggingTools onDataUpdate={(message) => addAnnouncement(message)} />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionTier onDataUpdate={(message) => addAnnouncement(message)} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Dashboard Settings
              </CardTitle>
              <CardDescription>
                Customize your dashboard experience and accessibility preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Accessibility Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Accessibility</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="reduce-motion">Reduce Motion</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch id="reduce-motion" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="high-contrast">High Contrast Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase contrast for better visibility
                      </p>
                    </div>
                    <Switch id="high-contrast" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="screen-reader">Screen Reader Optimizations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enhanced announcements and descriptions
                      </p>
                    </div>
                    <Switch id="screen-reader" />
                  </div>
                </div>
              </div>

              {/* Data Refresh Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Data Refresh</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-refresh-setting">Auto Refresh</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically update dashboard data
                      </p>
                    </div>
                    <Switch 
                      id="auto-refresh-setting" 
                      checked={autoRefresh}
                      onCheckedChange={setAutoRefresh}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
                    <select 
                      id="refresh-interval"
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      className="w-full p-2 border rounded-md"
                      disabled={!autoRefresh}
                    >
                      <option value={15}>15 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={300}>5 minutes</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chart Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Charts & Visualizations</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="chart-animations">Chart Animations</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable smooth chart transitions
                      </p>
                    </div>
                    <Switch id="chart-animations" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="chart-tooltips">Enhanced Tooltips</Label>
                      <p className="text-sm text-muted-foreground">
                        Show detailed information on hover
                      </p>
                    </div>
                    <Switch id="chart-tooltips" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="data-labels">Data Labels</Label>
                      <p className="text-sm text-muted-foreground">
                        Display values directly on charts
                      </p>
                    </div>
                    <Switch id="data-labels" />
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notifications</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="browser-notifications">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications in your browser
                      </p>
                    </div>
                    <Switch id="browser-notifications" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sound-alerts">Sound Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Play sound for important alerts
                      </p>
                    </div>
                    <Switch id="sound-alerts" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button onClick={() => addAnnouncement('Settings saved successfully')}>
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Keyboard Navigation Help */}
      <div className="sr-only" role="region" aria-label="Keyboard navigation help">
        <h2>Keyboard Navigation</h2>
        <ul>
          <li>Use Tab to navigate between interactive elements</li>
          <li>Use Arrow keys to navigate between tabs</li>
          <li>Use Enter or Space to activate buttons and switches</li>
          <li>Use Escape to close dialogs and modals</li>
        </ul>
      </div>
    </div>
  );
}

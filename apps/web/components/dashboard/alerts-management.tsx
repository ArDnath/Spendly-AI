'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Switch } from '@repo/ui/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Badge } from '@repo/ui/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/components/ui/tabs';
import { Bell, Plus, Mail, MessageSquare, Webhook, Edit, Trash2, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@repo/ui/components/ui/use-toast';

interface AlertsManagementProps {
  className?: string;
}

interface Alert {
  id: string;
  name: string;
  type: 'COST' | 'TOKEN' | 'RATE_LIMIT' | 'ERROR_RATE';
  threshold: number;
  comparison: 'GREATER_THAN' | 'LESS_THAN' | 'EQUALS';
  period: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY';
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
  channels: NotificationChannel[];
  projectId?: string;
  projectName?: string;
}

interface NotificationChannel {
  id: string;
  type: 'EMAIL' | 'SLACK' | 'DISCORD' | 'TEAMS' | 'WEBHOOK';
  name: string;
  config: Record<string, any>;
  isActive: boolean;
  lastUsed?: Date;
}

interface Project {
  id: string;
  name: string;
}

export function AlertsManagement({ className }: AlertsManagementProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateAlertOpen, setIsCreateAlertOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);
  const { toast } = useToast();

  // Alert form state
  const [alertForm, setAlertForm] = useState({
    name: '',
    type: 'COST' as const,
    threshold: '',
    comparison: 'GREATER_THAN' as const,
    period: 'DAILY' as const,
    projectId: '',
    channelIds: [] as string[]
  });

  // Channel form state
  const [channelForm, setChannelForm] = useState({
    name: '',
    type: 'EMAIL' as const,
    config: {} as Record<string, any>
  });

  useEffect(() => {
    fetchAlerts();
    fetchChannels();
    fetchProjects();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await fetch('/api/notifications/channels');
      if (response.ok) {
        const data = await response.json();
        setChannels(data.channels);
      }
    } catch (error) {
      console.error('Failed to fetch channels:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleCreateAlert = async () => {
    try {
      const payload = {
        name: alertForm.name,
        type: alertForm.type,
        threshold: parseFloat(alertForm.threshold),
        comparison: alertForm.comparison,
        period: alertForm.period,
        channelIds: alertForm.channelIds,
        ...(alertForm.projectId && { projectId: alertForm.projectId })
      };

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchAlerts();
        setIsCreateAlertOpen(false);
        resetAlertForm();
        toast({
          title: "Success",
          description: "Alert created successfully"
        });
      } else {
        throw new Error('Failed to create alert');
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive"
      });
    }
  };

  const handleCreateChannel = async () => {
    try {
      const payload = {
        name: channelForm.name,
        type: channelForm.type,
        config: channelForm.config
      };

      const response = await fetch('/api/notifications/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchChannels();
        setIsCreateChannelOpen(false);
        resetChannelForm();
        toast({
          title: "Success",
          description: "Notification channel created successfully"
        });
      } else {
        throw new Error('Failed to create channel');
      }
    } catch (error) {
      console.error('Failed to create channel:', error);
      toast({
        title: "Error",
        description: "Failed to create notification channel",
        variant: "destructive"
      });
    }
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        await fetchAlerts();
        toast({
          title: "Success",
          description: `Alert ${isActive ? 'activated' : 'deactivated'}`
        });
      }
    } catch (error) {
      console.error('Failed to toggle alert:', error);
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive"
      });
    }
  };

  const handleToggleChannel = async (channelId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/notifications/channels/${channelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        await fetchChannels();
        toast({
          title: "Success",
          description: `Channel ${isActive ? 'activated' : 'deactivated'}`
        });
      }
    } catch (error) {
      console.error('Failed to toggle channel:', error);
      toast({
        title: "Error",
        description: "Failed to update channel",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAlerts();
        toast({
          title: "Success",
          description: "Alert deleted successfully"
        });
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive"
      });
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    try {
      const response = await fetch(`/api/notifications/channels/${channelId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchChannels();
        toast({
          title: "Success",
          description: "Channel deleted successfully"
        });
      }
    } catch (error) {
      console.error('Failed to delete channel:', error);
      toast({
        title: "Error",
        description: "Failed to delete channel",
        variant: "destructive"
      });
    }
  };

  const resetAlertForm = () => {
    setAlertForm({
      name: '',
      type: 'COST',
      threshold: '',
      comparison: 'GREATER_THAN',
      period: 'DAILY',
      projectId: '',
      channelIds: []
    });
  };

  const resetChannelForm = () => {
    setChannelForm({
      name: '',
      type: 'EMAIL',
      config: {}
    });
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'COST': return '💰';
      case 'TOKEN': return '🔢';
      case 'RATE_LIMIT': return '⚡';
      case 'ERROR_RATE': return '⚠️';
      default: return '🔔';
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'SLACK': return <MessageSquare className="h-4 w-4" />;
      case 'DISCORD': return <MessageSquare className="h-4 w-4" />;
      case 'TEAMS': return <MessageSquare className="h-4 w-4" />;
      case 'WEBHOOK': return <Webhook className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const formatThreshold = (alert: Alert) => {
    switch (alert.type) {
      case 'COST': return `$${alert.threshold}`;
      case 'TOKEN': return `${alert.threshold.toLocaleString()} tokens`;
      case 'RATE_LIMIT': return `${alert.threshold} requests`;
      case 'ERROR_RATE': return `${alert.threshold}%`;
      default: return alert.threshold.toString();
    }
  };

  const renderChannelConfig = () => {
    switch (channelForm.type) {
      case 'EMAIL':
        return (
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={channelForm.config.email || ''}
              onChange={(e) => setChannelForm({
                ...channelForm,
                config: { ...channelForm.config, email: e.target.value }
              })}
              placeholder="alerts@company.com"
            />
          </div>
        );
      case 'SLACK':
        return (
          <div className="grid gap-2">
            <Label htmlFor="webhook-url">Slack Webhook URL</Label>
            <Input
              id="webhook-url"
              value={channelForm.config.webhookUrl || ''}
              onChange={(e) => setChannelForm({
                ...channelForm,
                config: { ...channelForm.config, webhookUrl: e.target.value }
              })}
              placeholder="https://hooks.slack.com/services/..."
            />
          </div>
        );
      case 'DISCORD':
        return (
          <div className="grid gap-2">
            <Label htmlFor="webhook-url">Discord Webhook URL</Label>
            <Input
              id="webhook-url"
              value={channelForm.config.webhookUrl || ''}
              onChange={(e) => setChannelForm({
                ...channelForm,
                config: { ...channelForm.config, webhookUrl: e.target.value }
              })}
              placeholder="https://discord.com/api/webhooks/..."
            />
          </div>
        );
      case 'TEAMS':
        return (
          <div className="grid gap-2">
            <Label htmlFor="webhook-url">Teams Webhook URL</Label>
            <Input
              id="webhook-url"
              value={channelForm.config.webhookUrl || ''}
              onChange={(e) => setChannelForm({
                ...channelForm,
                config: { ...channelForm.config, webhookUrl: e.target.value }
              })}
              placeholder="https://outlook.office.com/webhook/..."
            />
          </div>
        );
      case 'WEBHOOK':
        return (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="webhook-url">Webhook URL</Label>
              <Input
                id="webhook-url"
                value={channelForm.config.url || ''}
                onChange={(e) => setChannelForm({
                  ...channelForm,
                  config: { ...channelForm.config, url: e.target.value }
                })}
                placeholder="https://api.example.com/webhooks/alerts"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="webhook-secret">Secret (Optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                value={channelForm.config.secret || ''}
                onChange={(e) => setChannelForm({
                  ...channelForm,
                  config: { ...channelForm.config, secret: e.target.value }
                })}
                placeholder="webhook-secret-key"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
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
              <Bell className="h-5 w-5" />
              Alerts & Notifications
            </CardTitle>
            <CardDescription>
              Set up alerts and manage notification channels
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="alerts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Alert Rules</h3>
              <Dialog open={isCreateAlertOpen} onOpenChange={setIsCreateAlertOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetAlertForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Alert
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Alert</DialogTitle>
                    <DialogDescription>
                      Set up a new alert rule to monitor your usage
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="alert-name">Alert Name</Label>
                      <Input
                        id="alert-name"
                        value={alertForm.name}
                        onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
                        placeholder="e.g., High Cost Alert"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="alert-type">Type</Label>
                        <Select value={alertForm.type} onValueChange={(value: any) => setAlertForm({ ...alertForm, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COST">Cost ($)</SelectItem>
                            <SelectItem value="TOKEN">Tokens</SelectItem>
                            <SelectItem value="RATE_LIMIT">Rate Limit</SelectItem>
                            <SelectItem value="ERROR_RATE">Error Rate (%)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="alert-period">Period</Label>
                        <Select value={alertForm.period} onValueChange={(value: any) => setAlertForm({ ...alertForm, period: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HOURLY">Hourly</SelectItem>
                            <SelectItem value="DAILY">Daily</SelectItem>
                            <SelectItem value="WEEKLY">Weekly</SelectItem>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="alert-comparison">Condition</Label>
                        <Select value={alertForm.comparison} onValueChange={(value: any) => setAlertForm({ ...alertForm, comparison: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="GREATER_THAN">Greater than</SelectItem>
                            <SelectItem value="LESS_THAN">Less than</SelectItem>
                            <SelectItem value="EQUALS">Equals</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="alert-threshold">Threshold</Label>
                        <Input
                          id="alert-threshold"
                          type="number"
                          step="0.01"
                          value={alertForm.threshold}
                          onChange={(e) => setAlertForm({ ...alertForm, threshold: e.target.value })}
                          placeholder="100"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="alert-project">Project (Optional)</Label>
                      <Select value={alertForm.projectId} onValueChange={(value) => setAlertForm({ ...alertForm, projectId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="All projects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">All projects</SelectItem>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label>Notification Channels</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {channels.filter(c => c.isActive).map((channel) => (
                          <div key={channel.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`channel-${channel.id}`}
                              checked={alertForm.channelIds.includes(channel.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setAlertForm({
                                    ...alertForm,
                                    channelIds: [...alertForm.channelIds, channel.id]
                                  });
                                } else {
                                  setAlertForm({
                                    ...alertForm,
                                    channelIds: alertForm.channelIds.filter(id => id !== channel.id)
                                  });
                                }
                              }}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`channel-${channel.id}`} className="flex items-center gap-2 text-sm">
                              {getChannelIcon(channel.type)}
                              {channel.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateAlertOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateAlert} disabled={!alertForm.name || !alertForm.threshold || alertForm.channelIds.length === 0}>
                      Create Alert
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No alerts configured</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first alert to monitor usage and costs
                  </p>
                  <Button onClick={() => setIsCreateAlertOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getAlertTypeIcon(alert.type)}</span>
                        <div>
                          <h3 className="font-medium">{alert.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {alert.comparison.replace('_', ' ').toLowerCase()} {formatThreshold(alert)} per {alert.period.toLowerCase()}
                            {alert.projectName && ` • ${alert.projectName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.isActive ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                        <Switch
                          checked={alert.isActive}
                          onCheckedChange={(checked) => handleToggleAlert(alert.id, checked)}
                        />
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAlert(alert.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Channels: {alert.channels.length}</span>
                        <span>Triggered: {alert.triggerCount} times</span>
                      </div>
                      {alert.lastTriggered && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last: {new Date(alert.lastTriggered).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="channels" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Notification Channels</h3>
              <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetChannelForm}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Channel
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Notification Channel</DialogTitle>
                    <DialogDescription>
                      Configure a new channel to receive alerts
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="channel-name">Channel Name</Label>
                      <Input
                        id="channel-name"
                        value={channelForm.name}
                        onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                        placeholder="e.g., Team Slack"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="channel-type">Type</Label>
                      <Select value={channelForm.type} onValueChange={(value: any) => setChannelForm({ ...channelForm, type: value, config: {} })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="EMAIL">Email</SelectItem>
                          <SelectItem value="SLACK">Slack</SelectItem>
                          <SelectItem value="DISCORD">Discord</SelectItem>
                          <SelectItem value="TEAMS">Microsoft Teams</SelectItem>
                          <SelectItem value="WEBHOOK">Custom Webhook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {renderChannelConfig()}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateChannelOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateChannel} disabled={!channelForm.name}>
                      Add Channel
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-4">
              {channels.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No notification channels</h3>
                  <p className="text-muted-foreground mb-4">
                    Add channels to receive alerts via email, Slack, Discord, or webhooks
                  </p>
                  <Button onClick={() => setIsCreateChannelOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Channel
                  </Button>
                </div>
              ) : (
                channels.map((channel) => (
                  <div key={channel.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getChannelIcon(channel.type)}
                        <div>
                          <h3 className="font-medium">{channel.name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">
                            {channel.type.toLowerCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {channel.isActive ? (
                          <Badge variant="default">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline">Inactive</Badge>
                        )}
                        <Switch
                          checked={channel.isActive}
                          onCheckedChange={(checked) => handleToggleChannel(channel.id, checked)}
                        />
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteChannel(channel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {channel.lastUsed && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last used: {new Date(channel.lastUsed).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

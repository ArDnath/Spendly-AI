"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { 
  AlertTriangle, 
  Plus, 
  Mail, 
  MessageSquare, 
  DollarSign,
  Activity,
  Edit,
  Trash2
} from "lucide-react";

interface Alert {
  id: string;
  type: 'email' | 'slack';
  threshold: number;
  thresholdType: 'cost' | 'tokens';
  isActive: boolean;
  apiKeyId?: string;
  apiKeyProvider?: string;
}

interface AlertsManagerProps {
  alerts: Alert[];
  onCreateAlert: (alert: Omit<Alert, 'id'>) => void;
  onUpdateAlert: (alertId: string, updates: Partial<Alert>) => void;
  onDeleteAlert: (alertId: string) => void;
}

export function AlertsManager({
  alerts,
  onCreateAlert,
  onUpdateAlert,
  onDeleteAlert
}: AlertsManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'email' as 'email' | 'slack',
    threshold: 10,
    thresholdType: 'cost' as 'cost' | 'tokens',
    isActive: true,
    apiKeyId: ''
  });

  const handleCreateAlert = () => {
    onCreateAlert({
      ...newAlert,
      apiKeyId: newAlert.apiKeyId || undefined
    });
    setIsCreateDialogOpen(false);
    setNewAlert({
      type: 'email',
      threshold: 10,
      thresholdType: 'cost',
      isActive: true,
      apiKeyId: ''
    });
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'slack':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getThresholdIcon = (type: string) => {
    switch (type) {
      case 'cost':
        return <DollarSign className="w-4 h-4" />;
      case 'tokens':
        return <Activity className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const formatThreshold = (threshold: number, type: string) => {
    if (type === 'cost') return `$${threshold}`;
    if (type === 'tokens') {
      if (threshold >= 1000000) return `${(threshold / 1000000).toFixed(1)}M tokens`;
      if (threshold >= 1000) return `${(threshold / 1000).toFixed(1)}K tokens`;
      return `${threshold} tokens`;
    }
    return threshold.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alert Management
            </CardTitle>
            <CardDescription>
              Set up alerts to monitor your API usage and spending
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Alert
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Set up a new alert to monitor your API usage or spending.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <Select
                    value={newAlert.type}
                    onValueChange={(value: 'email' | 'slack') => 
                      setNewAlert({ ...newAlert, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="slack">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Slack
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold-type">Threshold Type</Label>
                  <Select
                    value={newAlert.thresholdType}
                    onValueChange={(value: 'cost' | 'tokens') => 
                      setNewAlert({ ...newAlert, thresholdType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cost">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Cost ($)
                        </div>
                      </SelectItem>
                      <SelectItem value="tokens">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Tokens
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">
                    Threshold {newAlert.thresholdType === 'cost' ? '($)' : '(tokens)'}
                  </Label>
                  <Input
                    id="threshold"
                    type="number"
                    value={newAlert.threshold}
                    onChange={(e) => 
                      setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) || 0 })
                    }
                    placeholder={newAlert.thresholdType === 'cost' ? '10.00' : '1000'}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={newAlert.isActive}
                    onCheckedChange={(checked) => 
                      setNewAlert({ ...newAlert, isActive: checked })
                    }
                  />
                  <Label htmlFor="active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateAlert}>
                  Create Alert
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Alerts Set</h3>
            <p className="text-gray-500 mb-4">
              Create your first alert to monitor API usage and spending
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Alert
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getAlertIcon(alert.type)}
                    <Badge variant={alert.isActive ? "default" : "secondary"}>
                      {alert.type}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getThresholdIcon(alert.thresholdType)}
                    <span className="font-medium">
                      {formatThreshold(alert.threshold, alert.thresholdType)}
                    </span>
                  </div>

                  {alert.apiKeyProvider && (
                    <Badge variant="outline" className="text-xs">
                      {alert.apiKeyProvider}
                    </Badge>
                  )}

                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${alert.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-sm text-gray-600">
                      {alert.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    checked={alert.isActive}
                    onCheckedChange={(checked) => 
                      onUpdateAlert(alert.id, { isActive: checked })
                    }
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteAlert(alert.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

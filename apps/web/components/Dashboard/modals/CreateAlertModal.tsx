"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Bell, AlertTriangle, DollarSign, Activity } from "lucide-react";

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AlertFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface AlertFormData {
  name: string;
  thresholdType: 'cost' | 'tokens' | 'requests';
  threshold: number;
  period: 'daily' | 'weekly' | 'monthly';
  notificationMethod: 'email' | 'slack' | 'webhook';
  isActive: boolean;
  apiKeyId?: string;
}

const THRESHOLD_TYPES = [
  { 
    id: 'cost', 
    name: 'Cost Threshold', 
    icon: DollarSign,
    description: 'Alert when spending exceeds amount',
    unit: '$'
  },
  { 
    id: 'tokens', 
    name: 'Token Usage', 
    icon: Activity,
    description: 'Alert when token usage exceeds limit',
    unit: 'tokens'
  },
  { 
    id: 'requests', 
    name: 'Request Count', 
    icon: Bell,
    description: 'Alert when request count exceeds limit',
    unit: 'requests'
  }
];

const PERIODS = [
  { id: 'daily', name: 'Daily' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' }
];

const NOTIFICATION_METHODS = [
  { id: 'email', name: 'Email', description: 'Send alert via email' },
  { id: 'slack', name: 'Slack', description: 'Send alert to Slack channel' },
  { id: 'webhook', name: 'Webhook', description: 'Send alert to custom webhook' }
];

export function CreateAlertModal({ isOpen, onClose, onSubmit, isLoading }: CreateAlertModalProps) {
  const [formData, setFormData] = useState<AlertFormData>({
    name: '',
    thresholdType: 'cost',
    threshold: 0,
    period: 'monthly',
    notificationMethod: 'email',
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedThresholdType = THRESHOLD_TYPES.find(t => t.id === formData.thresholdType);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Alert name is required';
    }

    if (!formData.threshold || formData.threshold <= 0) {
      newErrors.threshold = 'Threshold must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      thresholdType: 'cost',
      threshold: 0,
      period: 'monthly',
      notificationMethod: 'email',
      isActive: true
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Create New Alert
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Set up an alert to monitor your AI usage and costs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Alert Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g., Monthly Budget Alert"
              className="bg-gray-900 border-gray-700 text-white"
            />
            {errors.name && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Threshold Type */}
          <div className="space-y-2">
            <Label className="text-gray-300">Alert Type *</Label>
            <Select 
              value={formData.thresholdType} 
              onValueChange={(value: 'cost' | 'tokens' | 'requests') => 
                setFormData(prev => ({ ...prev, thresholdType: value }))
              }
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {THRESHOLD_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="text-white hover:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <type.icon className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-xs text-gray-400">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Threshold Value */}
          <div className="space-y-2">
            <Label htmlFor="threshold" className="text-gray-300">
              Threshold Value * ({selectedThresholdType?.unit})
            </Label>
            <div className="relative">
              {formData.thresholdType === 'cost' && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              )}
              <Input
                id="threshold"
                type="number"
                min="0"
                step={formData.thresholdType === 'cost' ? '0.01' : '1'}
                value={formData.threshold || ''}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, threshold: parseFloat(e.target.value) || 0 }));
                  if (errors.threshold) setErrors(prev => ({ ...prev, threshold: '' }));
                }}
                placeholder="0"
                className={`bg-gray-900 border-gray-700 text-white ${
                  formData.thresholdType === 'cost' ? 'pl-8' : ''
                }`}
              />
            </div>
            {errors.threshold && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.threshold}
              </p>
            )}
          </div>

          {/* Period */}
          <div className="space-y-2">
            <Label className="text-gray-300">Period *</Label>
            <Select 
              value={formData.period} 
              onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                setFormData(prev => ({ ...prev, period: value }))
              }
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {PERIODS.map((period) => (
                  <SelectItem key={period.id} value={period.id} className="text-white hover:bg-gray-800">
                    {period.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notification Method */}
          <div className="space-y-2">
            <Label className="text-gray-300">Notification Method *</Label>
            <Select 
              value={formData.notificationMethod} 
              onValueChange={(value: 'email' | 'slack' | 'webhook') => 
                setFormData(prev => ({ ...prev, notificationMethod: value }))
              }
            >
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {NOTIFICATION_METHODS.map((method) => (
                  <SelectItem key={method.id} value={method.id} className="text-white hover:bg-gray-800">
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-xs text-gray-400">{method.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-gray-300">Active</Label>
              <p className="text-sm text-gray-400">Enable this alert immediately</p>
            </div>
            <Switch
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-white text-black hover:bg-gray-100"
            >
              {isLoading ? 'Creating...' : 'Create Alert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { Progress } from '@repo/ui/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@repo/ui/components/ui/dialog';
import { Label } from '@repo/ui/components/ui/label';
import { Crown, Zap, Shield, Users, Check, X, AlertTriangle, ExternalLink, ArrowUp } from 'lucide-react';
import { useToast } from '@repo/ui/components/ui/use-toast';

interface SubscriptionTierProps {
  className?: string;
}

interface SubscriptionInfo {
  currentPlan: 'FREE' | 'PRO' | 'TEAM' | 'ADVANCED';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: Date;
  usage: {
    apiKeys: { current: number; limit: number };
    monthlySpend: { current: number; limit: number };
    historyDays: { current: number; limit: number };
    alertChannels: { current: number; limit: number };
  };
  features: {
    multiChannelAlerts: boolean;
    csvExport: boolean;
    teamAccounts: boolean;
    priorityAlerts: boolean;
    soc2Compliance: boolean;
    sso: boolean;
    webhooks: boolean;
    advancedAnalytics: boolean;
  };
}

interface PlanDetails {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: string[];
  limits: {
    apiKeys: number;
    monthlySpend: number;
    historyDays: number;
    alertChannels: number;
  };
  popular?: boolean;
}

const PLANS: PlanDetails[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started with AI spend tracking',
    features: [
      '1 API key',
      '$20/month tracking limit',
      '7-day usage history',
      'Email alerts only',
      'Basic dashboard',
      'Community support'
    ],
    limits: {
      apiKeys: 1,
      monthlySpend: 20,
      historyDays: 7,
      alertChannels: 1
    }
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    period: 'month',
    description: 'For indie hackers and small projects',
    features: [
      '5 API keys',
      '$500/month tracking limit',
      '30-day usage history',
      'Multi-channel alerts (Slack, Discord, Teams)',
      'CSV data export',
      'Advanced analytics',
      'Email support'
    ],
    limits: {
      apiKeys: 5,
      monthlySpend: 500,
      historyDays: 30,
      alertChannels: 5
    },
    popular: true
  },
  {
    id: 'team',
    name: 'Team',
    price: 29,
    period: 'month',
    description: 'For growing teams and startups',
    features: [
      'Unlimited API keys',
      '$5,000/month tracking limit',
      '90-day usage history',
      'Team accounts & roles',
      'Priority alerts',
      'Custom webhooks',
      'Advanced reporting',
      'Priority support'
    ],
    limits: {
      apiKeys: -1, // unlimited
      monthlySpend: 5000,
      historyDays: 90,
      alertChannels: 10
    }
  },
  {
    id: 'advanced',
    name: 'Advanced',
    price: 99,
    period: 'month',
    description: 'For enterprises with high-volume usage',
    features: [
      'Unlimited API keys',
      '$50,000/month tracking limit',
      '365-day usage history',
      'SOC2 & GDPR compliance',
      'SSO integration',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    limits: {
      apiKeys: -1, // unlimited
      monthlySpend: 50000,
      historyDays: 365,
      alertChannels: -1 // unlimited
    }
  }
];

export function SubscriptionTier({ className }: SubscriptionTierProps) {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [showPlansDialog, setShowPlansDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  const fetchSubscriptionInfo = async () => {
    try {
      const response = await fetch('/api/billing/subscription');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Failed to fetch subscription info:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setUpgrading(true);
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      toast({
        title: "Error",
        description: "Failed to start upgrade process",
        variant: "destructive"
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal",
        variant: "destructive"
      });
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Zap className="h-5 w-5" />;
      case 'pro': return <Shield className="h-5 w-5" />;
      case 'team': return <Users className="h-5 w-5" />;
      case 'advanced': return <Crown className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'text-gray-600';
      case 'pro': return 'text-blue-600';
      case 'team': return 'text-purple-600';
      case 'advanced': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getUsageColor = (current: number, limit: number) => {
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (current: number, limit: number) => {
    const percentage = limit > 0 ? (current / limit) * 100 : 0;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString()}`;
  const formatLimit = (limit: number) => limit === -1 ? 'Unlimited' : limit.toLocaleString();

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 mb-2"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Subscription Error
          </CardTitle>
          <CardDescription>
            Unable to load subscription information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchSubscriptionInfo}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentPlan = PLANS.find(p => p.id === subscription.currentPlan.toLowerCase()) || PLANS[0];
  const isNearLimit = (current: number, limit: number) => limit > 0 && (current / limit) >= 0.8;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className={getPlanColor(subscription.currentPlan)}>
                {getPlanIcon(subscription.currentPlan)}
              </div>
              Subscription Plan
            </CardTitle>
            <CardDescription>
              Manage your plan and track usage limits
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <ArrowUp className="h-4 w-4 mr-2" />
                  View Plans
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[900px]">
                <DialogHeader>
                  <DialogTitle>Choose Your Plan</DialogTitle>
                  <DialogDescription>
                    Select the plan that best fits your needs
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
                  {PLANS.map((plan) => (
                    <div key={plan.id} className={`border rounded-lg p-4 relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                      {plan.popular && (
                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                          Most Popular
                        </Badge>
                      )}
                      <div className="text-center mb-4">
                        <h3 className="font-semibold text-lg">{plan.name}</h3>
                        <div className="text-2xl font-bold">
                          {plan.price === 0 ? 'Free' : `$${plan.price}`}
                          {plan.price > 0 && <span className="text-sm text-muted-foreground">/{plan.period}</span>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{plan.description}</p>
                      </div>
                      
                      <ul className="space-y-2 mb-4">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-sm">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      {subscription.currentPlan.toLowerCase() === plan.id ? (
                        <Badge variant="default" className="w-full justify-center">
                          Current Plan
                        </Badge>
                      ) : (
                        <Button 
                          className="w-full" 
                          variant={plan.popular ? "default" : "outline"}
                          onClick={() => handleUpgrade(plan.id)}
                          disabled={upgrading}
                        >
                          {upgrading ? 'Processing...' : 'Select Plan'}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
            
            {subscription.currentPlan !== 'FREE' && (
              <Button variant="outline" onClick={handleManageBilling}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Billing
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Plan Info */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className={getPlanColor(subscription.currentPlan)}>
              {getPlanIcon(subscription.currentPlan)}
            </div>
            <div>
              <h3 className="font-semibold">{currentPlan.name} Plan</h3>
              <p className="text-sm text-muted-foreground">
                {subscription.status === 'active' ? 'Active' : subscription.status}
                {subscription.currentPeriodEnd && (
                  <span> • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</span>
                )}
              </p>
            </div>
          </div>
          {subscription.currentPlan !== 'ADVANCED' && (
            <Button onClick={() => setShowPlansDialog(true)}>
              Upgrade Plan
            </Button>
          )}
        </div>

        {/* Usage Limits */}
        <div className="space-y-4">
          <h4 className="font-medium">Usage & Limits</h4>
          
          {/* API Keys */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">API Keys</Label>
              <span className={`text-sm font-medium ${getUsageColor(subscription.usage.apiKeys.current, subscription.usage.apiKeys.limit)}`}>
                {subscription.usage.apiKeys.current} / {formatLimit(subscription.usage.apiKeys.limit)}
              </span>
            </div>
            {subscription.usage.apiKeys.limit > 0 && (
              <Progress 
                value={(subscription.usage.apiKeys.current / subscription.usage.apiKeys.limit) * 100}
                className="h-2"
                indicatorClassName={getProgressColor(subscription.usage.apiKeys.current, subscription.usage.apiKeys.limit)}
              />
            )}
            {isNearLimit(subscription.usage.apiKeys.current, subscription.usage.apiKeys.limit) && (
              <div className="flex items-center gap-2 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                Approaching API key limit
              </div>
            )}
          </div>

          {/* Monthly Spend */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Monthly Spend Tracking</Label>
              <span className={`text-sm font-medium ${getUsageColor(subscription.usage.monthlySpend.current, subscription.usage.monthlySpend.limit)}`}>
                {formatCurrency(subscription.usage.monthlySpend.current)} / {formatCurrency(subscription.usage.monthlySpend.limit)}
              </span>
            </div>
            <Progress 
              value={(subscription.usage.monthlySpend.current / subscription.usage.monthlySpend.limit) * 100}
              className="h-2"
              indicatorClassName={getProgressColor(subscription.usage.monthlySpend.current, subscription.usage.monthlySpend.limit)}
            />
            {isNearLimit(subscription.usage.monthlySpend.current, subscription.usage.monthlySpend.limit) && (
              <div className="flex items-center gap-2 text-xs text-yellow-600">
                <AlertTriangle className="h-3 w-3" />
                Approaching monthly spend limit
              </div>
            )}
          </div>

          {/* Alert Channels */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-sm">Alert Channels</Label>
              <span className={`text-sm font-medium ${getUsageColor(subscription.usage.alertChannels.current, subscription.usage.alertChannels.limit)}`}>
                {subscription.usage.alertChannels.current} / {formatLimit(subscription.usage.alertChannels.limit)}
              </span>
            </div>
            {subscription.usage.alertChannels.limit > 0 && (
              <Progress 
                value={(subscription.usage.alertChannels.current / subscription.usage.alertChannels.limit) * 100}
                className="h-2"
                indicatorClassName={getProgressColor(subscription.usage.alertChannels.current, subscription.usage.alertChannels.limit)}
              />
            )}
          </div>

          {/* History Retention */}
          <div className="flex justify-between items-center">
            <Label className="text-sm">History Retention</Label>
            <span className="text-sm font-medium">
              {subscription.usage.historyDays.limit} days
            </span>
          </div>
        </div>

        {/* Feature Gates */}
        <div className="space-y-4">
          <h4 className="font-medium">Available Features</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              {subscription.features.multiChannelAlerts ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Multi-channel Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              {subscription.features.csvExport ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">CSV Export</span>
            </div>
            <div className="flex items-center gap-2">
              {subscription.features.teamAccounts ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Team Accounts</span>
            </div>
            <div className="flex items-center gap-2">
              {subscription.features.priorityAlerts ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Priority Alerts</span>
            </div>
            <div className="flex items-center gap-2">
              {subscription.features.soc2Compliance ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">SOC2 Compliance</span>
            </div>
            <div className="flex items-center gap-2">
              {subscription.features.sso ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">SSO Integration</span>
            </div>
            <div className="flex items-center gap-2">
              {subscription.features.webhooks ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Custom Webhooks</span>
            </div>
            <div className="flex items-center gap-2">
              {subscription.features.advancedAnalytics ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <X className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm">Advanced Analytics</span>
            </div>
          </div>
        </div>

        {/* Upgrade Recommendations */}
        {(isNearLimit(subscription.usage.apiKeys.current, subscription.usage.apiKeys.limit) ||
          isNearLimit(subscription.usage.monthlySpend.current, subscription.usage.monthlySpend.limit) ||
          isNearLimit(subscription.usage.alertChannels.current, subscription.usage.alertChannels.limit)) && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">Upgrade Recommended</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              You're approaching your plan limits. Consider upgrading to avoid service interruptions.
            </p>
            <Button size="sm" onClick={() => setShowPlansDialog(true)}>
              View Upgrade Options
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

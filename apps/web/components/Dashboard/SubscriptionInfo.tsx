"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { 
  Crown, 
  Zap, 
  Users, 
  ArrowUpRight, 
  Check,
  AlertCircle,
  TrendingUp
} from "lucide-react";

interface SubscriptionPlan {
  name: string;
  tier: 'free' | 'pro' | 'team';
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  limits: {
    apiKeys: number;
    monthlyRequests: number;
    alerts: number;
    dataRetention: number; // days
  };
  usage: {
    apiKeys: number;
    monthlyRequests: number;
    alerts: number;
  };
}

interface SubscriptionInfoProps {
  currentPlan: SubscriptionPlan;
  onUpgrade: (plan: 'Pro' | 'Team') => void;
  onManageBilling: () => void;
}

export function SubscriptionInfo({
  currentPlan,
  onUpgrade,
  onManageBilling
}: SubscriptionInfoProps) {
  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Zap className="w-5 h-5" />;
      case 'pro':
        return <Crown className="w-5 h-5" />;
      case 'team':
        return <Users className="w-5 h-5" />;
      default:
        return <Zap className="w-5 h-5" />;
    }
  };

  const getPlanColor = (tier: string) => {
    switch (tier) {
      case 'free':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pro':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'team':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-amber-500";
    return "bg-green-500";
  };

  const isNearLimit = (used: number, limit: number) => {
    return (used / limit) >= 0.8;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Plan Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`border-2 ${getPlanColor(currentPlan.tier)}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPlanIcon(currentPlan.tier)}
                <div>
                  <CardTitle className="capitalize">{currentPlan.name} Plan</CardTitle>
                  <CardDescription>
                    {currentPlan.price === 0 
                      ? 'Free forever' 
                      : `$${currentPlan.price}/${currentPlan.billingCycle}`
                    }
                  </CardDescription>
                </div>
              </div>
              <Badge className={getPlanColor(currentPlan.tier)}>
                Current
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Usage Metrics */}
            <div className="space-y-4">
              {/* API Keys Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">API Keys</span>
                  <span className="text-gray-600">
                    {currentPlan.usage.apiKeys} / {currentPlan.limits.apiKeys}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(currentPlan.usage.apiKeys, currentPlan.limits.apiKeys)}
                  className="h-2"
                  indicatorClassName={getUsageColor(getUsagePercentage(currentPlan.usage.apiKeys, currentPlan.limits.apiKeys))}
                />
                {isNearLimit(currentPlan.usage.apiKeys, currentPlan.limits.apiKeys) && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    Approaching limit
                  </div>
                )}
              </div>

              {/* Monthly Requests Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Monthly Requests</span>
                  <span className="text-gray-600">
                    {currentPlan.usage.monthlyRequests.toLocaleString()} / {currentPlan.limits.monthlyRequests.toLocaleString()}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(currentPlan.usage.monthlyRequests, currentPlan.limits.monthlyRequests)}
                  className="h-2"
                  indicatorClassName={getUsageColor(getUsagePercentage(currentPlan.usage.monthlyRequests, currentPlan.limits.monthlyRequests))}
                />
                {isNearLimit(currentPlan.usage.monthlyRequests, currentPlan.limits.monthlyRequests) && (
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    Approaching limit
                  </div>
                )}
              </div>

              {/* Alerts Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Active Alerts</span>
                  <span className="text-gray-600">
                    {currentPlan.usage.alerts} / {currentPlan.limits.alerts}
                  </span>
                </div>
                <Progress 
                  value={getUsagePercentage(currentPlan.usage.alerts, currentPlan.limits.alerts)}
                  className="h-2"
                  indicatorClassName={getUsageColor(getUsagePercentage(currentPlan.usage.alerts, currentPlan.limits.alerts))}
                />
              </div>
            </div>

            {/* Plan Features */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Plan Features</h4>
              <div className="space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="w-3 h-3 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              {currentPlan.tier === 'free' ? (
                <Button onClick={() => onUpgrade('Pro')} className="flex-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Upgrade Plan
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={onManageBilling} className="flex-1">
                    Manage Billing
                  </Button>
                  <Button onClick={() => onUpgrade('Team')} className="flex-1 flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Upgrade
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Usage Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Usage Insights
            </CardTitle>
            <CardDescription>
              Optimize your plan based on usage patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Usage Efficiency */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-900">API Efficiency</div>
                  <div className="text-sm text-blue-700">
                    {((currentPlan.usage.apiKeys / currentPlan.limits.apiKeys) * 100).toFixed(0)}% of keys utilized
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {currentPlan.usage.apiKeys}/{currentPlan.limits.apiKeys}
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-900">Request Volume</div>
                  <div className="text-sm text-green-700">
                    {((currentPlan.usage.monthlyRequests / currentPlan.limits.monthlyRequests) * 100).toFixed(0)}% of monthly limit
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {(currentPlan.usage.monthlyRequests / 1000).toFixed(0)}K
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-purple-900">Alert Coverage</div>
                  <div className="text-sm text-purple-700">
                    {currentPlan.usage.alerts} active monitoring alerts
                  </div>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {currentPlan.usage.alerts}
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recommendations</h4>
              <div className="space-y-2">
                {currentPlan.tier === 'free' && currentPlan.usage.monthlyRequests > currentPlan.limits.monthlyRequests * 0.8 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Consider upgrading</span>
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                      You're using {((currentPlan.usage.monthlyRequests / currentPlan.limits.monthlyRequests) * 100).toFixed(0)}% of your monthly requests. 
                      Upgrade to Pro for unlimited requests.
                    </p>
                  </div>
                )}
                
                {currentPlan.usage.alerts === 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Set up alerts</span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      Create alerts to monitor your API usage and prevent unexpected costs.
                    </p>
                  </div>
                )}

                {currentPlan.usage.apiKeys < 2 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">Room to grow</span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      You can add {currentPlan.limits.apiKeys - currentPlan.usage.apiKeys} more API keys to your current plan.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

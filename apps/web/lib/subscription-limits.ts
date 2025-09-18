export interface SubscriptionLimits {
  maxApiKeys: number;
  maxMonthlySpend: number;
  maxHistoryDays: number;
  alertChannels: string[];
  priorityAlerts: boolean;
  csvExport: boolean;
  teamAccounts: boolean;
  webhooks: boolean;
  ssoSupport: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<string, SubscriptionLimits> = {
  Free: {
    maxApiKeys: 1,
    maxMonthlySpend: 20,
    maxHistoryDays: 7,
    alertChannels: ['email'],
    priorityAlerts: false,
    csvExport: false,
    teamAccounts: false,
    webhooks: false,
    ssoSupport: false,
  },
  Pro: {
    maxApiKeys: 5,
    maxMonthlySpend: 500,
    maxHistoryDays: 30,
    alertChannels: ['email', 'slack', 'discord'],
    priorityAlerts: false,
    csvExport: true,
    teamAccounts: false,
    webhooks: false,
    ssoSupport: false,
  },
  Team: {
    maxApiKeys: -1, // Unlimited
    maxMonthlySpend: 5000,
    maxHistoryDays: 90,
    alertChannels: ['email', 'slack', 'discord', 'teams'],
    priorityAlerts: true,
    csvExport: true,
    teamAccounts: true,
    webhooks: false,
    ssoSupport: false,
  },
  Advanced: {
    maxApiKeys: -1, // Unlimited
    maxMonthlySpend: 50000,
    maxHistoryDays: 365,
    alertChannels: ['email', 'slack', 'discord', 'teams', 'webhook'],
    priorityAlerts: true,
    csvExport: true,
    teamAccounts: true,
    webhooks: true,
    ssoSupport: true,
  },
};

export function getSubscriptionLimits(plan: string): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[plan] || SUBSCRIPTION_LIMITS.Free;
}

export function canAddApiKey(currentCount: number, plan: string): boolean {
  const limits = getSubscriptionLimits(plan);
  return limits.maxApiKeys === -1 || currentCount < limits.maxApiKeys;
}

export function canExceedSpendLimit(currentSpend: number, plan: string): boolean {
  const limits = getSubscriptionLimits(plan);
  return currentSpend < limits.maxMonthlySpend;
}

export function canUseAlertChannel(channel: string, plan: string): boolean {
  const limits = getSubscriptionLimits(plan);
  return limits.alertChannels.includes(channel);
}

export function getMaxHistoryDays(plan: string): number {
  const limits = getSubscriptionLimits(plan);
  return limits.maxHistoryDays;
}

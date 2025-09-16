import { create } from 'zustand';

interface ApiKey {
  id: string;
  provider: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  dailyTokens?: number;
  dailyCost?: number;
  alerts?: Array<{
    id: string;
    threshold: number;
    type: 'email' | 'slack';
    isActive: boolean;
  }>;
}

interface Alert {
  id: string;
  type: 'email' | 'slack';
  threshold: number;
  thresholdType?: 'cost' | 'tokens';
  isActive?: boolean;
  apiKeyId?: string;
  apiKeyProvider?: string;
  createdAt?: string;
  updatedAt?: string;
}

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

interface UsageSummary {
  currentMonth: {
    totalCost: number;
    totalTokens: number;
    totalRequests: number;
    mostExpensiveEndpoint: string | null;
    highestSingleCost: number;
  };
  recentTrend: Array<{
    date: string;
    cost: number;
    tokens: number;
  }>;
  period: {
    start: string;
    end: string;
  };
  // Extended fields for dashboard
  totalCost?: number;
  totalRequests?: number;
  totalTokens?: number;
  averageCostPerRequest?: number;
  moneySaved?: number;
  mostExpensiveEndpoint?: string | null;
  costTrend?: number;
  tokenTrend?: number;
  dailyUsage?: UsageData[];
  providerBreakdown?: ProviderUsage[];
}

interface User {
  id: string;
  email: string;
  name: string | null | undefined;
  subscriptionPlan?: string;
  budgetLimit?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface DashboardState {
  // Data
  apiKeys: ApiKey[];
  alerts: Alert[];
  usageSummary: UsageSummary | null;
  user: User | null;
  
  // UI State
  isLoading: boolean;
  selectedApiKeyId: string | null;
  showApiKeys: boolean;
  activeTab: string;
  
  // Actions
  setApiKeys: (keys: ApiKey[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setUsageSummary: (summary: UsageSummary) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setSelectedApiKeyId: (id: string | null) => void;
  setActiveTab: (tab: string) => void;
  toggleApiKeysVisibility: () => void;
  
  // Computed
  getApiKeyById: (id: string) => ApiKey | undefined;
  getActiveAlerts: () => Alert[];
  getBudgetUsedPercent: () => number;
  getRemainingBudget: () => number;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  apiKeys: [],
  alerts: [],
  usageSummary: null,
  user: null,
  isLoading: false,
  selectedApiKeyId: null,
  showApiKeys: false,
  activeTab: '',
  
  // Actions
  setApiKeys: (apiKeys) => set({ apiKeys }),
  setAlerts: (alerts) => set({ alerts }),
  setUsageSummary: (usageSummary) => set({ usageSummary }),
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  setSelectedApiKeyId: (id) => set({ selectedApiKeyId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleApiKeysVisibility: () => set((state) => ({ showApiKeys: !state.showApiKeys })),
  
  // Computed
  getApiKeyById: (id) => {
    const { apiKeys } = get();
    return apiKeys.find((key) => key.id === id);
  },
  
  getActiveAlerts: () => {
    const { alerts } = get();
    return alerts.filter((alert) => alert.isActive);
  },
  
  getBudgetUsedPercent: () => {
    const { usageSummary, user } = get();
    if (!usageSummary || !user?.budgetLimit) return 0;
    const totalCost = usageSummary.totalCost || usageSummary.currentMonth?.totalCost || 0;
    return (totalCost / user.budgetLimit) * 100;
  },
  
  getRemainingBudget: () => {
    const { usageSummary, user } = get();
    if (!usageSummary || !user?.budgetLimit) return 0;
    const totalCost = usageSummary.totalCost || usageSummary.currentMonth?.totalCost || 0;
    return user.budgetLimit - totalCost;
  },
}));

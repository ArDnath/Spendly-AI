import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface ApiKey {
  id: string;
  provider: string;
  status: string;
  createdAt: string;
  updatedAt: string;
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
}

interface User {
  id: string;
  email: string;
  name: string | null;
  subscriptionPlan: string;
  createdAt: string;
  updatedAt: string;
}

interface Alert {
  id: string;
  threshold: number;
  type: 'email' | 'slack';
  createdAt: string;
  updatedAt: string;
}

async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export function useUser(): ApiResponse<User> {
  const [data, setData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest<User>('/user/me');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  return { data, loading, error, refetch: fetchData };
}

export function useApiKeys(): ApiResponse<ApiKey[]> {
  const [data, setData] = useState<ApiKey[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest<{ apiKeys: ApiKey[] }>('/keys');
      setData(result.apiKeys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  return { data, loading, error, refetch: fetchData };
}

export function useUsageSummary(): ApiResponse<UsageSummary> {
  const [data, setData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await apiRequest<UsageSummary>('/dashboard/usage-summary');
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session]);

  return { data, loading, error, refetch: fetchData };
}

// API functions for dashboard integration
export function useApi() {
  const { data: session } = useSession();

  const fetchApiKeys = async () => {
    try {
      const result = await apiRequest<{ apiKeys: ApiKey[] }>('/keys');
      return { success: true, data: result.apiKeys };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const fetchUsageSummary = async () => {
    try {
      const result = await apiRequest<UsageSummary>('/dashboard/usage-summary');
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const fetchUserProfile = async () => {
    try {
      const result = await apiRequest<User>('/user/me');
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      await apiRequest(`/keys/${id}`, { method: 'DELETE' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const createAlert = async (alertData: any) => {
    try {
      const result = await apiRequest<Alert>('/alerts/threshold', {
        method: 'POST',
        body: JSON.stringify(alertData),
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const createCheckoutSession = async (plan: 'Pro' | 'Team') => {
    try {
      const result = await apiRequest<{ checkoutUrl: string }>('/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const createPortalSession = async () => {
    try {
      const result = await apiRequest<{ portalUrl: string }>('/billing/portal', {
        method: 'POST',
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const createApiKey = async (data: any) => {
    try {
      const result = await apiRequest<ApiKey>('/keys', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updateApiKey = async (id: string, data: any) => {
    try {
      const result = await apiRequest<ApiKey>(`/keys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const updateAlert = async (id: string, data: any) => {
    try {
      const result = await apiRequest<Alert>(`/alerts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      await apiRequest(`/alerts/${id}`, { method: 'DELETE' });
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const fetchUsageAnalytics = async (period: number = 30, apiKeyId?: string) => {
    try {
      const params = new URLSearchParams({
        period: period.toString()
      });
      
      if (apiKeyId) {
        params.append('apiKeyId', apiKeyId);
      }

      const response = await fetch(`/api/analytics/usage?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to fetch usage analytics' };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching usage analytics:', error);
      return { success: false, error: 'Network error' };
    }
  };

  return {
    fetchApiKeys,
    deleteApiKey,
    fetchUsageSummary,
    fetchUserProfile,
    createCheckoutSession,
    createPortalSession,
    createApiKey,
    updateApiKey,
    createAlert,
    updateAlert,
    deleteAlert,
    fetchUsageAnalytics
  };
}

// Legacy exports for backward compatibility
export async function deleteApiKey(id: string): Promise<void> {
  await apiRequest(`/keys/${id}`, { method: 'DELETE' });
}

export async function createAlert(threshold: number, type: 'email' | 'slack'): Promise<Alert> {
  return apiRequest<Alert>('/alerts/threshold', {
    method: 'POST',
    body: JSON.stringify({ threshold, type }),
  });
}

export async function createCheckoutSession(plan: 'Pro' | 'Team'): Promise<{ checkoutUrl: string }> {
  return apiRequest<{ checkoutUrl: string }>('/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export async function createPortalSession(): Promise<{ portalUrl: string }> {
  return apiRequest<{ portalUrl: string }>('/billing/portal', {
    method: 'POST',
  });
}

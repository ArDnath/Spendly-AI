"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useDashboardStore } from "../../stores/dashboard-store";
import { useApi } from "../../hooks/useApi";
import { useApiKeyManagement } from "../../hooks/useApiKeyManagement";
import { useAlertManagement } from "../../hooks/useAlertManagement";
import { useRealTimeUpdates } from "../../hooks/useRealTimeUpdates";
import { DashboardOverview } from "./DashboardOverview";
import { ApiKeysTable } from "./ApiKeysTable";
import { UsageAnalytics } from "./UsageAnalytics";
import { AlertsManager } from "./AlertsManager";
import { SubscriptionInfo } from "./SubscriptionInfo";
import { AddApiKeyModal } from "./modals/AddApiKeyModal";
import { EditApiKeyModal } from "./modals/EditApiKeyModal";
import { DeleteApiKeyModal } from "./modals/DeleteApiKeyModal";
import { CreateAlertModal } from "./modals/CreateAlertModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "../ui/error-boundary";
import { LoadingOverlay, LoadingState } from "../ui/loading-spinner";
import { ErrorMessage } from "../ui/error-message";
import { 
  LayoutDashboard, 
  Key, 
  BarChart3, 
  Bell, 
  Crown,
  RefreshCw,
  Plus
} from "lucide-react";

export function ModernDashboard() {
  const {
    apiKeys,
    alerts,
    usageSummary,
    user,
    isLoading,
    setApiKeys,
    setAlerts,
    setUsageSummary,
    setUser,
    setLoading
  } = useDashboardStore();

  const { 
    fetchApiKeys, 
    deleteApiKey, 
    fetchUsageSummary, 
    createAlert,
    fetchUserProfile,
    createCheckoutSession,
    createPortalSession,
    fetchUsageAnalytics
  } = useApi();
  
  // API Key Management
  const {
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedApiKey,
    isLoading: isApiKeyLoading,
    handleAddApiKey,
    handleEditApiKey,
    handleDeleteApiKey,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
  } = useApiKeyManagement();
  
  // Alert Management
  const {
    isCreateModalOpen,
    isLoading: isAlertLoading,
    handleCreateAlert,
    handleUpdateAlert,
    handleDeleteAlert,
    openCreateModal,
    closeCreateModal,
  } = useAlertManagement();

  const [activeTab, setActiveTab] = useState("overview");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [selectedApiKeyForAnalytics, setSelectedApiKeyForAnalytics] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [realTimeEnabled, setRealTimeEnabled] = useState(true);

  // Real-time updates
  const { isUpdating, forceUpdate } = useRealTimeUpdates({
    interval: 30000, // 30 seconds
    enabled: realTimeEnabled,
    onError: (error) => {
      console.error('Real-time update error:', error);
      setError(`Real-time update failed: ${error}`);
    }
  });

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [keysData, summaryData, userData, analyticsResult] = await Promise.all([
        fetchApiKeys(),
        fetchUsageSummary(),
        fetchUserProfile(),
        fetchUsageAnalytics(30, selectedApiKeyForAnalytics)
      ]);

      if (keysData.success && keysData.data) {
        setApiKeys(keysData.data);
      } else if (!keysData.success) {
        console.error('Failed to fetch API keys:', keysData.error);
      }

      if (summaryData.success && summaryData.data) {
        setUsageSummary(summaryData.data);
      } else if (!summaryData.success) {
        console.error('Failed to fetch usage summary:', summaryData.error);
      }

      if (userData.success && userData.data) {
        setUser(userData.data);
      } else if (!userData.success) {
        console.error('Failed to fetch user data:', userData.error);
      }

      if (analyticsResult.success && analyticsResult.data) {
        setAnalyticsData(analyticsResult.data);
      } else if (!analyticsResult.success) {
        console.error('Failed to fetch analytics:', analyticsResult.error);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const toggleRealTimeUpdates = () => {
    setRealTimeEnabled(!realTimeEnabled);
  };

  const handleAddApiKeyClick = () => {
    openAddModal();
  };

  const handleEditApiKeyClick = (keyId: string) => {
    const apiKey = apiKeys.find(key => key.id === keyId);
    if (apiKey) {
      openEditModal(apiKey);
    }
  };

  const handleDeleteApiKeyClick = (keyId: string) => {
    const apiKey = apiKeys.find(key => key.id === keyId);
    if (apiKey) {
      openDeleteModal(apiKey);
    }
  };

  const handleViewAnalytics = async (keyId: string) => {
    setSelectedApiKeyForAnalytics(keyId);
    setActiveTab("analytics");
    
    // Fetch analytics data for the specific API key
    const analyticsResult = await fetchUsageAnalytics(30, keyId);
    if (analyticsResult.success && analyticsResult.data) {
      setAnalyticsData(analyticsResult.data);
    }
  };

  const handleManageAlerts = (keyId: string) => {
    setActiveTab("alerts");
    // TODO: Filter alerts by specific API key
  };

  const handleCreateAlertClick = () => {
    openCreateModal();
  };

  const handleUpgrade = async (plan: 'Pro' | 'Team') => {
    try {
      const result = await createCheckoutSession(plan);
      if (result.success && result.data) {
        window.location.href = result.data.checkoutUrl;
      }
    } catch (error) {
      console.error('Failed to create checkout session:', error);
    }
  };

  const handleManageBilling = async () => {
    try {
      const result = await createPortalSession();
      if (result.success && result.data) {
        window.location.href = result.data.portalUrl;
      }
    } catch (error) {
      console.error('Failed to create portal session:', error);
    }
  };

  // Calculate overview metrics
  const totalSpend = usageSummary?.totalCost || usageSummary?.currentMonth?.totalCost || 0;
  const budgetLimit = user?.budgetLimit || 100;
  const remainingBudget = budgetLimit - totalSpend;
  const budgetUsedPercent = (totalSpend / budgetLimit) * 100;
  const moneySaved = usageSummary?.moneySaved || 0;
  const mostExpensiveEndpoint = usageSummary?.mostExpensiveEndpoint || null;
  const isOverBudget = budgetUsedPercent >= 90;

  // Use analytics data if available, otherwise fallback to usage summary
  const usageData = analyticsData?.dailyUsage || usageSummary?.dailyUsage || [];
  const providerBreakdown = analyticsData?.providerBreakdown || usageSummary?.providerBreakdown || [];
  
  // Ensure we have valid data arrays
  const safeUsageData = Array.isArray(usageData) ? usageData : [];
  const safeProviderBreakdown = Array.isArray(providerBreakdown) ? providerBreakdown : [];

  // Mock subscription data (replace with real data)
  const currentPlan = {
    name: user?.subscriptionPlan || 'Free',
    tier: (user?.subscriptionPlan?.toLowerCase() || 'free') as 'free' | 'pro' | 'team',
    price: user?.subscriptionPlan === 'Pro' ? 29 : user?.subscriptionPlan === 'Team' ? 99 : 0,
    billingCycle: 'monthly' as const,
    features: [
      user?.subscriptionPlan === 'Free' ? '3 API Keys' : 'Unlimited API Keys',
      user?.subscriptionPlan === 'Free' ? '10K requests/month' : 'Unlimited requests',
      user?.subscriptionPlan === 'Free' ? '3 alerts' : 'Unlimited alerts',
      user?.subscriptionPlan === 'Free' ? '30 days retention' : '1 year retention'
    ],
    limits: {
      apiKeys: user?.subscriptionPlan === 'Free' ? 3 : 999,
      monthlyRequests: user?.subscriptionPlan === 'Free' ? 10000 : 999999,
      alerts: user?.subscriptionPlan === 'Free' ? 3 : 999,
      dataRetention: user?.subscriptionPlan === 'Free' ? 30 : 365
    },
    usage: {
      apiKeys: apiKeys.length,
      monthlyRequests: usageSummary?.totalRequests || 0,
      alerts: alerts.length
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingState text="Loading your dashboard..." className="text-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <ErrorMessage
          title="Dashboard Error"
          message={error}
          onRetry={loadDashboardData}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-gray-300 mt-1">
                Monitor your AI API usage, costs, and optimize your spending
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={toggleRealTimeUpdates}
                className={`flex items-center gap-2 ${realTimeEnabled ? 'bg-green-50 border-green-200 text-green-700' : ''}`}
              >
                <div className={`w-2 h-2 rounded-full ${realTimeEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                {realTimeEnabled ? 'Live' : 'Manual'}
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing || isUpdating}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${(isRefreshing || isUpdating) ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleAddApiKeyClick} className="flex items-center gap-2 bg-white text-black hover:bg-gray-100">
                <Plus className="w-4 h-4" />
                Add Your First API Key
              </Button>
            </div>
          </motion.div>

        {/* Dashboard Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <DashboardOverview
            totalSpend={totalSpend}
            budgetLimit={budgetLimit}
            remainingBudget={remainingBudget}
            budgetUsedPercent={budgetUsedPercent}
            moneySaved={moneySaved}
            mostExpensiveEndpoint={mostExpensiveEndpoint}
            isOverBudget={isOverBudget}
          />
        </motion.div>

        {/* Main Content Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="keys" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span className="hidden sm:inline">API Keys</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Alerts</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                <span className="hidden sm:inline">Plan</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ApiKeysTable
                  apiKeys={apiKeys.slice(0, 3)} // Show only first 3 in overview
                  onAddKey={handleAddApiKeyClick}
                  onEditKey={handleEditApiKeyClick}
                  onDeleteKey={handleDeleteApiKeyClick}
                  onViewAnalytics={handleViewAnalytics}
                  onManageAlerts={handleManageAlerts}
                />
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common tasks and shortcuts
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("keys")}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Manage API Keys
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("alerts")}
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Set Up Alerts
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setActiveTab("analytics")}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Analytics
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => handleUpgrade('Pro')}
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade Plan
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="keys">
              <LoadingOverlay isLoading={isApiKeyLoading}>
                <ApiKeysTable
                  apiKeys={apiKeys}
                  onAddKey={handleAddApiKeyClick}
                  onEditKey={handleEditApiKeyClick}
                  onDeleteKey={handleDeleteApiKeyClick}
                  onViewAnalytics={handleViewAnalytics}
                  onManageAlerts={handleManageAlerts}
                />
              </LoadingOverlay>
            </TabsContent>

            <TabsContent value="analytics">
              <LoadingOverlay isLoading={isRefreshing} text="Updating analytics...">
                <UsageAnalytics
                  usageData={safeUsageData}
                  providerBreakdown={safeProviderBreakdown}
                  totalRequests={analyticsData?.totals?.requests || usageSummary?.totalRequests || usageSummary?.currentMonth?.totalRequests || 0}
                  totalTokens={analyticsData?.totals?.tokens || usageSummary?.totalTokens || usageSummary?.currentMonth?.totalTokens || 0}
                  totalCost={analyticsData?.totals?.cost || totalSpend}
                  averageCostPerRequest={analyticsData?.totals?.averageCostPerRequest || usageSummary?.averageCostPerRequest || 0}
                  costTrend={analyticsData?.trends?.costTrend || usageSummary?.costTrend || 0}
                  tokenTrend={analyticsData?.trends?.tokenTrend || usageSummary?.tokenTrend || 0}
                />
              </LoadingOverlay>
            </TabsContent>

            <TabsContent value="alerts">
              <LoadingOverlay isLoading={isAlertLoading}>
                <AlertsManager
                  alerts={alerts.map(alert => ({
                    ...alert,
                    thresholdType: alert.thresholdType || 'cost',
                    isActive: alert.isActive ?? true
                  }))}
                  onCreateAlert={handleCreateAlertClick}
                  onUpdateAlert={handleUpdateAlert}
                  onDeleteAlert={handleDeleteAlert}
                />
              </LoadingOverlay>
            </TabsContent>

            <TabsContent value="subscription">
              <SubscriptionInfo
                currentPlan={currentPlan}
                onUpgrade={handleUpgrade}
                onManageBilling={handleManageBilling}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Modals */}
      <AddApiKeyModal
        isOpen={isAddModalOpen}
        onClose={closeAddModal}
        onSubmit={handleAddApiKey}
        isLoading={isApiKeyLoading}
      />

      <EditApiKeyModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleEditApiKey}
        apiKey={selectedApiKey}
        isLoading={isApiKeyLoading}
      />

      <DeleteApiKeyModal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteApiKey}
        apiKey={selectedApiKey}
        isLoading={isApiKeyLoading}
      />

      <CreateAlertModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreateAlert}
        isLoading={isAlertLoading}
      />
      </div>
    </ErrorBoundary>
  );
}

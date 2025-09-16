"use client";

import { useState } from "react";
import { useApi } from "./useApi";
import { useDashboardStore } from "../stores/dashboard-store";
import { AlertFormData } from "../components/Dashboard/modals/CreateAlertModal";

export function useAlertManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { createAlert, updateAlert, deleteAlert } = useApi();
  const { alerts, setAlerts } = useDashboardStore();

  const handleCreateAlert = async (data: AlertFormData) => {
    setIsLoading(true);
    try {
      const result = await createAlert(data);
      if (result.success && result.data) {
        setAlerts([...alerts, result.data]);
        setIsCreateModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateAlert = async (alertId: string, updates: Partial<AlertFormData>) => {
    setIsLoading(true);
    try {
      const result = await updateAlert(alertId, updates);
      if (result.success && result.data) {
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, ...result.data } : alert
        ));
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteAlert(alertId);
      if (result.success) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to delete alert:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  return {
    // Modal states
    isCreateModalOpen,
    isLoading,

    // Actions
    handleCreateAlert,
    handleUpdateAlert,
    handleDeleteAlert,

    // Modal controls
    openCreateModal,
    closeCreateModal,
  };
}

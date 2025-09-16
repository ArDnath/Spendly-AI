"use client";

import { useState } from "react";
import { useApi } from "./useApi";
import { useDashboardStore } from "../stores/dashboard-store";
import { ApiKeyFormData } from "../components/Dashboard/modals/AddApiKeyModal";
import { EditApiKeyFormData } from "../components/Dashboard/modals/EditApiKeyModal";

export function useApiKeyManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { createApiKey, updateApiKey, deleteApiKey } = useApi();
  const { apiKeys, setApiKeys } = useDashboardStore();

  const handleAddApiKey = async (data: ApiKeyFormData) => {
    setIsLoading(true);
    try {
      const result = await createApiKey(data);
      if (result.success && result.data) {
        setApiKeys([...apiKeys, result.data]);
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to add API key:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditApiKey = async (keyId: string, data: EditApiKeyFormData) => {
    setIsLoading(true);
    try {
      const result = await updateApiKey(keyId, data);
      if (result.success && result.data) {
        setApiKeys(apiKeys.map(key => 
          key.id === keyId ? { ...key, ...result.data } : key
        ));
        setIsEditModalOpen(false);
        setSelectedApiKey(null);
      }
    } catch (error) {
      console.error('Failed to update API key:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    setIsLoading(true);
    try {
      const result = await deleteApiKey(keyId);
      if (result.success) {
        setApiKeys(apiKeys.filter(key => key.id !== keyId));
        setIsDeleteModalOpen(false);
        setSelectedApiKey(null);
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => setIsAddModalOpen(true);
  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (apiKey: any) => {
    setSelectedApiKey(apiKey);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedApiKey(null);
  };

  const openDeleteModal = (apiKey: any) => {
    setSelectedApiKey(apiKey);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSelectedApiKey(null);
  };

  return {
    // Modal states
    isAddModalOpen,
    isEditModalOpen,
    isDeleteModalOpen,
    selectedApiKey,
    isLoading,

    // Actions
    handleAddApiKey,
    handleEditApiKey,
    handleDeleteApiKey,

    // Modal controls
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
  };
}

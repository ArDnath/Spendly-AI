"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Edit, AlertTriangle } from "lucide-react";

interface EditApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (keyId: string, data: EditApiKeyFormData) => Promise<void>;
  apiKey: ApiKeyData | null;
  isLoading?: boolean;
}

export interface ApiKeyData {
  id: string;
  provider: string;
  name: string;
  description?: string;
  status: string;
  createdAt: string;
  lastUsed?: string;
}

export interface EditApiKeyFormData {
  name: string;
  description?: string;
}

const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case 'openai': return '🤖';
    case 'anthropic': return '🧠';
    case 'google': return '🔍';
    case 'cohere': return '⚡';
    default: return '🔑';
  }
};

export function EditApiKeyModal({ isOpen, onClose, onSubmit, apiKey, isLoading }: EditApiKeyModalProps) {
  const [formData, setFormData] = useState<EditApiKeyFormData>({
    name: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (apiKey) {
      setFormData({
        name: apiKey.name || '',
        description: apiKey.description || ''
      });
    }
  }, [apiKey]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !apiKey) return;

    try {
      await onSubmit(apiKey.id, formData);
      handleClose();
    } catch (error) {
      console.error('Failed to update API key:', error);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setErrors({});
    onClose();
  };

  if (!apiKey) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Edit className="w-5 h-5" />
            Edit API Key
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Update the details for your API key
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
            <span className="text-2xl">{getProviderIcon(apiKey.provider)}</span>
            <div>
              <h4 className="font-medium text-white">{apiKey.provider}</h4>
              <p className="text-sm text-gray-400">
                Added {new Date(apiKey.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge 
              className={`ml-auto ${
                apiKey.status === 'active' 
                  ? 'bg-green-900/20 text-green-400 border-green-500/30' 
                  : 'bg-gray-800 text-gray-300 border-gray-600'
              }`}
            >
              {apiKey.status}
            </Badge>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-300">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="e.g., Production OpenAI Key"
              className="bg-gray-900 border-gray-700 text-white"
            />
            {errors.name && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of how this key is used"
              className="bg-gray-900 border-gray-700 text-white"
            />
          </div>

          {/* Last Used Info */}
          {apiKey.lastUsed && (
            <div className="text-sm text-gray-400">
              Last used: {new Date(apiKey.lastUsed).toLocaleString()}
            </div>
          )}

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
              {isLoading ? 'Updating...' : 'Update API Key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

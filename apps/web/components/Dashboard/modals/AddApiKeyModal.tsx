"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Key, AlertTriangle } from "lucide-react";

interface AddApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ApiKeyFormData) => Promise<void>;
  isLoading?: boolean;
}

export interface ApiKeyFormData {
  provider: string;
  apiKey: string;
  name?: string;
  description?: string;
}

const PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    icon: '🤖',
    description: 'GPT-4, GPT-3.5, DALL-E, Whisper',
    keyFormat: 'sk-...'
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    icon: '🧠',
    description: 'Claude 3, Claude 2',
    keyFormat: 'sk-ant-...'
  },
  { 
    id: 'google', 
    name: 'Google AI', 
    icon: '🔍',
    description: 'Gemini, PaLM',
    keyFormat: 'AIza...'
  },
  { 
    id: 'cohere', 
    name: 'Cohere', 
    icon: '⚡',
    description: 'Command, Embed, Classify',
    keyFormat: 'co-...'
  }
];

export function AddApiKeyModal({ isOpen, onClose, onSubmit, isLoading }: AddApiKeyModalProps) {
  const [formData, setFormData] = useState<ApiKeyFormData>({
    provider: '',
    apiKey: '',
    name: '',
    description: ''
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProvider = PROVIDERS.find(p => p.id === formData.provider);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.provider) {
      newErrors.provider = 'Please select a provider';
    }

    if (!formData.apiKey.trim()) {
      newErrors.apiKey = 'API key is required';
    } else if (formData.apiKey.length < 10) {
      newErrors.apiKey = 'API key appears to be too short';
    }

    if (!formData.name?.trim()) {
      newErrors.name = 'Please provide a name for this API key';
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
      console.error('Failed to add API key:', error);
    }
  };

  const handleClose = () => {
    setFormData({ provider: '', apiKey: '', name: '', description: '' });
    setErrors({});
    setShowApiKey(false);
    onClose();
  };

  const handleProviderChange = (provider: string) => {
    setFormData(prev => ({ 
      ...prev, 
      provider,
      name: prev.name || `${PROVIDERS.find(p => p.id === provider)?.name} Key`
    }));
    if (errors.provider) {
      setErrors(prev => ({ ...prev, provider: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Key className="w-5 h-5" />
            Add New API Key
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Add a new AI provider API key to start monitoring usage and costs
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <Label htmlFor="provider" className="text-gray-300">Provider *</Label>
            <Select value={formData.provider} onValueChange={handleProviderChange}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {PROVIDERS.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id} className="text-white hover:bg-gray-800">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{provider.icon}</span>
                      <div>
                        <div className="font-medium">{provider.name}</div>
                        <div className="text-xs text-gray-400">{provider.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.provider && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.provider}
              </p>
            )}
          </div>

          {/* Provider Info Card */}
          {selectedProvider && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{selectedProvider.icon}</span>
                    <div>
                      <h4 className="font-medium text-white">{selectedProvider.name}</h4>
                      <p className="text-sm text-gray-400">{selectedProvider.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                    Format: {selectedProvider.keyFormat}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* API Key Input */}
          <div className="space-y-2">
            <Label htmlFor="apiKey" className="text-gray-300">API Key *</Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={formData.apiKey}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, apiKey: e.target.value }));
                  if (errors.apiKey) setErrors(prev => ({ ...prev, apiKey: '' }));
                }}
                placeholder={selectedProvider?.keyFormat || "Enter your API key"}
                className="bg-gray-900 border-gray-700 text-white pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-white"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            {errors.apiKey && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.apiKey}
              </p>
            )}
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
              {isLoading ? 'Adding...' : 'Add API Key'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

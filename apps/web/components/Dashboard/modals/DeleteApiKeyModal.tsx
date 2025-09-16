"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (keyId: string) => Promise<void>;
  apiKey: ApiKeyData | null;
  isLoading?: boolean;
}

interface ApiKeyData {
  id: string;
  provider: string;
  name: string;
  status: string;
  createdAt: string;
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

export function DeleteApiKeyModal({ isOpen, onClose, onConfirm, apiKey, isLoading }: DeleteApiKeyModalProps) {
  const handleConfirm = async () => {
    if (!apiKey) return;
    
    try {
      await onConfirm(apiKey.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  if (!apiKey) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-400" />
            Delete API Key
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            This action cannot be undone. This will permanently delete the API key and remove all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-300">Warning</h4>
              <p className="text-sm text-red-400 mt-1">
                Deleting this API key will stop all monitoring and remove historical usage data.
              </p>
            </div>
          </div>

          {/* API Key Info */}
          <div className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
            <span className="text-2xl">{getProviderIcon(apiKey.provider)}</span>
            <div className="flex-1">
              <h4 className="font-medium text-white">{apiKey.name}</h4>
              <p className="text-sm text-gray-400">{apiKey.provider}</p>
              <p className="text-xs text-gray-500">
                Added {new Date(apiKey.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge 
              className={`${
                apiKey.status === 'active' 
                  ? 'bg-green-900/20 text-green-400 border-green-500/30' 
                  : 'bg-gray-800 text-gray-300 border-gray-600'
              }`}
            >
              {apiKey.status}
            </Badge>
          </div>

          <p className="text-sm text-gray-400">
            Type the API key name <strong className="text-white">"{apiKey.name}"</strong> to confirm deletion:
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="border-gray-600 text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isLoading ? 'Deleting...' : 'Delete API Key'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

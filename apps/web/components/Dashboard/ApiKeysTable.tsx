"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  AlertCircle,
  Activity,
  DollarSign,
  Zap,
  Eye,
  Settings
} from "lucide-react";

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

interface ApiKeysTableProps {
  apiKeys: ApiKey[];
  onAddKey: () => void;
  onEditKey: (keyId: string) => void;
  onDeleteKey: (keyId: string) => void;
  onViewAnalytics: (keyId: string) => void;
  onManageAlerts: (keyId: string) => void;
}

export function ApiKeysTable({
  apiKeys,
  onAddKey,
  onEditKey,
  onDeleteKey,
  onViewAnalytics,
  onManageAlerts
}: ApiKeysTableProps) {
  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        return '🤖';
      case 'anthropic':
        return '🧠';
      case 'google':
        return '🔍';
      default:
        return '⚡';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return '-';
    return `$${amount.toFixed(2)}`;
  };

  const formatTokens = (tokens?: number) => {
    if (tokens === undefined) return '-';
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              API Keys Management
            </CardTitle>
            <CardDescription>
              Manage your API keys, monitor usage, and configure alerts
            </CardDescription>
          </div>
          <Button onClick={onAddKey} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add API Key
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
            <p className="text-gray-500 mb-4">
              Add your first API key to start monitoring your AI usage
            </p>
            <Button onClick={onAddKey} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Your First API Key
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Daily Tokens</TableHead>
                  <TableHead className="text-right">Daily Cost</TableHead>
                  <TableHead className="text-center">Alerts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey, index) => (
                  <motion.tr
                    key={apiKey.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="group hover:bg-gray-50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getProviderIcon(apiKey.provider)}</span>
                        <div>
                          <div className="font-medium">{apiKey.provider}</div>
                          <div className="text-sm text-gray-500">
                            Added {new Date(apiKey.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(apiKey.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Activity className="w-4 h-4 text-gray-400" />
                        <span className="font-mono">{formatTokens(apiKey.dailyTokens)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-mono">{formatCurrency(apiKey.dailyCost)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                        <span>{apiKey.alerts?.length || 0}</span>
                        {apiKey.alerts?.some(alert => alert.isActive) && (
                          <div className="w-2 h-2 bg-green-500 rounded-full ml-1" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewAnalytics(apiKey.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewAnalytics(apiKey.id)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onManageAlerts(apiKey.id)}>
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Manage Alerts
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditKey(apiKey.id)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Key
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteKey(apiKey.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Key
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

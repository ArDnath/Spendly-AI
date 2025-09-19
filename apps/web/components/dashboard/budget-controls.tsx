'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/components/ui/card';
import { Button } from '@repo/ui/components/ui/button';
import { Input } from '@repo/ui/components/ui/input';
import { Label } from '@repo/ui/components/ui/label';
import { Switch } from '@repo/ui/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select';
import { Badge } from '@repo/ui/components/ui/badge';
import { Progress } from '@repo/ui/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/components/ui/dialog';
import { AlertTriangle, Plus, Shield, ShieldAlert, Edit, Trash2, DollarSign } from 'lucide-react';
import { useToast } from '@repo/ui/components/ui/use-toast';

interface BudgetControlsProps {
  className?: string;
}

interface Budget {
  id: string;
  name: string;
  amount: number;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  scope: 'USER' | 'PROJECT' | 'ORGANIZATION';
  hardLimit: boolean;
  isActive: boolean;
  currentUsage: number;
  percentage: number;
  projectId?: string;
  projectName?: string;
  organizationId?: string;
  organizationName?: string;
}

interface Project {
  id: string;
  name: string;
  organizationId?: string;
  organizationName?: string;
}

export function BudgetControls({ className }: BudgetControlsProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    period: 'MONTHLY' as const,
    scope: 'USER' as const,
    hardLimit: false,
    projectId: '',
    organizationId: ''
  });

  useEffect(() => {
    fetchBudgets();
    fetchProjects();
  }, []);

  const fetchBudgets = async () => {
    try {
      const response = await fetch('/api/budgets');
      if (response.ok) {
        const data = await response.json();
        setBudgets(data.budgets);
      }
    } catch (error) {
      console.error('Failed to fetch budgets:', error);
      toast({
        title: "Error",
        description: "Failed to load budgets",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  };

  const handleCreateBudget = async () => {
    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        period: formData.period,
        scope: formData.scope,
        hardLimit: formData.hardLimit,
        ...(formData.scope === 'PROJECT' && formData.projectId && { projectId: formData.projectId }),
        ...(formData.scope === 'ORGANIZATION' && formData.organizationId && { organizationId: formData.organizationId })
      };

      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchBudgets();
        setIsCreateDialogOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: "Budget created successfully"
        });
      } else {
        throw new Error('Failed to create budget');
      }
    } catch (error) {
      console.error('Failed to create budget:', error);
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBudget = async () => {
    if (!editingBudget) return;

    try {
      const payload = {
        name: formData.name,
        amount: parseFloat(formData.amount),
        period: formData.period,
        hardLimit: formData.hardLimit
      };

      const response = await fetch(`/api/budgets/${editingBudget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        await fetchBudgets();
        setEditingBudget(null);
        resetForm();
        toast({
          title: "Success",
          description: "Budget updated successfully"
        });
      } else {
        throw new Error('Failed to update budget');
      }
    } catch (error) {
      console.error('Failed to update budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive"
      });
    }
  };

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchBudgets();
        toast({
          title: "Success",
          description: "Budget deleted successfully"
        });
      } else {
        throw new Error('Failed to delete budget');
      }
    } catch (error) {
      console.error('Failed to delete budget:', error);
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive"
      });
    }
  };

  const handleToggleBudget = async (budgetId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        await fetchBudgets();
        toast({
          title: "Success",
          description: `Budget ${isActive ? 'activated' : 'deactivated'}`
        });
      }
    } catch (error) {
      console.error('Failed to toggle budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      period: 'MONTHLY',
      scope: 'USER',
      hardLimit: false,
      projectId: '',
      organizationId: ''
    });
  };

  const openEditDialog = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      name: budget.name,
      amount: budget.amount.toString(),
      period: budget.period,
      scope: budget.scope,
      hardLimit: budget.hardLimit,
      projectId: budget.projectId || '',
      organizationId: budget.organizationId || ''
    });
  };

  const getBudgetStatus = (budget: Budget) => {
    if (budget.percentage >= 100) return { variant: 'destructive' as const, label: 'Exceeded' };
    if (budget.percentage >= 90) return { variant: 'destructive' as const, label: 'Critical' };
    if (budget.percentage >= 75) return { variant: 'secondary' as const, label: 'Warning' };
    return { variant: 'default' as const, label: 'Good' };
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-muted rounded w-32 mb-2"></div>
          <div className="h-4 bg-muted rounded w-48"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Budget Controls
            </CardTitle>
            <CardDescription>
              Set spending limits and prevent unexpected bills
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Budget</DialogTitle>
                <DialogDescription>
                  Set spending limits to control your AI usage costs
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Budget Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Monthly Development Budget"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="100.00"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="period">Period</Label>
                  <Select value={formData.period} onValueChange={(value: any) => setFormData({ ...formData, period: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="scope">Scope</Label>
                  <Select value={formData.scope} onValueChange={(value: any) => setFormData({ ...formData, scope: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">All Usage</SelectItem>
                      <SelectItem value="PROJECT">Specific Project</SelectItem>
                      <SelectItem value="ORGANIZATION">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.scope === 'PROJECT' && (
                  <div className="grid gap-2">
                    <Label htmlFor="project">Project</Label>
                    <Select value={formData.projectId} onValueChange={(value) => setFormData({ ...formData, projectId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hardLimit"
                    checked={formData.hardLimit}
                    onCheckedChange={(checked) => setFormData({ ...formData, hardLimit: checked })}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="hardLimit" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Hard Limit
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Block API calls when budget is exceeded (requires proxy mode)
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateBudget} disabled={!formData.name || !formData.amount}>
                  Create Budget
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No budgets set</h3>
              <p className="text-muted-foreground mb-4">
                Create your first budget to control spending and prevent unexpected bills
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>
          ) : (
            budgets.map((budget) => {
              const status = getBudgetStatus(budget);
              return (
                <div key={budget.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {budget.hardLimit ? (
                          <ShieldAlert className="h-4 w-4 text-red-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                        <h3 className="font-medium">{budget.name}</h3>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {!budget.isActive && <Badge variant="outline">Inactive</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={budget.isActive}
                        onCheckedChange={(checked) => handleToggleBudget(budget.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(budget)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteBudget(budget.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        {formatCurrency(budget.currentUsage)} / {formatCurrency(budget.amount)} 
                        <span className="text-muted-foreground ml-1">({budget.period.toLowerCase()})</span>
                      </span>
                      <span className="font-medium">{budget.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(budget.percentage, 100)} 
                      className="h-2"
                      indicatorClassName={
                        budget.percentage >= 100 ? 'bg-red-500' :
                        budget.percentage >= 90 ? 'bg-red-500' :
                        budget.percentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>Scope: {budget.scope}</span>
                      {budget.projectName && <span>Project: {budget.projectName}</span>}
                      {budget.organizationName && <span>Org: {budget.organizationName}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {budget.hardLimit && (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          Hard Limit
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={() => setEditingBudget(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Budget</DialogTitle>
            <DialogDescription>
              Update your budget settings
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Budget Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-amount">Amount ($)</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-period">Period</Label>
              <Select value={formData.period} onValueChange={(value: any) => setFormData({ ...formData, period: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="edit-hardLimit"
                checked={formData.hardLimit}
                onCheckedChange={(checked) => setFormData({ ...formData, hardLimit: checked })}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="edit-hardLimit" className="text-sm font-medium leading-none">
                  Hard Limit
                </Label>
                <p className="text-xs text-muted-foreground">
                  Block API calls when budget is exceeded
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBudget(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBudget} disabled={!formData.name || !formData.amount}>
              Update Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

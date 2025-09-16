"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from "@/components/ui/progress";
import { Badge } from "../ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Zap,
  PiggyBank
} from "lucide-react";

interface DashboardOverviewProps {
  totalSpend: number;
  budgetLimit: number;
  remainingBudget: number;
  budgetUsedPercent: number;
  moneySaved: number;
  mostExpensiveEndpoint: string | null;
  isOverBudget: boolean;
}

export function DashboardOverview({
  totalSpend,
  budgetLimit,
  remainingBudget,
  budgetUsedPercent,
  moneySaved,
  mostExpensiveEndpoint,
  isOverBudget
}: DashboardOverviewProps) {
  const getBudgetColor = () => {
    if (budgetUsedPercent >= 90) return "bg-red-500";
    if (budgetUsedPercent >= 75) return "bg-amber-500";
    return "bg-green-500";
  };

  const getBudgetTextColor = () => {
    if (budgetUsedPercent >= 90) return "text-red-600";
    if (budgetUsedPercent >= 75) return "text-amber-600";
    return "text-green-600";
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {isOverBudget && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="font-semibold text-red-300">Budget Alert</h3>
            <p className="text-red-800 font-medium">
              ⚠️ You're at {budgetUsedPercent.toFixed(0)}% of your budget
            </p>
            <p className="text-red-600 text-sm">
              Consider reviewing your API usage or increasing your budget limit.
            </p>
          </div>
        </motion.div>
      )}

      {/* Hero Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Spend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300">
                  You're on track to save $2,340 this month
                </CardTitle>
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${totalSpend.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {budgetUsedPercent.toFixed(1)}% of budget used
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Budget Progress
                </CardTitle>
                <Target className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold ${getBudgetTextColor()}`}>
                    {budgetUsedPercent.toFixed(0)}%
                  </span>
                  <p className="text-sm text-red-400">
                    ${budgetLimit.toFixed(0)} limit
                  </p>
                </div>
                <Progress 
                  value={Math.min(budgetUsedPercent, 100)} 
                  className="h-2"
                  indicatorClassName={getBudgetColor()}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Remaining Budget */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Remaining Budget
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${Math.max(remainingBudget, 0).toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {remainingBudget < 0 ? 'Over budget' : 'Available to spend'}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Money Saved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-gray-900 to-black border-gray-700">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-300">
                  Money Saved
                </CardTitle>
                <PiggyBank className="w-4 h-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">
                ${moneySaved.toFixed(2)}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Through optimization
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Most Expensive Endpoint Badge */}
      {mostExpensiveEndpoint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-2"
        >
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-gray-300">Most expensive endpoint:</span>
          <Badge variant="secondary" className="bg-gray-800 text-white border border-gray-600">
            {mostExpensiveEndpoint}
          </Badge>
        </motion.div>
      )}
    </div>
  );
}

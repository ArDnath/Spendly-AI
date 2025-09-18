import { prisma } from '@repo/db';
import { decrypt } from './encryption';
import { auditLogger } from './audit-logger';

/**
 * Reconciliation service for AI Spend Guard
 * Compares local usage tracking with OpenAI billing data
 */
export class ReconciliationService {
  /**
   * Reconcile usage data for a specific date range
   */
  static async reconcileUsageData(startDate: Date, endDate: Date): Promise<ReconciliationResult> {
    const results: ReconciliationResult = {
      totalReconciled: 0,
      discrepancies: [],
      errors: [],
      summary: {
        localCost: 0,
        openaiCost: 0,
        discrepancyAmount: 0,
        discrepancyPercentage: 0,
      },
    };

    try {
      // Get all active OpenAI API keys
      const apiKeys = await prisma.apiKey.findMany({
        where: {
          status: 'active',
          provider: 'openai',
        },
        include: {
          user: true,
        },
      });

      for (const apiKey of apiKeys) {
        try {
          const keyResult = await this.reconcileApiKey(apiKey, startDate, endDate);
          results.totalReconciled++;
          
          if (keyResult.discrepancy) {
            results.discrepancies.push(keyResult.discrepancy);
          }

          results.summary.localCost += keyResult.localCost;
          results.summary.openaiCost += keyResult.openaiCost;

        } catch (error) {
          results.errors.push({
            apiKeyId: apiKey.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Calculate overall discrepancy
      results.summary.discrepancyAmount = Math.abs(
        results.summary.localCost - results.summary.openaiCost
      );
      
      if (results.summary.openaiCost > 0) {
        results.summary.discrepancyPercentage = 
          (results.summary.discrepancyAmount / results.summary.openaiCost) * 100;
      }

      // Log reconciliation results
      await auditLogger.log({
        userId: 'system',
        action: 'reconciliation_completed',
        details: {
          dateRange: { startDate, endDate },
          totalReconciled: results.totalReconciled,
          discrepancies: results.discrepancies.length,
          errors: results.errors.length,
          summary: results.summary,
        },
      });

      return results;

    } catch (error) {
      console.error('Reconciliation failed:', error);
      throw error;
    }
  }

  /**
   * Reconcile usage data for a single API key
   */
  private static async reconcileApiKey(
    apiKey: any,
    startDate: Date,
    endDate: Date
  ): Promise<ApiKeyReconciliationResult> {
    // Get local usage data
    const localUsage = await prisma.usage.aggregate({
      where: {
        apiKeyId: apiKey.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        cost: true,
        inputTokens: true,
        outputTokens: true,
        totalTokens: true,
        requests: true,
      },
    });

    const localCost = localUsage._sum.cost || 0;
    const localTokens = localUsage._sum.totalTokens || 0;
    const localRequests = localUsage._sum.requests || 0;

    // TODO: Fetch actual usage from OpenAI API
    // This would require implementing OpenAI's usage API
    // For now, we'll simulate the OpenAI data
    const openaiCost = await this.fetchOpenAIUsageCost(apiKey, startDate, endDate);

    const result: ApiKeyReconciliationResult = {
      apiKeyId: apiKey.id,
      localCost,
      openaiCost,
      localTokens,
      localRequests,
    };

    // Check for significant discrepancies (>2%)
    const discrepancyAmount = Math.abs(localCost - openaiCost);
    const discrepancyPercentage = openaiCost > 0 ? (discrepancyAmount / openaiCost) * 100 : 0;

    if (discrepancyPercentage > 2) {
      result.discrepancy = {
        apiKeyId: apiKey.id,
        userId: apiKey.userId,
        localCost,
        openaiCost,
        discrepancyAmount,
        discrepancyPercentage,
        dateRange: { startDate, endDate },
      };

      // Log significant discrepancy
      await auditLogger.log({
        userId: apiKey.userId,
        action: 'reconciliation_discrepancy',
        resource: apiKey.id,
        details: {
          discrepancy: result.discrepancy,
          resourceType: 'api_key',
        },
      });
    }

    return result;
  }

  /**
   * Fetch usage cost from OpenAI API
   * TODO: Implement actual OpenAI usage API integration
   */
  private static async fetchOpenAIUsageCost(
    apiKey: any,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    try {
      // Decrypt the API key
      const decryptedKey = decrypt(apiKey.encryptedKey);

      // TODO: Make actual API call to OpenAI usage endpoint
      // const response = await fetch('https://api.openai.com/v1/usage', {
      //   headers: {
      //     'Authorization': `Bearer ${decryptedKey}`,
      //     'Content-Type': 'application/json',
      //   },
      //   method: 'GET',
      // });

      // For now, return 0 as placeholder
      // In production, this would parse the OpenAI response and return actual cost
      return 0;

    } catch (error) {
      console.error(`Failed to fetch OpenAI usage for key ${apiKey.id}:`, error);
      return 0;
    }
  }

  /**
   * Get reconciliation history
   */
  static async getReconciliationHistory(
    userId?: string,
    limit: number = 30
  ): Promise<ReconciliationHistoryItem[]> {
    const where: any = {
      action: 'reconciliation_completed',
    };

    if (userId) {
      where.userId = userId;
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(log => ({
      id: log.id,
      date: log.createdAt,
      summary: log.details?.summary || {},
      discrepancies: log.details?.discrepancies || 0,
      errors: log.details?.errors || 0,
    }));
  }

  /**
   * Get current reconciliation status
   */
  static async getReconciliationStatus(): Promise<ReconciliationStatus> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if reconciliation ran yesterday
    const lastReconciliation = await prisma.auditLog.findFirst({
      where: {
        action: 'reconciliation_completed',
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const status: ReconciliationStatus = {
      lastRun: lastReconciliation?.createdAt || null,
      isUpToDate: !!lastReconciliation,
      pendingDays: lastReconciliation ? 0 : 1,
    };

    if (lastReconciliation?.details?.summary) {
      status.lastSummary = lastReconciliation.details.summary;
    }

    return status;
  }
}

// Types
export interface ReconciliationResult {
  totalReconciled: number;
  discrepancies: ReconciliationDiscrepancy[];
  errors: ReconciliationError[];
  summary: {
    localCost: number;
    openaiCost: number;
    discrepancyAmount: number;
    discrepancyPercentage: number;
  };
}

export interface ApiKeyReconciliationResult {
  apiKeyId: string;
  localCost: number;
  openaiCost: number;
  localTokens: number;
  localRequests: number;
  discrepancy?: ReconciliationDiscrepancy;
}

export interface ReconciliationDiscrepancy {
  apiKeyId: string;
  userId: string;
  localCost: number;
  openaiCost: number;
  discrepancyAmount: number;
  discrepancyPercentage: number;
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface ReconciliationError {
  apiKeyId: string;
  error: string;
}

export interface ReconciliationHistoryItem {
  id: string;
  date: Date;
  summary: any;
  discrepancies: number;
  errors: number;
}

export interface ReconciliationStatus {
  lastRun: Date | null;
  isUpToDate: boolean;
  pendingDays: number;
  lastSummary?: any;
}

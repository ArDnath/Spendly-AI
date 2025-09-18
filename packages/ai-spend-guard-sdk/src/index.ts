import OpenAI from 'openai';

export interface SpendGuardConfig {
  apiKeyId: string;
  baseURL?: string;
  authToken?: string;
}

export interface UsageMetadata {
  cost: number;
  currentMonthTotal: number;
  apiKeyId: string;
  tracked: boolean;
}

export interface SpendGuardResponse extends OpenAI.Chat.Completions.ChatCompletion {
  spendly_metadata: UsageMetadata;
}

export class SpendGuardError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public reason?: string,
    public currentCost?: number,
    public projectedCost?: number
  ) {
    super(message);
    this.name = 'SpendGuardError';
  }
}

/**
 * AI Spend Guard SDK - Drop-in replacement for OpenAI SDK with usage tracking
 */
export class AISpendGuard {
  private config: SpendGuardConfig;
  private proxyBaseURL: string;

  constructor(config: SpendGuardConfig) {
    this.config = config;
    this.proxyBaseURL = config.baseURL || 'https://your-spendly-domain.com/api/proxy';
  }

  /**
   * Create a chat completion with usage tracking
   */
  async createChatCompletion(
    params: OpenAI.Chat.Completions.ChatCompletionCreateParams
  ): Promise<SpendGuardResponse> {
    try {
      const response = await fetch(`${this.proxyBaseURL}/openai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key-id': this.config.apiKeyId,
          ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` }),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 429) {
          throw new SpendGuardError(
            errorData.reason || 'Budget limit exceeded',
            429,
            errorData.reason,
            errorData.currentCost,
            errorData.projectedCost
          );
        }

        throw new SpendGuardError(
          errorData.error || `HTTP ${response.status}`,
          response.status
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SpendGuardError) {
        throw error;
      }
      throw new SpendGuardError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get current usage statistics
   */
  async getUsageStats(period: 'daily' | 'weekly' | 'monthly' = 'monthly') {
    try {
      const response = await fetch(
        `${this.proxyBaseURL.replace('/proxy', '')}/analytics/projections?period=${period}&apiKeyId=${this.config.apiKeyId}`,
        {
          headers: {
            ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` }),
          },
        }
      );

      if (!response.ok) {
        throw new SpendGuardError(`Failed to fetch usage stats: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SpendGuardError) {
        throw error;
      }
      throw new SpendGuardError(
        `Failed to fetch usage stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create a budget for this API key
   */
  async createBudget(budget: {
    name: string;
    amount: number;
    period: 'daily' | 'weekly' | 'monthly';
    type: 'soft' | 'hard';
  }) {
    try {
      const response = await fetch(`${this.proxyBaseURL.replace('/proxy', '')}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` }),
        },
        body: JSON.stringify({
          ...budget,
          apiKeyId: this.config.apiKeyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SpendGuardError(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SpendGuardError) {
        throw error;
      }
      throw new SpendGuardError(
        `Failed to create budget: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create an alert for this API key
   */
  async createAlert(alert: {
    name: string;
    threshold: number;
    thresholdType: 'cost' | 'tokens' | 'requests';
    period: 'daily' | 'weekly' | 'monthly';
    notificationMethod: string; // e.g., "email" or "slack:webhook_url"
  }) {
    try {
      const response = await fetch(`${this.proxyBaseURL.replace('/proxy', '')}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.authToken && { 'Authorization': `Bearer ${this.config.authToken}` }),
        },
        body: JSON.stringify({
          ...alert,
          apiKeyId: this.config.apiKeyId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new SpendGuardError(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof SpendGuardError) {
        throw error;
      }
      throw new SpendGuardError(
        `Failed to create alert: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

/**
 * Factory function for easy initialization
 */
export function createSpendGuard(config: SpendGuardConfig): AISpendGuard {
  return new AISpendGuard(config);
}

// Export types
export type { SpendGuardConfig, UsageMetadata, SpendGuardResponse };

// Default export
export default AISpendGuard;

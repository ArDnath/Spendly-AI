/**
 * Circuit breaker implementation for external API calls
 * Provides fault tolerance and prevents cascading failures
 */
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 60000, // 1 minute
    private readonly monitoringWindow: number = 300000 // 5 minutes
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  /**
   * Check if we should attempt to reset the circuit breaker
   */
  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime >= this.recoveryTimeout
    );
  }

  /**
   * Get current circuit breaker state
   */
  getState(): { state: string; failureCount: number; lastFailureTime: number | null } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Reset circuit breaker manually
   */
  reset(): void {
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.state = 'CLOSED';
  }
}

/**
 * Circuit breaker instances for different services
 */
export const circuitBreakers = {
  openai: new CircuitBreaker(3, 30000, 300000), // 3 failures, 30s timeout
  stripe: new CircuitBreaker(5, 60000, 300000), // 5 failures, 1m timeout
  notifications: new CircuitBreaker(10, 120000, 600000), // 10 failures, 2m timeout
};

/**
 * Wrapper for OpenAI API calls with circuit breaker
 */
export async function withOpenAICircuitBreaker<T>(fn: () => Promise<T>): Promise<T> {
  return circuitBreakers.openai.execute(fn);
}

/**
 * Wrapper for Stripe API calls with circuit breaker
 */
export async function withStripeCircuitBreaker<T>(fn: () => Promise<T>): Promise<T> {
  return circuitBreakers.stripe.execute(fn);
}

/**
 * Wrapper for notification API calls with circuit breaker
 */
export async function withNotificationCircuitBreaker<T>(fn: () => Promise<T>): Promise<T> {
  return circuitBreakers.notifications.execute(fn);
}

/**
 * Get health status of all circuit breakers
 */
export function getCircuitBreakerHealth() {
  return {
    openai: circuitBreakers.openai.getState(),
    stripe: circuitBreakers.stripe.getState(),
    notifications: circuitBreakers.notifications.getState(),
  };
}

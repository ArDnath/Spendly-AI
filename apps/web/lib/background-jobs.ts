import { prisma } from '@repo/db';
import { fetchAndStoreUsageData, checkAndSendAlerts } from './openai-usage-fetcher';
import { initializeProviderRates } from './openai-pricing';

/**
 * Background job scheduler for AI Spend Guard
 * Handles usage fetching, alert checking, and reconciliation
 */
export class BackgroundJobScheduler {
  private intervals: NodeJS.Timeout[] = [];

  /**
   * Start all background jobs
   */
  start() {
    console.log('Starting AI Spend Guard background jobs...');

    // Daily usage fetch at 2 AM UTC
    this.scheduleDaily('02:00', async () => {
      console.log('Running daily usage fetch job...');
      await this.runUsageFetchJob();
    });

    // Alert checking every 6 hours
    this.scheduleInterval(6 * 60 * 60 * 1000, async () => {
      console.log('Running alert checking job...');
      await this.runAlertCheckJob();
    });

    // Priority alerts for Team/Advanced users every 2 hours
    this.scheduleInterval(2 * 60 * 60 * 1000, async () => {
      console.log('Running priority alert checking job...');
      await this.runPriorityAlertCheckJob();
    });

    // Daily reconciliation at 3 AM UTC
    this.scheduleDaily('03:00', async () => {
      console.log('Running daily reconciliation job...');
      await this.runReconciliationJob();
    });

    // Initialize provider rates on startup
    this.runOnce(async () => {
      console.log('Initializing provider rates...');
      await initializeProviderRates();
    });

    console.log('Background jobs started successfully');
  }

  /**
   * Stop all background jobs
   */
  stop() {
    console.log('Stopping background jobs...');
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    console.log('Background jobs stopped');
  }

  /**
   * Schedule a job to run daily at a specific time (UTC)
   */
  private scheduleDaily(time: string, job: () => Promise<void>) {
    const [hours, minutes] = time.split(':').map(Number);
    
    const runJob = async () => {
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setUTCHours(hours, minutes, 0, 0);
      
      // If scheduled time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setUTCDate(scheduledTime.getUTCDate() + 1);
      }
      
      const delay = scheduledTime.getTime() - now.getTime();
      
      setTimeout(async () => {
        try {
          await job();
        } catch (error) {
          console.error(`Daily job failed:`, error);
        }
        
        // Schedule next run (24 hours later)
        this.scheduleInterval(24 * 60 * 60 * 1000, job);
      }, delay);
    };
    
    runJob();
  }

  /**
   * Schedule a job to run at regular intervals
   */
  private scheduleInterval(intervalMs: number, job: () => Promise<void>) {
    const interval = setInterval(async () => {
      try {
        await job();
      } catch (error) {
        console.error(`Interval job failed:`, error);
      }
    }, intervalMs);
    
    this.intervals.push(interval);
  }

  /**
   * Run a job once immediately
   */
  private runOnce(job: () => Promise<void>) {
    setTimeout(async () => {
      try {
        await job();
      } catch (error) {
        console.error(`One-time job failed:`, error);
      }
    }, 1000); // Small delay to ensure startup is complete
  }

  /**
   * Usage fetch job - pulls data from OpenAI API
   */
  private async runUsageFetchJob() {
    try {
      await fetchAndStoreUsageData();
      console.log('Usage fetch job completed successfully');
    } catch (error) {
      console.error('Usage fetch job failed:', error);
      // TODO: Send admin notification about job failure
    }
  }

  /**
   * Alert checking job - checks thresholds and sends notifications
   */
  private async runAlertCheckJob() {
    try {
      await checkAndSendAlerts();
      console.log('Alert check job completed successfully');
    } catch (error) {
      console.error('Alert check job failed:', error);
      // TODO: Send admin notification about job failure
    }
  }

  /**
   * Priority alert checking for premium users
   */
  private async runPriorityAlertCheckJob() {
    try {
      // Only check alerts for Team and Advanced users
      const priorityAlerts = await prisma.alert.findMany({
        where: {
          isActive: true,
          user: {
            subscriptionPlan: {
              in: ['Team', 'Advanced']
            }
          }
        },
        include: {
          user: true,
          apiKey: true,
        },
      });

      if (priorityAlerts.length === 0) {
        return;
      }

      console.log(`Checking ${priorityAlerts.length} priority alerts...`);
      
      // Use the same alert checking logic but with priority flag
      await checkAndSendAlerts();
      
      console.log('Priority alert check job completed successfully');
    } catch (error) {
      console.error('Priority alert check job failed:', error);
    }
  }

  /**
   * Daily reconciliation job - compares local usage with OpenAI billing
   */
  private async runReconciliationJob() {
    try {
      await this.reconcileUsageData();
      console.log('Reconciliation job completed successfully');
    } catch (error) {
      console.error('Reconciliation job failed:', error);
      // TODO: Send admin notification about reconciliation failures
    }
  }

  /**
   * Reconcile local usage data with OpenAI billing data
   */
  private async reconcileUsageData() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

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
        // Get local usage for yesterday
        const localUsage = await prisma.usage.aggregate({
          where: {
            apiKeyId: apiKey.id,
            date: {
              gte: new Date(dateStr),
              lt: new Date(new Date(dateStr).getTime() + 24 * 60 * 60 * 1000),
            },
          },
          _sum: {
            cost: true,
          },
        });

        const localCost = localUsage._sum.cost || 0;

        // TODO: Fetch actual usage from OpenAI billing API
        // This would require implementing OpenAI's billing API integration
        // For now, we'll just log the local usage for reconciliation
        
        console.log(`API Key ${apiKey.id}: Local cost for ${dateStr}: $${localCost.toFixed(4)}`);

        // If there's a significant discrepancy (>2%), flag it
        // const discrepancy = Math.abs(localCost - openaiCost) / Math.max(localCost, openaiCost);
        // if (discrepancy > 0.02) {
        //   console.warn(`Reconciliation discrepancy for API key ${apiKey.id}: ${discrepancy * 100}%`);
        //   // TODO: Send admin notification
        // }

      } catch (error) {
        console.error(`Reconciliation failed for API key ${apiKey.id}:`, error);
      }
    }
  }

  /**
   * Health check for background jobs
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;

      // Check if jobs are running (could track last run times)
      const lastUsage = await prisma.usage.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      const lastUsageAge = lastUsage 
        ? Date.now() - lastUsage.createdAt.getTime()
        : Infinity;

      // If no usage data in last 48 hours, something might be wrong
      const isHealthy = lastUsageAge < 48 * 60 * 60 * 1000;

      return {
        status: isHealthy ? 'healthy' : 'unhealthy',
        details: {
          lastUsageAge: lastUsageAge,
          activeJobs: this.intervals.length,
          databaseConnected: true,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          activeJobs: this.intervals.length,
          databaseConnected: false,
        },
      };
    }
  }
}

// Global instance
export const backgroundJobs = new BackgroundJobScheduler();

// Auto-start in production
if (process.env.NODE_ENV === 'production') {
  backgroundJobs.start();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping background jobs...');
  backgroundJobs.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping background jobs...');
  backgroundJobs.stop();
  process.exit(0);
});

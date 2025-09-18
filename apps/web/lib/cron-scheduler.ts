import { fetchAndStoreUsageData, checkAndSendAlerts } from './openai-usage-fetcher';

interface CronJob {
  name: string;
  schedule: string;
  handler: () => Promise<void>;
  lastRun?: Date;
  nextRun?: Date;
}

class CronScheduler {
  private jobs: Map<string, CronJob> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add a cron job to the scheduler
   */
  addJob(name: string, schedule: string, handler: () => Promise<void>) {
    const job: CronJob = {
      name,
      schedule,
      handler,
    };

    this.jobs.set(name, job);
    this.scheduleJob(job);
    console.log(`Cron job '${name}' scheduled with pattern: ${schedule}`);
  }

  /**
   * Remove a cron job from the scheduler
   */
  removeJob(name: string) {
    const interval = this.intervals.get(name);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(name);
    }
    this.jobs.delete(name);
    console.log(`Cron job '${name}' removed`);
  }

  /**
   * Schedule a job based on its cron pattern
   */
  private scheduleJob(job: CronJob) {
    const intervalMs = this.parseSchedule(job.schedule);
    
    if (intervalMs > 0) {
      const interval = setInterval(async () => {
        try {
          console.log(`Running cron job: ${job.name}`);
          job.lastRun = new Date();
          await job.handler();
          job.nextRun = new Date(Date.now() + intervalMs);
          console.log(`Cron job '${job.name}' completed successfully`);
        } catch (error) {
          console.error(`Error in cron job '${job.name}':`, error);
        }
      }, intervalMs);

      this.intervals.set(job.name, interval);
      job.nextRun = new Date(Date.now() + intervalMs);
    }
  }

  /**
   * Parse schedule string and return interval in milliseconds
   * Supports simple patterns like:
   * - "daily" -> 24 hours
   * - "hourly" -> 1 hour
   * - "every-30-minutes" -> 30 minutes
   */
  private parseSchedule(schedule: string): number {
    switch (schedule.toLowerCase()) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'hourly':
        return 60 * 60 * 1000; // 1 hour
      case 'every-30-minutes':
        return 30 * 60 * 1000; // 30 minutes
      case 'every-15-minutes':
        return 15 * 60 * 1000; // 15 minutes
      case 'every-5-minutes':
        return 5 * 60 * 1000; // 5 minutes
      default:
        // For now, default to daily if pattern is not recognized
        console.warn(`Unknown schedule pattern: ${schedule}, defaulting to daily`);
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Get status of all jobs
   */
  getJobStatus(): Array<{
    name: string;
    schedule: string;
    lastRun?: Date;
    nextRun?: Date;
    status: 'running' | 'stopped';
  }> {
    return Array.from(this.jobs.values()).map(job => ({
      name: job.name,
      schedule: job.schedule,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      status: this.intervals.has(job.name) ? 'running' : 'stopped'
    }));
  }

  /**
   * Stop all jobs
   */
  stopAll() {
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      console.log(`Stopped cron job: ${name}`);
    }
    this.intervals.clear();
  }

  /**
   * Start all jobs
   */
  startAll() {
    for (const job of this.jobs.values()) {
      if (!this.intervals.has(job.name)) {
        this.scheduleJob(job);
      }
    }
  }
}

// Global scheduler instance
export const cronScheduler = new CronScheduler();

/**
 * Initialize all cron jobs for the application
 */
export function initializeCronJobs() {
  console.log('Initializing cron jobs...');

  // Daily usage data fetch at 2 AM
  cronScheduler.addJob(
    'daily-usage-fetch',
    'daily',
    async () => {
      console.log('Starting daily usage data fetch...');
      await fetchAndStoreUsageData();
    }
  );

  // Hourly alert checking
  cronScheduler.addJob(
    'hourly-alert-check',
    'hourly',
    async () => {
      console.log('Starting hourly alert check...');
      await checkAndSendAlerts();
    }
  );

  // For development: more frequent checks (every 30 minutes)
  if (process.env.NODE_ENV === 'development') {
    cronScheduler.addJob(
      'dev-usage-sync',
      'every-30-minutes',
      async () => {
        console.log('Development: Running usage sync...');
        await fetchAndStoreUsageData();
        await checkAndSendAlerts();
      }
    );
  }

  console.log('Cron jobs initialized successfully');
}

/**
 * Graceful shutdown of cron jobs
 */
export function shutdownCronJobs() {
  console.log('Shutting down cron jobs...');
  cronScheduler.stopAll();
  console.log('All cron jobs stopped');
}

// Handle process termination
if (typeof process !== 'undefined') {
  process.on('SIGTERM', shutdownCronJobs);
  process.on('SIGINT', shutdownCronJobs);
}

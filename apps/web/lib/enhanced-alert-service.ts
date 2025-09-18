import { prisma } from '@repo/db';

interface AlertNotification {
  userId: string;
  userEmail: string;
  alertName: string;
  thresholdType: 'cost' | 'tokens' | 'requests';
  threshold: number;
  currentValue: number;
  period: 'daily' | 'weekly' | 'monthly';
  apiKeyName?: string;
}

interface AlertThrottle {
  alertId: string;
  lastSent: Date;
  count: number;
}

// In-memory throttle cache (in production, use Redis)
const alertThrottleCache = new Map<string, AlertThrottle>();

export class EnhancedAlertService {
  private static readonly THROTTLE_PERIODS = {
    email: 60 * 60 * 1000, // 1 hour
    slack: 30 * 60 * 1000, // 30 minutes
    discord: 30 * 60 * 1000, // 30 minutes
    teams: 30 * 60 * 1000, // 30 minutes
    webhook: 15 * 60 * 1000, // 15 minutes
    priority: 2 * 60 * 60 * 1000, // 2 hours for priority alerts
  };

  private static readonly MAX_ALERTS_PER_DAY = {
    email: 10,
    slack: 20,
    discord: 20,
    teams: 20,
    webhook: 50,
  };

  /**
   * Check if alert should be throttled
   */
  private static shouldThrottle(
    alertId: string,
    method: string,
    isPriority: boolean = false
  ): boolean {
    const cacheKey = `${alertId}-${method}`;
    const cached = alertThrottleCache.get(cacheKey);
    
    if (!cached) return false;

    const now = new Date();
    const timeSinceLastSent = now.getTime() - cached.lastSent.getTime();
    
    // Check if within throttle period
    const throttlePeriod = isPriority 
      ? this.THROTTLE_PERIODS.priority 
      : this.THROTTLE_PERIODS[method as keyof typeof this.THROTTLE_PERIODS] || this.THROTTLE_PERIODS.email;
    
    if (timeSinceLastSent < throttlePeriod) {
      return true;
    }

    // Check daily limit (reset every 24 hours)
    const daysSinceLastSent = timeSinceLastSent / (24 * 60 * 60 * 1000);
    if (daysSinceLastSent < 1) {
      const maxDaily = this.MAX_ALERTS_PER_DAY[method as keyof typeof this.MAX_ALERTS_PER_DAY] || 10;
      if (cached.count >= maxDaily) {
        return true;
      }
    } else {
      // Reset daily counter
      cached.count = 0;
    }

    return false;
  }

  /**
   * Update throttle cache
   */
  private static updateThrottleCache(alertId: string, method: string): void {
    const cacheKey = `${alertId}-${method}`;
    const cached = alertThrottleCache.get(cacheKey);
    const now = new Date();

    if (cached) {
      const daysSinceLastSent = (now.getTime() - cached.lastSent.getTime()) / (24 * 60 * 60 * 1000);
      cached.lastSent = now;
      cached.count = daysSinceLastSent >= 1 ? 1 : cached.count + 1;
    } else {
      alertThrottleCache.set(cacheKey, {
        alertId,
        lastSent: now,
        count: 1,
      });
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    notification: AlertNotification
  ): Promise<boolean> {
    try {
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      console.log(`📧 EMAIL ALERT: ${notification.userEmail}`);
      console.log(`Alert: ${notification.alertName}`);
      console.log(`${notification.thresholdType}: ${notification.currentValue} / ${notification.threshold}`);
      console.log(`Period: ${notification.period}`);
      
      // Simulate email sending
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  /**
   * Send Slack notification
   */
  private static async sendSlackNotification(
    notification: AlertNotification,
    webhookUrl: string
  ): Promise<boolean> {
    try {
      const message = {
        text: `🚨 *${notification.alertName}* Alert Triggered`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Alert:* ${notification.alertName}\n*User:* ${notification.userEmail}\n*${notification.thresholdType}:* ${notification.currentValue} / ${notification.threshold}\n*Period:* ${notification.period}${notification.apiKeyName ? `\n*API Key:* ${notification.apiKeyName}` : ''}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Tracked by AI Spend Guard • ${new Date().toLocaleString()}`,
              },
            ],
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      return false;
    }
  }

  /**
   * Send Discord notification
   */
  private static async sendDiscordNotification(
    notification: AlertNotification,
    webhookUrl: string
  ): Promise<boolean> {
    try {
      const embed = {
        title: `🚨 ${notification.alertName} Alert Triggered`,
        color: 0xff4444,
        fields: [
          { name: 'User', value: notification.userEmail, inline: true },
          { name: 'Threshold Type', value: notification.thresholdType, inline: true },
          { name: 'Current / Limit', value: `${notification.currentValue} / ${notification.threshold}`, inline: true },
          { name: 'Period', value: notification.period, inline: true },
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'AI Spend Guard' },
      };

      if (notification.apiKeyName) {
        embed.fields.push({ name: 'API Key', value: notification.apiKeyName, inline: true });
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
      return false;
    }
  }

  /**
   * Send Teams notification
   */
  private static async sendTeamsNotification(
    notification: AlertNotification,
    webhookUrl: string
  ): Promise<boolean> {
    try {
      const card = {
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: 'FF4444',
        summary: `${notification.alertName} Alert Triggered`,
        sections: [
          {
            activityTitle: `🚨 ${notification.alertName} Alert Triggered`,
            activitySubtitle: `User: ${notification.userEmail}`,
            facts: [
              { name: 'Threshold Type', value: notification.thresholdType },
              { name: 'Current / Limit', value: `${notification.currentValue} / ${notification.threshold}` },
              { name: 'Period', value: notification.period },
              ...(notification.apiKeyName ? [{ name: 'API Key', value: notification.apiKeyName }] : []),
            ],
            markdown: true,
          },
        ],
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
      return false;
    }
  }

  /**
   * Send generic webhook notification
   */
  private static async sendWebhookNotification(
    notification: AlertNotification,
    webhookUrl: string
  ): Promise<boolean> {
    try {
      const payload = {
        event: 'alert_triggered',
        timestamp: new Date().toISOString(),
        alert: {
          name: notification.alertName,
          user_email: notification.userEmail,
          threshold_type: notification.thresholdType,
          threshold: notification.threshold,
          current_value: notification.currentValue,
          period: notification.period,
          api_key_name: notification.apiKeyName,
        },
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to send webhook notification:', error);
      return false;
    }
  }

  /**
   * Main method to send notification with throttling
   */
  public static async sendNotification(
    notification: AlertNotification,
    method: string,
    webhookUrl?: string,
    isPriority: boolean = false
  ): Promise<boolean> {
    // Check throttling
    const alertId = `${notification.userId}-${notification.alertName}`;
    if (this.shouldThrottle(alertId, method, isPriority)) {
      console.log(`Alert throttled: ${alertId} via ${method}`);
      return false;
    }

    let success = false;

    try {
      switch (method.toLowerCase()) {
        case 'email':
          success = await this.sendEmailNotification(notification);
          break;
        case 'slack':
          if (webhookUrl) {
            success = await this.sendSlackNotification(notification, webhookUrl);
          }
          break;
        case 'discord':
          if (webhookUrl) {
            success = await this.sendDiscordNotification(notification, webhookUrl);
          }
          break;
        case 'teams':
          if (webhookUrl) {
            success = await this.sendTeamsNotification(notification, webhookUrl);
          }
          break;
        case 'webhook':
          if (webhookUrl) {
            success = await this.sendWebhookNotification(notification, webhookUrl);
          }
          break;
        default:
          console.error(`Unsupported notification method: ${method}`);
          return false;
      }

      if (success) {
        this.updateThrottleCache(alertId, method);
      }

      return success;
    } catch (error) {
      console.error(`Failed to send ${method} notification:`, error);
      return false;
    }
  }

  /**
   * Send multiple notifications for an alert
   */
  public static async sendMultiChannelNotification(
    notification: AlertNotification,
    methods: string[],
    webhookUrls: Record<string, string> = {},
    isPriority: boolean = false
  ): Promise<{ success: boolean; results: Record<string, boolean> }> {
    const results: Record<string, boolean> = {};
    let overallSuccess = false;

    for (const method of methods) {
      const webhookUrl = webhookUrls[method];
      const result = await this.sendNotification(notification, method, webhookUrl, isPriority);
      results[method] = result;
      if (result) overallSuccess = true;
    }

    return { success: overallSuccess, results };
  }
}

export const alertNotificationService = EnhancedAlertService;

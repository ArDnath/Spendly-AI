import nodemailer from 'nodemailer';

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

interface NotificationConfig {
  email: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: string;
}

class AlertNotificationService {
  private config: NotificationConfig;
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.config = {
      email: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      },
      from: process.env.FROM_EMAIL || 'noreply@spendly.ai',
    };

    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      if (this.config.email.auth.user && this.config.email.auth.pass) {
        this.transporter = nodemailer.createTransporter(this.config.email);
      } else {
        console.warn('Email credentials not configured. Email notifications will be disabled.');
      }
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async sendEmailNotification(notification: AlertNotification): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email transporter not available. Skipping email notification.');
      return false;
    }

    try {
      const subject = `🚨 SpendlyAI Alert: ${notification.alertName}`;
      const html = this.generateEmailHTML(notification);
      const text = this.generateEmailText(notification);

      const mailOptions = {
        from: this.config.from,
        to: notification.userEmail,
        subject,
        text,
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`Email notification sent successfully to ${notification.userEmail}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email notification:', error);
      return false;
    }
  }

  private generateEmailHTML(notification: AlertNotification): string {
    const formatValue = (value: number, type: string) => {
      switch (type) {
        case 'cost':
          return `$${value.toFixed(2)}`;
        case 'tokens':
          return value >= 1000000 
            ? `${(value / 1000000).toFixed(1)}M tokens`
            : value >= 1000 
            ? `${(value / 1000).toFixed(1)}K tokens`
            : `${value} tokens`;
        case 'requests':
          return `${value.toLocaleString()} requests`;
        default:
          return value.toString();
      }
    };

    const percentageOver = ((notification.currentValue - notification.threshold) / notification.threshold) * 100;
    const apiKeyInfo = notification.apiKeyName ? `for API key "${notification.apiKeyName}"` : 'across all API keys';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SpendlyAI Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .alert-box { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric-label { font-size: 14px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .footer { background-color: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
        .button { display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 Budget Alert Triggered</h1>
            <p>Your AI API usage has exceeded the configured threshold</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h2 style="color: #dc2626; margin-top: 0;">Alert: ${notification.alertName}</h2>
                <p>Your ${notification.period} ${notification.thresholdType} usage ${apiKeyInfo} has exceeded the threshold by <strong>${percentageOver.toFixed(1)}%</strong>.</p>
                
                <div style="margin: 20px 0;">
                    <div class="metric">
                        <div class="metric-label">Current Usage</div>
                        <div class="metric-value" style="color: #dc2626;">${formatValue(notification.currentValue, notification.thresholdType)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Threshold</div>
                        <div class="metric-value">${formatValue(notification.threshold, notification.thresholdType)}</div>
                    </div>
                </div>
            </div>
            
            <h3>Recommended Actions:</h3>
            <ul>
                <li>Review your API usage patterns in the SpendlyAI dashboard</li>
                <li>Consider optimizing your AI model usage or switching to more cost-effective models</li>
                <li>Update your budget thresholds if this usage level is expected</li>
                <li>Set up additional alerts for early warning</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">View Dashboard</a>
            </div>
        </div>
        
        <div class="footer">
            <p>This alert was sent by SpendlyAI - Your AI API Cost Management Platform</p>
            <p>To manage your alerts, visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=alerts">dashboard settings</a></p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateEmailText(notification: AlertNotification): string {
    const formatValue = (value: number, type: string) => {
      switch (type) {
        case 'cost':
          return `$${value.toFixed(2)}`;
        case 'tokens':
          return value >= 1000000 
            ? `${(value / 1000000).toFixed(1)}M tokens`
            : value >= 1000 
            ? `${(value / 1000).toFixed(1)}K tokens`
            : `${value} tokens`;
        case 'requests':
          return `${value.toLocaleString()} requests`;
        default:
          return value.toString();
      }
    };

    const percentageOver = ((notification.currentValue - notification.threshold) / notification.threshold) * 100;
    const apiKeyInfo = notification.apiKeyName ? `for API key "${notification.apiKeyName}"` : 'across all API keys';

    return `
🚨 SPENDLYAI BUDGET ALERT

Alert: ${notification.alertName}

Your ${notification.period} ${notification.thresholdType} usage ${apiKeyInfo} has exceeded the threshold by ${percentageOver.toFixed(1)}%.

Current Usage: ${formatValue(notification.currentValue, notification.thresholdType)}
Threshold: ${formatValue(notification.threshold, notification.thresholdType)}

Recommended Actions:
- Review your API usage patterns in the SpendlyAI dashboard
- Consider optimizing your AI model usage or switching to more cost-effective models
- Update your budget thresholds if this usage level is expected
- Set up additional alerts for early warning

View your dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

---
This alert was sent by SpendlyAI - Your AI API Cost Management Platform
To manage your alerts, visit: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard?tab=alerts
`;
  }

  async sendSlackNotification(notification: AlertNotification, webhookUrl: string): Promise<boolean> {
    try {
      const formatValue = (value: number, type: string) => {
        switch (type) {
          case 'cost':
            return `$${value.toFixed(2)}`;
          case 'tokens':
            return value >= 1000000 
              ? `${(value / 1000000).toFixed(1)}M tokens`
              : value >= 1000 
              ? `${(value / 1000).toFixed(1)}K tokens`
              : `${value} tokens`;
          case 'requests':
            return `${value.toLocaleString()} requests`;
          default:
            return value.toString();
        }
      };

      const percentageOver = ((notification.currentValue - notification.threshold) / notification.threshold) * 100;
      const apiKeyInfo = notification.apiKeyName ? `for API key "${notification.apiKeyName}"` : 'across all API keys';

      const payload = {
        text: `🚨 SpendlyAI Budget Alert: ${notification.alertName}`,
        attachments: [
          {
            color: 'danger',
            fields: [
              {
                title: 'Alert Details',
                value: `Your ${notification.period} ${notification.thresholdType} usage ${apiKeyInfo} has exceeded the threshold by *${percentageOver.toFixed(1)}%*`,
                short: false
              },
              {
                title: 'Current Usage',
                value: formatValue(notification.currentValue, notification.thresholdType),
                short: true
              },
              {
                title: 'Threshold',
                value: formatValue(notification.threshold, notification.thresholdType),
                short: true
              }
            ],
            actions: [
              {
                type: 'button',
                text: 'View Dashboard',
                url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
              }
            ]
          }
        ]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Slack notification sent successfully for alert: ${notification.alertName}`);
        return true;
      } else {
        console.error('Failed to send Slack notification:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      return false;
    }
  }

  async sendWebhookNotification(notification: AlertNotification, webhookUrl: string): Promise<boolean> {
    try {
      const payload = {
        event: 'budget_alert_triggered',
        timestamp: new Date().toISOString(),
        alert: {
          name: notification.alertName,
          userId: notification.userId,
          userEmail: notification.userEmail,
          thresholdType: notification.thresholdType,
          threshold: notification.threshold,
          currentValue: notification.currentValue,
          period: notification.period,
          apiKeyName: notification.apiKeyName,
          percentageOver: ((notification.currentValue - notification.threshold) / notification.threshold) * 100
        }
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SpendlyAI-Alert-Service/1.0'
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Webhook notification sent successfully for alert: ${notification.alertName}`);
        return true;
      } else {
        console.error('Failed to send webhook notification:', response.statusText);
        return false;
      }
    } catch (error) {
      console.error('Error sending webhook notification:', error);
      return false;
    }
  }

  async sendNotification(notification: AlertNotification, method: string, webhookUrl?: string): Promise<boolean> {
    switch (method.toLowerCase()) {
      case 'email':
        return await this.sendEmailNotification(notification);
      case 'slack':
        if (webhookUrl) {
          return await this.sendSlackNotification(notification, webhookUrl);
        } else {
          console.error('Slack webhook URL is required for Slack notifications');
          return false;
        }
      case 'webhook':
        if (webhookUrl) {
          return await this.sendWebhookNotification(notification, webhookUrl);
        } else {
          console.error('Webhook URL is required for webhook notifications');
          return false;
        }
      default:
        console.error(`Unsupported notification method: ${method}`);
        return false;
    }
  }
}

export const alertNotificationService = new AlertNotificationService();

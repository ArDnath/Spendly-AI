import { prisma } from '@repo/db';
import { decrypt } from './utils';

interface OpenAIUsageResponse {
  object: string;
  daily_costs: Array<{
    timestamp: number;
    line_items: Array<{
      name: string;
      cost: number;
    }>;
  }>;
  total_usage: number;
}

interface OpenAIUsageData {
  apiKeyId: string;
  provider: string;
  endpoint: string;
  modelUsed: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  requests: number;
  cost: number;
  date: Date;
}

/**
 * Fetches usage data from OpenAI API for a given API key
 */
async function fetchOpenAIUsage(apiKey: string, startDate: string, endDate: string): Promise<OpenAIUsageResponse | null> {
  try {
    const response = await fetch(`https://api.openai.com/v1/usage?start_date=${startDate}&end_date=${endDate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching OpenAI usage:', error);
    return null;
  }
}

/**
 * Processes OpenAI usage data and converts it to our format
 */
function processOpenAIUsageData(
  usageResponse: OpenAIUsageResponse,
  apiKeyId: string
): OpenAIUsageData[] {
  const usageData: OpenAIUsageData[] = [];

  usageResponse.daily_costs.forEach((dailyCost) => {
    const date = new Date(dailyCost.timestamp * 1000);
    
    dailyCost.line_items.forEach((lineItem) => {
      // Extract model information from the line item name
      const modelMatch = lineItem.name.match(/(gpt-[^-\s]+(?:-[^-\s]+)*)/i);
      const modelUsed = modelMatch ? modelMatch[1] : 'unknown';
      
      // Estimate tokens based on cost (rough approximation)
      // GPT-4: ~$0.03 per 1K tokens, GPT-3.5: ~$0.002 per 1K tokens
      const isGPT4 = modelUsed.includes('gpt-4');
      const costPerToken = isGPT4 ? 0.00003 : 0.000002;
      const estimatedTokens = Math.round(lineItem.cost / costPerToken);
      
      usageData.push({
        apiKeyId,
        provider: 'openai',
        endpoint: lineItem.name,
        modelUsed,
        inputTokens: Math.round(estimatedTokens * 0.6), // Rough estimate: 60% input
        outputTokens: Math.round(estimatedTokens * 0.4), // Rough estimate: 40% output
        totalTokens: estimatedTokens,
        requests: 1, // We don't have exact request count, so estimate 1 per line item
        cost: lineItem.cost,
        date,
      });
    });
  });

  return usageData;
}

/**
 * Stores usage data in the database
 */
async function storeUsageData(usageData: OpenAIUsageData[]): Promise<void> {
  try {
    for (const data of usageData) {
      // Check if usage record already exists for this date and API key
      const existingRecord = await prisma.usage.findFirst({
        where: {
          apiKeyId: data.apiKeyId,
          endpoint: data.endpoint,
          date: {
            gte: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate()),
            lt: new Date(data.date.getFullYear(), data.date.getMonth(), data.date.getDate() + 1),
          },
        },
      });

      if (!existingRecord) {
        await prisma.usage.create({
          data: {
            apiKeyId: data.apiKeyId,
            provider: data.provider,
            endpoint: data.endpoint,
            modelUsed: data.modelUsed,
            inputTokens: data.inputTokens,
            outputTokens: data.outputTokens,
            totalTokens: data.totalTokens,
            requests: data.requests,
            cost: data.cost,
            mostExpensiveEndpoint: data.endpoint,
            date: data.date,
          },
        });
      } else {
        // Update existing record by adding the new usage
        await prisma.usage.update({
          where: { id: existingRecord.id },
          data: {
            inputTokens: existingRecord.inputTokens + data.inputTokens,
            outputTokens: existingRecord.outputTokens + data.outputTokens,
            totalTokens: existingRecord.totalTokens + data.totalTokens,
            requests: existingRecord.requests + data.requests,
            cost: existingRecord.cost + data.cost,
            mostExpensiveEndpoint: data.cost > existingRecord.cost ? data.endpoint : existingRecord.mostExpensiveEndpoint,
          },
        });
      }
    }
  } catch (error) {
    console.error('Error storing usage data:', error);
    throw error;
  }
}

/**
 * Main function to fetch and store usage data for all users
 */
export async function fetchAndStoreUsageData(): Promise<void> {
  try {
    console.log('Starting OpenAI usage data fetch...');

    // Get all active API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        status: 'active',
        provider: 'openai',
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${apiKeys.length} active OpenAI API keys`);

    // Calculate date range (yesterday to avoid incomplete data)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startDate = yesterday.toISOString().split('T')[0];
    const endDate = startDate; // Same day for daily fetch

    // Process each API key
    for (const apiKeyRecord of apiKeys) {
      try {
        console.log(`Processing API key ${apiKeyRecord.id} for user ${apiKeyRecord.user.email}`);

        // Decrypt the API key
        const decryptedKey = decrypt(apiKeyRecord.encryptedKey);

        // Fetch usage data from OpenAI
        const usageResponse = await fetchOpenAIUsage(decryptedKey, startDate, endDate);

        if (!usageResponse) {
          console.log(`No usage data received for API key ${apiKeyRecord.id}`);
          continue;
        }

        // Process and store the usage data
        const processedData = processOpenAIUsageData(usageResponse, apiKeyRecord.id);
        
        if (processedData.length > 0) {
          await storeUsageData(processedData);
          console.log(`Stored ${processedData.length} usage records for API key ${apiKeyRecord.id}`);
        } else {
          console.log(`No usage data to store for API key ${apiKeyRecord.id}`);
        }

        // Add delay between API calls to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`Error processing API key ${apiKeyRecord.id}:`, error);
        // Continue with next API key even if one fails
      }
    }

    console.log('OpenAI usage data fetch completed');

  } catch (error) {
    console.error('Error in fetchAndStoreUsageData:', error);
    throw error;
  }
}

/**
 * Check and send alerts for users who have exceeded their thresholds
 */
export async function checkAndSendAlerts(): Promise<void> {
  try {
    console.log('Checking for alert thresholds...');

    // Get all active alerts
    const alerts = await prisma.alert.findMany({
      where: { isActive: true },
      include: {
        user: true,
        apiKey: true,
      },
    });

    const now = new Date();

    for (const alert of alerts) {
      try {
        // Calculate period start date
        let periodStart: Date;
        switch (alert.period) {
          case 'daily':
            periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'weekly':
            periodStart = new Date(now);
            periodStart.setDate(now.getDate() - 7);
            break;
          case 'monthly':
          default:
            periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        }

        // Query usage for the period
        const whereClause: any = {
          apiKey: { userId: alert.userId },
          createdAt: { gte: periodStart },
        };

        if (alert.apiKeyId) {
          whereClause.apiKeyId = alert.apiKeyId;
        }

        const usage = await prisma.usage.aggregate({
          where: whereClause,
          _sum: {
            cost: alert.thresholdType === 'cost',
            totalTokens: alert.thresholdType === 'tokens',
            requests: alert.thresholdType === 'requests',
          },
        });

        let currentValue = 0;
        switch (alert.thresholdType) {
          case 'cost':
            currentValue = usage._sum.cost || 0;
            break;
          case 'tokens':
            currentValue = usage._sum.totalTokens || 0;
            break;
          case 'requests':
            currentValue = usage._sum.requests || 0;
            break;
        }

        // Check if threshold is exceeded
        if (currentValue >= alert.threshold) {
          // Check if we haven't sent a notification recently (within the last hour)
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
          
          if (!alert.lastNotificationSentAt || alert.lastNotificationSentAt < oneHourAgo) {
            console.log(`Alert triggered for user ${alert.user.email}: ${alert.name}`);
            console.log(`Current ${alert.thresholdType}: ${currentValue}, Threshold: ${alert.threshold}`);

            // Send notification using the notification service
            const { alertNotificationService } = await import('./alert-notification-service');
            
            const notification = {
              userId: alert.userId,
              userEmail: alert.user.email,
              alertName: alert.name,
              thresholdType: alert.thresholdType as 'cost' | 'tokens' | 'requests',
              threshold: alert.threshold,
              currentValue,
              period: alert.period as 'daily' | 'weekly' | 'monthly',
              apiKeyName: alert.apiKey?.name,
            };

            // Extract webhook URL from notification method if it's a webhook/slack
            let webhookUrl: string | undefined;
            if (alert.notificationMethod.startsWith('webhook:')) {
              webhookUrl = alert.notificationMethod.split('webhook:')[1];
            } else if (alert.notificationMethod.startsWith('slack:')) {
              webhookUrl = alert.notificationMethod.split('slack:')[1];
            }

            const notificationSent = await alertNotificationService.sendNotification(
              notification,
              alert.notificationMethod.split(':')[0], // Extract method (email, slack, webhook)
              webhookUrl
            );

            if (notificationSent) {
              // Update last notification sent time
              await prisma.alert.update({
                where: { id: alert.id },
                data: { lastNotificationSentAt: now },
              });
              console.log(`Notification sent successfully for alert: ${alert.name}`);
            } else {
              console.error(`Failed to send notification for alert: ${alert.name}`);
            }
          }
        }

      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }

    console.log('Alert checking completed');

  } catch (error) {
    console.error('Error in checkAndSendAlerts:', error);
    throw error;
  }
}

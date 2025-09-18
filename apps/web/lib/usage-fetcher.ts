import {prisma} from "@repo/db";
import {decrypt} from "./utils";


async function fetchOpenAIUsage(apiKey, startDate, endDate) {

  const url ="https://api.openai.com/v1/dashboard/billing/usage";
  const params = new URLSearchParams({
    start_Date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  });


  try{
    const response = await fetch(`${url}?${params}`,{
      headers:{
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type:': 'application/json',
      }
    });

    if(!response.ok){
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return await response.json();
  }
  catch(error){
    console.error(`Error fetching OpenAI usage:`, error);
    throw error;
  }



}

export async function processAllUsageData() {
  console.log('Starting usage data processing...');
  
  try {
    // Get all active API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        status: 'active',
        provider: 'OpenAI'
      },
      include: {
        user: true
      }
    });

    console.log(`Found ${apiKeys.length} active API keys to process`);

    // Process each API key
    for (const apiKeyRecord of apiKeys) {
      try {
        // Decrypt the API key
        const decryptedKey = decrypt(apiKeyRecord.encryptedKey);
        
        // Get usage for the last 24 hours
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 1);
        
        // Fetch usage from OpenAI
        const usageData = await fetchOpenAIUsage(decryptedKey, startDate, endDate);
        
        // Process daily usage
        if (usageData.daily_costs) {
          for (const dailyData of usageData.daily_costs) {
            // Check if we already have this day's data
            const existingUsage = await prisma.usage.findFirst({
              where: {
                apiKeyId: apiKeyRecord.id,
                createdAt: {
                  gte: new Date(dailyData.timestamp * 1000),
                  lt: new Date((dailyData.timestamp + 86400) * 1000)
                }
              }
            });

            if (!existingUsage) {
              // Calculate aggregated values
              let totalTokens = 0;
              let totalCost = 0;
              let totalRequests = 0;
              let mostExpensiveEndpoint = null;
              let maxEndpointCost = 0;

              // Process line items (different models/endpoints)
              for (const item of (dailyData.line_items || [])) {
                totalTokens += item.n_generated_tokens_total || 0;
                totalTokens += item.n_context_tokens_total || 0;
                totalCost += item.cost || 0;
                totalRequests += item.n_requests || 0;

                if (item.cost > maxEndpointCost) {
                  maxEndpointCost = item.cost;
                  mostExpensiveEndpoint = item.name || 'unknown';
                }
              }

              // Create usage record
              await prisma.usage.create({
                data: {
                  apiKeyId: apiKeyRecord.id,
                  provider: 'OpenAI',
                  endpoint: mostExpensiveEndpoint || 'gpt-4',
                  tokens: Math.round(totalTokens),
                  requests: totalRequests,
                  cost: totalCost / 100, // Convert cents to dollars
                  createdAt: new Date(dailyData.timestamp * 1000)
                }
              });

              console.log(`Stored usage data for ${apiKeyRecord.name || apiKeyRecord.id} on ${new Date(dailyData.timestamp * 1000).toDateString()}`);
            }
          }
        }

        // Check alerts after updating usage
        await checkAlertsForUser(apiKeyRecord.userId);
        
      } catch (error) {
        console.error(`Error processing API key ${apiKeyRecord.id}:`, error);
        
        // Update API key status if it's invalid
        if (error.message.includes('401')) {
          await prisma.apiKey.update({
            where: { id: apiKeyRecord.id },
            data: { status: 'invalid' }
          });
        }
      }
    }

    console.log('Usage data processing completed');
  } catch (error) {
    console.error('Fatal error in usage processing:', error);
    throw error;
  }
}

/**
 * Checks and triggers alerts for a user based on their usage
 * @param {string} userId - User ID to check alerts for
 */
async function checkAlertsForUser(userId) {
  try {
    // Get active alerts for the user
    const alerts = await prisma.alert.findMany({
      where: {
        userId,
        isActive: true
      }
    });

    for (const alert of alerts) {
      // Calculate the period for checking
      const now = new Date();
      let startDate = new Date();
      
      switch (alert.period) {
        case 'daily':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'weekly':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'monthly':
        default:
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      // Get usage for the period
      const usageAggregation = await prisma.usage.aggregate({
        where: {
          apiKey: {
            userId,
            ...(alert.apiKeyId ? { id: alert.apiKeyId } : {})
          },
          createdAt: {
            gte: startDate,
            lte: now
          }
        },
        _sum: {
          cost: true,
          tokens: true,
          requests: true
        }
      });

      // Check if threshold is exceeded
      let currentValue = 0;
      switch (alert.thresholdType) {
        case 'cost':
          currentValue = usageAggregation._sum.cost || 0;
          break;
        case 'tokens':
          currentValue = usageAggregation._sum.tokens || 0;
          break;
        case 'requests':
          currentValue = usageAggregation._sum.requests || 0;
          break;
      }

      if (currentValue >= alert.threshold) {
        // Check if we should send notification (not sent in last 24 hours)
        const shouldNotify = !alert.lastNotificationSentAt || 
          (new Date().getTime() - alert.lastNotificationSentAt.getTime()) > 86400000;

        if (shouldNotify) {
          await sendAlertNotification(alert, currentValue);
          
          // Update last notification time
          await prisma.alert.update({
            where: { id: alert.id },
            data: { lastNotificationSentAt: new Date() }
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error checking alerts for user ${userId}:`, error);
  }
}

/**
 * Sends alert notification to user
 * @param {Object} alert - Alert object from database
 * @param {number} currentValue - Current value that triggered the alert
 */
async function sendAlertNotification(alert, currentValue) {
  console.log(`Alert triggered: ${alert.name} - Current value: ${currentValue}, Threshold: ${alert.threshold}`);
  
  // TODO: Implement actual notification sending based on notificationMethod
  // For now, just log the alert
  
  switch (alert.notificationMethod) {
    case 'email':
      // Send email notification
      console.log(`Would send email alert for ${alert.name}`);
      break;
    case 'slack':
      // Send Slack notification
      console.log(`Would send Slack alert for ${alert.name}`);
      break;
    case 'webhook':
      // Call webhook
      console.log(`Would call webhook for ${alert.name}`);
      break;
  }
}

// Export for use in CRON job or API endpoint
export default processAllUsageData;

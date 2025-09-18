import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { fetchAndStoreUsageData, checkAndSendAlerts } from '../../../../lib/openai-usage-fetcher';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    console.log(`Manual usage sync triggered by user: ${auth.userEmail}`);

    // Fetch and store usage data
    await fetchAndStoreUsageData();

    // Check and send alerts
    await checkAndSendAlerts();

    return createSuccessResponse({
      message: 'Usage data synchronized successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in manual usage sync:', error);
    return createErrorResponse(500, 'Failed to synchronize usage data');
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    return createSuccessResponse({
      message: 'Usage sync endpoint is available',
      lastSync: new Date().toISOString(),
      status: 'ready'
    });

  } catch (error) {
    console.error('Error checking sync status:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

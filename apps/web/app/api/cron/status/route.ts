import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { cronScheduler } from '../../../../lib/cron-scheduler';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    // Get status of all cron jobs
    const jobStatus = cronScheduler.getJobStatus();

    return createSuccessResponse({
      jobs: jobStatus,
      timestamp: new Date().toISOString(),
      totalJobs: jobStatus.length,
      runningJobs: jobStatus.filter(job => job.status === 'running').length
    });

  } catch (error) {
    console.error('Error fetching cron job status:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

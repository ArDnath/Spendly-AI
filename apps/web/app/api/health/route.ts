import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { backgroundJobs } from '../../../lib/background-jobs';
import { getCircuitBreakerHealth } from '../../../lib/circuit-breaker';

/**
 * Health check endpoint for AI Spend Guard
 * Provides system status for monitoring and alerting
 */
export async function GET() {
  try {
    const startTime = Date.now();

    // Check database connectivity
    let databaseStatus = 'healthy';
    let databaseLatency = 0;
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      databaseLatency = Date.now() - dbStart;
    } catch (error) {
      databaseStatus = 'unhealthy';
      console.error('Database health check failed:', error);
    }

    // Check background jobs
    const backgroundJobsHealth = await backgroundJobs.healthCheck();

    // Check circuit breakers
    const circuitBreakerHealth = getCircuitBreakerHealth();

    // Check recent usage data freshness
    let dataFreshness = 'healthy';
    try {
      const lastUsage = await prisma.usage.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (lastUsage) {
        const ageHours = (Date.now() - lastUsage.createdAt.getTime()) / (1000 * 60 * 60);
        if (ageHours > 48) {
          dataFreshness = 'stale';
        }
      } else {
        dataFreshness = 'no_data';
      }
    } catch (error) {
      dataFreshness = 'error';
    }

    // Overall system health
    const isHealthy = 
      databaseStatus === 'healthy' &&
      backgroundJobsHealth.status === 'healthy' &&
      dataFreshness !== 'error';

    const responseTime = Date.now() - startTime;

    const healthData = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime,
      services: {
        database: {
          status: databaseStatus,
          latency: databaseLatency,
        },
        backgroundJobs: backgroundJobsHealth,
        circuitBreakers: circuitBreakerHealth,
        dataFreshness: {
          status: dataFreshness,
        },
      },
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };

    const statusCode = isHealthy ? 200 : 503;
    return NextResponse.json(healthData, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        services: {
          database: { status: 'unknown' },
          backgroundJobs: { status: 'unknown' },
          circuitBreakers: { status: 'unknown' },
          dataFreshness: { status: 'unknown' },
        },
      },
      { status: 503 }
    );
  }
}

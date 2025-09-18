import { prisma } from '@repo/db';
import { NextRequest } from 'next/server';

export interface AuditLogData {
  userId: string;
  action: string;
  resource?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Audit logging service for AI Spend Guard
 * Tracks all security-relevant actions for compliance and monitoring
 */
export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          resource: data.resource,
          details: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging shouldn't break the main flow
    }
  }

  /**
   * Log API key related actions
   */
  static async logApiKeyAction(
    userId: string,
    action: 'key_added' | 'key_removed' | 'key_updated' | 'key_decrypted',
    apiKeyId: string,
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: apiKeyId,
      details: {
        ...details,
        resourceType: 'api_key',
      },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Log budget related actions
   */
  static async logBudgetAction(
    userId: string,
    action: 'budget_created' | 'budget_updated' | 'budget_deleted' | 'budget_exceeded',
    budgetId: string,
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: budgetId,
      details: {
        ...details,
        resourceType: 'budget',
      },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Log alert related actions
   */
  static async logAlertAction(
    userId: string,
    action: 'alert_created' | 'alert_updated' | 'alert_deleted' | 'alert_triggered',
    alertId: string,
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      resource: alertId,
      details: {
        ...details,
        resourceType: 'alert',
      },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Log authentication related actions
   */
  static async logAuthAction(
    userId: string,
    action: 'login' | 'logout' | 'password_change' | 'account_created' | 'account_deleted',
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      details: {
        ...details,
        resourceType: 'auth',
      },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Log billing related actions
   */
  static async logBillingAction(
    userId: string,
    action: 'subscription_created' | 'subscription_updated' | 'subscription_cancelled' | 'payment_succeeded' | 'payment_failed',
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId,
      action,
      details: {
        ...details,
        resourceType: 'billing',
      },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Log proxy usage for high-value requests
   */
  static async logProxyUsage(
    userId: string,
    apiKeyId: string,
    model: string,
    cost: number,
    request?: NextRequest
  ): Promise<void> {
    // Only log expensive requests to avoid log spam
    if (cost > 0.10) { // Log requests over $0.10
      await this.log({
        userId,
        action: 'proxy_request_expensive',
        resource: apiKeyId,
        details: {
          resourceType: 'proxy',
          model,
          cost,
        },
        ipAddress: this.getClientIP(request),
        userAgent: request?.headers.get('user-agent') || undefined,
      });
    }
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId?: string,
    request?: NextRequest,
    details?: Record<string, any>
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: `admin_${action}`,
      resource: targetUserId,
      details: {
        ...details,
        resourceType: 'admin',
        targetUserId,
      },
      ipAddress: this.getClientIP(request),
      userAgent: request?.headers.get('user-agent') || undefined,
    });
  }

  /**
   * Get client IP address from request
   */
  private static getClientIP(request?: NextRequest): string | undefined {
    if (!request) return undefined;

    // Check various headers for the real IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }

    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
      return realIP;
    }

    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fallback to connection remote address (may not be available in serverless)
    return undefined;
  }

  /**
   * Query audit logs with filtering
   */
  static async queryLogs(filters: {
    userId?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.resourceType) {
      where.details = {
        path: ['resourceType'],
        equals: filters.resourceType,
      };
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    return await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
      skip: filters.offset || 0,
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Get audit log statistics
   */
  static async getStats(userId?: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      createdAt: { gte: startDate },
    };

    if (userId) {
      where.userId = userId;
    }

    const [totalLogs, actionCounts] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
        orderBy: { _count: { action: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      totalLogs,
      actionCounts: actionCounts.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      period: `${days} days`,
    };
  }
}

export const auditLogger = AuditLogger;

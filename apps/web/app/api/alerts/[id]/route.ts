import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

const updateAlertSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  threshold: z.number().positive('Threshold must be positive').optional(),
  thresholdType: z.enum(['cost', 'tokens', 'requests']).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
  notificationMethod: z.enum(['email', 'slack', 'webhook']).optional(),
  isActive: z.boolean().optional()
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    const alertId = params.id;
    if (!alertId) {
      return createErrorResponse(400, 'Alert ID is required');
    }

    const body = await request.json();
    const validatedData = updateAlertSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Verify that the alert belongs to the authenticated user
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: user.id
      }
    });

    if (!existingAlert) {
      return createErrorResponse(404, 'Alert not found or does not belong to user');
    }

    // Update the alert
    const updatedAlert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        ...validatedData,
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        threshold: true,
        thresholdType: true,
        period: true,
        notificationMethod: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(updatedAlert);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Validation error');
    }
    console.error('Error updating alert:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    const alertId = params.id;
    if (!alertId) {
      return createErrorResponse(400, 'Alert ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Verify that the alert belongs to the authenticated user
    const existingAlert = await prisma.alert.findFirst({
      where: {
        id: alertId,
        userId: user.id
      }
    });

    if (!existingAlert) {
      return createErrorResponse(404, 'Alert not found or does not belong to user');
    }

    // Delete the alert
    await prisma.alert.delete({
      where: { id: alertId }
    });

    return createSuccessResponse({
      message: 'Alert deleted successfully',
      deletedAlertId: alertId
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

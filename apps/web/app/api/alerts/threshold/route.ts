import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { prisma } from '../../../../lib/prisma';
import { z } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    // Parse and validate request body
    const body = await request.json();
    const alertSchema = z.object({
      name: z.string().min(1, 'Name is required'),
      threshold: z.number().positive('Threshold must be positive'),
      thresholdType: z.enum(['cost', 'tokens', 'requests']).default('cost'),
      period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
      notificationMethod: z.enum(['email', 'slack', 'webhook']).default('email'),
      isActive: z.boolean().default(true),
      apiKeyId: z.string().optional()
    });
    
    const validatedData = alertSchema.parse(body);

    // Find user first to get the actual user ID
    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Create an Alert record in the database
    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        threshold: validatedData.threshold,
        thresholdType: validatedData.thresholdType,
        period: validatedData.period,
        notificationMethod: validatedData.notificationMethod,
        isActive: validatedData.isActive,
        apiKeyId: validatedData.apiKeyId
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

    return createSuccessResponse(alert);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Validation error');
    }
    console.error('Error creating alert:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

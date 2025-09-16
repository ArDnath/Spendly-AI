import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse, validateRequestBody, alertThresholdSchema } from '../../../../lib/validation';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateRequestBody(alertThresholdSchema, body);
    
    if (!validation.success) {
      return createErrorResponse(400, validation.error);
    }

    const { threshold, type } = validation.data;

    // Find user first to get the actual user ID
    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Create or update an Alert record in the database
    const alert = await prisma.alert.upsert({
      where: {
        userId_type: {
          userId: user.id,
          type: type
        }
      },
      update: {
        threshold: threshold,
        updatedAt: new Date()
      },
      create: {
        userId: user.id,
        threshold: threshold,
        type: type
      }
    });

    return createSuccessResponse({
      id: alert.id,
      threshold: alert.threshold,
      type: alert.type,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt
    }, 201);

  } catch (error) {
    console.error('Error creating/updating alert threshold:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

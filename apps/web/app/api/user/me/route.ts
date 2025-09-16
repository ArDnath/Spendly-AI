import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { prisma } from '@repo/db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    // Query the User model using Prisma
    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionPlan: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    return createSuccessResponse({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionPlan: user.subscriptionPlan,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../lib/validation';
import { prisma } from '../../../lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    // Find user first to get the actual user ID
    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Query the ApiKey model using Prisma to fetch all API keys for the user
    // Crucially, do NOT return the encryptedKey or any decrypted API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        // Explicitly exclude encryptedKey from the response
        encryptedKey: false
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return createSuccessResponse({
      apiKeys: apiKeys.map((key: any) => ({
        id: key.id,
        provider: key.provider,
        status: key.status,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching API keys:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

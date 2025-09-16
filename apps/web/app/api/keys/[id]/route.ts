import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../../lib/validation';
import { prisma } from '../../../../lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the request
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    const apiKeyId = params.id;
    if (!apiKeyId) {
      return createErrorResponse(400, 'API key ID is required');
    }

    // Find user first to get the actual user ID
    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Verify that the API key belongs to the authenticated user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        userId: user.id
      }
    });

    if (!apiKey) {
      return createErrorResponse(404, 'API key not found or does not belong to user');
    }

    // Delete the ApiKey record and associated Usage data using Prisma
    // The Usage records will be automatically deleted due to the onDelete: Cascade in the schema
    await prisma.apiKey.delete({
      where: { id: apiKeyId }
    });

    return createSuccessResponse({
      message: 'API key deleted successfully',
      deletedKeyId: apiKeyId
    });

  } catch (error) {
    console.error('Error deleting API key:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

import { NextRequest } from 'next/server';
import { authenticateRequest, createAuthResponse } from '../../../lib/auth-middleware';
import { createErrorResponse, createSuccessResponse } from '../../../lib/validation';
import { prisma } from '../../../lib/prisma';
import { z } from 'zod';

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

const createApiKeySchema = z.object({
  provider: z.string().min(1, 'Provider is required'),
  apiKey: z.string().min(1, 'API key is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return createAuthResponse(401, 'Unauthorized');
    }

    const body = await request.json();
    const validatedData = createApiKeySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: auth.userEmail }
    });

    if (!user) {
      return createErrorResponse(404, 'User not found');
    }

    // Create the API key (in production, encrypt the API key)
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        provider: validatedData.provider,
        encryptedKey: validatedData.apiKey, // In production, encrypt this
        name: validatedData.name,
        description: validatedData.description,
        status: 'active'
      },
      select: {
        id: true,
        provider: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(apiKey);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(400, 'Validation error');
    }
    console.error('Error creating API key:', error);
    return createErrorResponse(500, 'Internal server error');
  }
}

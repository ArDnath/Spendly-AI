import { prisma } from '@repo/db';

/**
 * Helper function to find or create a user by email
 * This is useful for API routes that need to ensure a user exists
 */
export async function findOrCreateUser(email: string, name?: string) {
  try {
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || null,
          subscriptionPlan: 'Free'
        }
      });
    }

    return user;
  } catch (error) {
    console.error('Error finding or creating user:', error);
    throw error;
  }
}

/**
 * Helper function to verify API key ownership
 */
export async function verifyApiKeyOwnership(apiKeyId: string, userId: string) {
  try {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        userId: userId
      }
    });

    return !!apiKey;
  } catch (error) {
    console.error('Error verifying API key ownership:', error);
    return false;
  }
}

/**
 * Helper function to get user's current month usage
 */
export async function getCurrentMonthUsage(userId: string) {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 11);

  try {
    const usage = await prisma.usage.aggregate({
      where: {
        apiKey: {
          userId: userId
        },
        createdAt: {
          gte: currentMonthStart,
          lte: currentMonthEnd
        }
      },
      _sum: {
        totalTokens: true,
        cost: true,
        requests: true
      },
      _count: {
        id: true
      }
    });

    return {
      totalCost: usage._sum?.cost || 0,
      totalTokens: usage._sum?.totalTokens || 0,
      totalRequests: usage._sum?.requests || 0,
      period: {
        start: currentMonthStart,
        end: currentMonthEnd
      }
    };
  } catch (error) {
    console.error('Error getting current month usage:', error);
    throw error;
  }
}

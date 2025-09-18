import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { decrypt } from '../../../../lib/utils';

import { calculateCost } from '../../../../lib/openai-pricing';

interface OpenAIRequest {
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
  [key: string]: any;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Calculate estimated cost for budget checking (synchronous)
 */
function estimateCost(model: string, inputTokens: number, outputTokens: number): number {
  // Fallback pricing for quick estimation
  const pricing = {
    'gpt-4': { input: 30.0, output: 60.0 },
    'gpt-4o': { input: 5.0, output: 15.0 },
    'gpt-3.5-turbo': { input: 1.5, output: 2.0 },
  };
  
  const modelKey = model.toLowerCase() as keyof typeof pricing;
  const rates = pricing[modelKey] || pricing['gpt-3.5-turbo'];
  
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;
  
  return inputCost + outputCost;
}

/**
 * Check if user has exceeded their budget limits
 */
async function checkBudgetLimits(userId: string, apiKeyId: string, estimatedCost: number) {
  // Get current month's usage
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const currentUsage = await prisma.usage.aggregate({
    where: {
      apiKey: { userId },
      createdAt: { gte: monthStart },
    },
    _sum: { cost: true },
  });

  const currentCost = currentUsage._sum.cost || 0;
  const projectedCost = currentCost + estimatedCost;

  // Check user's subscription limits
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionPlan: true },
  });

  const limits = {
    Free: 20,
    Pro: 500,
    Team: 5000,
    Advanced: 50000,
  };

  const userLimit = limits[user?.subscriptionPlan as keyof typeof limits] || limits.Free;

  // Check for active budgets/alerts that might block the request
  const activeAlerts = await prisma.alert.findMany({
    where: {
      userId,
      isActive: true,
      thresholdType: 'cost',
      apiKeyId: apiKeyId,
    },
  });

  // Check if any hard limits would be exceeded
  for (const alert of activeAlerts) {
    if (projectedCost >= alert.threshold && alert.notificationMethod.includes('block')) {
      return {
        allowed: false,
        reason: `Hard limit exceeded: $${alert.threshold}`,
        currentCost,
        projectedCost,
      };
    }
  }

  // Check subscription limit
  if (projectedCost > userLimit) {
    return {
      allowed: false,
      reason: `Subscription limit exceeded: $${userLimit}`,
      currentCost,
      projectedCost,
    };
  }

  return {
    allowed: true,
    currentCost,
    projectedCost,
  };
}

/**
 * Record usage in real-time
 */
async function recordUsage(
  apiKeyId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  cost: number
) {
  await prisma.usage.create({
    data: {
      apiKeyId,
      provider: 'openai',
      endpoint: 'chat/completions',
      modelUsed: model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      requests: 1,
      cost,
      mostExpensiveEndpoint: 'chat/completions',
      date: new Date(),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get API key from headers
    const apiKeyHeader = request.headers.get('x-api-key-id');
    if (!apiKeyHeader) {
      return NextResponse.json({ 
        error: 'API Key ID required in x-api-key-id header' 
      }, { status: 400 });
    }

    // Verify API key belongs to user
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        id: apiKeyHeader,
        userId: user.id,
        status: 'active',
        provider: 'openai',
      },
    });

    if (!apiKeyRecord) {
      return NextResponse.json({ 
        error: 'Invalid or inactive API key' 
      }, { status: 403 });
    }

    // Parse request body
    const body: OpenAIRequest = await request.json();
    
    // Estimate tokens for budget checking (rough approximation)
    const estimatedInputTokens = JSON.stringify(body.messages).length / 4; // ~4 chars per token
    const estimatedOutputTokens = body.max_tokens || 150; // Default estimate
    const estimatedCost = estimateCost(body.model, estimatedInputTokens, estimatedOutputTokens);

    // Check budget limits before making the request
    const budgetCheck = await checkBudgetLimits(user.id, apiKeyRecord.id, estimatedCost);
    
    if (!budgetCheck.allowed) {
      return NextResponse.json({
        error: 'Request blocked',
        reason: budgetCheck.reason,
        currentCost: budgetCheck.currentCost,
        projectedCost: budgetCheck.projectedCost,
      }, { status: 429 });
    }

    // Decrypt the API key
    const decryptedKey = decrypt(apiKeyRecord.encryptedKey);

    // Forward request to OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${decryptedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      return NextResponse.json({
        error: 'OpenAI API error',
        details: errorText,
      }, { status: openaiResponse.status });
    }

    const openaiData: OpenAIResponse = await openaiResponse.json();

    // Record actual usage with accurate cost calculation
    const actualCost = await calculateCost(
      openaiData.model,
      openaiData.usage.prompt_tokens,
      openaiData.usage.completion_tokens
    );

    await recordUsage(
      apiKeyRecord.id,
      openaiData.model,
      openaiData.usage.prompt_tokens,
      openaiData.usage.completion_tokens,
      actualCost
    );

    // Add usage tracking metadata to response
    const responseWithMetadata = {
      ...openaiData,
      spendly_metadata: {
        cost: actualCost,
        currentMonthTotal: budgetCheck.currentCost + actualCost,
        apiKeyId: apiKeyRecord.id,
        tracked: true,
      },
    };

    return NextResponse.json(responseWithMetadata);

  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key-id',
    },
  });
}

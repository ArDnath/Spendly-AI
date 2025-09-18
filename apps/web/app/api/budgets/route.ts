import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { z } from 'zod';

const createBudgetSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().min(0).max(100000),
  period: z.enum(['daily', 'weekly', 'monthly']),
  type: z.enum(['soft', 'hard']),
  apiKeyId: z.string().optional(),
});

const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().min(0).max(100000).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
  type: z.enum(['soft', 'hard']).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const budgets = await prisma.budget.findMany({
      where: { userId: user.id },
      include: {
        apiKey: {
          select: { id: true, name: true, provider: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = createBudgetSchema.parse(body);

    // Verify API key belongs to user if specified
    if (validatedData.apiKeyId) {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: validatedData.apiKeyId,
          userId: user.id,
        },
      });

      if (!apiKey) {
        return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
      }
    }

    const budget = await prisma.budget.create({
      data: {
        userId: user.id,
        name: validatedData.name,
        amount: validatedData.amount,
        period: validatedData.period,
        type: validatedData.type,
        apiKeyId: validatedData.apiKeyId,
      },
      include: {
        apiKey: {
          select: { id: true, name: true, provider: true },
        },
      },
    });

    return NextResponse.json({ budget }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating budget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

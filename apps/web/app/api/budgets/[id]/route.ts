import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { z } from 'zod';

const updateBudgetSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  amount: z.number().min(0).max(100000).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).optional(),
  type: z.enum(['soft', 'hard']).optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateBudgetSchema.parse(body);

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    const updatedBudget = await prisma.budget.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        apiKey: {
          select: { id: true, name: true, provider: true },
        },
      },
    });

    return NextResponse.json({ budget: updatedBudget });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating budget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify budget belongs to user
    const existingBudget = await prisma.budget.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!existingBudget) {
      return NextResponse.json({ error: 'Budget not found' }, { status: 404 });
    }

    await prisma.budget.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

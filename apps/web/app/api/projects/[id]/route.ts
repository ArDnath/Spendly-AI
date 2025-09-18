import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { z } from 'zod';
import { auditLogger } from '../../../../lib/audit-logger';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

export async function GET(
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

    // Check if user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: user.id }, // Personal project
          {
            organization: {
              members: {
                some: {
                  userId: user.id,
                },
              },
            },
          }, // Organization project where user is member
        ],
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        apiKeys: {
          select: {
            id: true,
            name: true,
            provider: true,
            status: true,
            createdAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        budgets: {
          select: {
            id: true,
            name: true,
            amount: true,
            period: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });

  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    // Check if user has permission to update the project
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: user.id }, // Personal project
          {
            organization: {
              OR: [
                { ownerId: user.id }, // Organization owner
                {
                  members: {
                    some: {
                      userId: user.id,
                      role: {
                        in: ['ADMIN', 'MEMBER'],
                      },
                    },
                  },
                }, // Organization admin/member
              ],
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or insufficient permissions' }, { status: 404 });
    }

    const body = await request.json();
    const updateData = updateProjectSchema.parse(body);

    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await auditLogger.log({
      userId: user.id,
      action: 'project_updated',
      resource: project.id,
      details: {
        resourceType: 'project',
        changes: updateData,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ project: updatedProject });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating project:', error);
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

    // Check if user has permission to delete the project
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        OR: [
          { userId: user.id }, // Personal project
          {
            organization: {
              OR: [
                { ownerId: user.id }, // Organization owner
                {
                  members: {
                    some: {
                      userId: user.id,
                      role: 'ADMIN',
                    },
                  },
                }, // Organization admin
              ],
            },
          },
        ],
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found or insufficient permissions' }, { status: 404 });
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: params.id },
    });

    await auditLogger.log({
      userId: user.id,
      action: 'project_deleted',
      resource: project.id,
      details: {
        resourceType: 'project',
        projectName: project.name,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

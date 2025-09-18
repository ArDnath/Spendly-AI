import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { z } from 'zod';
import { auditLogger } from '../../../lib/audit-logger';

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  organizationId: z.string().optional(),
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

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    let whereClause: any = {
      OR: [
        { userId: user.id }, // Personal projects
        {
          organization: {
            members: {
              some: {
                userId: user.id,
              },
            },
          },
        }, // Organization projects where user is member
      ],
    };

    if (organizationId) {
      whereClause = {
        organizationId,
        organization: {
          members: {
            some: {
              userId: user.id,
            },
          },
        },
      };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
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
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ projects });

  } catch (error) {
    console.error('Error fetching projects:', error);
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
    const { name, description, organizationId } = createProjectSchema.parse(body);

    // If organizationId is provided, verify user has access
    if (organizationId) {
      const organization = await prisma.organization.findFirst({
        where: {
          id: organizationId,
          members: {
            some: {
              userId: user.id,
              role: {
                in: ['OWNER', 'ADMIN', 'MEMBER'],
              },
            },
          },
        },
      });

      if (!organization) {
        return NextResponse.json({ error: 'Organization not found or insufficient permissions' }, { status: 404 });
      }
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        userId: user.id,
        organizationId,
      },
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
      action: 'project_created',
      resource: project.id,
      details: {
        resourceType: 'project',
        projectName: name,
        organizationId,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ project }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

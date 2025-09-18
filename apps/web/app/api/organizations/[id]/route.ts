import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@repo/db';
import { z } from 'zod';
import { auditLogger } from '../../../../lib/audit-logger';

const updateOrganizationSchema = z.object({
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

    // Check if user is a member of the organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: params.id,
        members: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        projects: {
          include: {
            apiKeys: {
              select: {
                id: true,
                name: true,
                provider: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ organization });

  } catch (error) {
    console.error('Error fetching organization:', error);
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

    // Check if user is owner or admin of the organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: user.id },
          {
            members: {
              some: {
                userId: user.id,
                role: 'ADMIN',
              },
            },
          },
        ],
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found or insufficient permissions' }, { status: 404 });
    }

    const body = await request.json();
    const updateData = updateOrganizationSchema.parse(body);

    const updatedOrganization = await prisma.organization.update({
      where: { id: params.id },
      data: updateData,
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    await auditLogger.log({
      userId: user.id,
      action: 'organization_updated',
      resource: organization.id,
      details: {
        resourceType: 'organization',
        changes: updateData,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ organization: updatedOrganization });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating organization:', error);
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

    // Check if user is owner of the organization
    const organization = await prisma.organization.findFirst({
      where: {
        id: params.id,
        ownerId: user.id,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found or insufficient permissions' }, { status: 404 });
    }

    // Delete organization (cascade will handle related records)
    await prisma.organization.delete({
      where: { id: params.id },
    });

    await auditLogger.log({
      userId: user.id,
      action: 'organization_deleted',
      resource: organization.id,
      details: {
        resourceType: 'organization',
        organizationName: organization.name,
      },
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ message: 'Organization deleted successfully' });

  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

// GET /api/projects/[id] - Get single project
export async function GET(request: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        script: true,
        ttsResult: true,
        segments: {
          orderBy: (segments, { asc }) => [asc(segments.segmentOrder)],
          with: {
            selectedImage: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Failed to fetch project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(request: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { title, description, targetDuration, aspectRatio, resolution, status } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (targetDuration !== undefined) updateData.targetDuration = targetDuration;
    if (aspectRatio !== undefined) updateData.aspectRatio = aspectRatio;
    if (resolution !== undefined) updateData.resolution = resolution;
    if (status !== undefined) updateData.status = status;

    const [updatedProject] = await db.update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    if (!updatedProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error('Failed to update project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, context: Params) {
  try {
    const { id } = await context.params;
    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

// GET /api/projects - List all projects
export async function GET() {
  try {
    const allProjects = await db.query.projects.findMany({
      orderBy: [desc(projects.updatedAt)],
    });

    return NextResponse.json(allProjects);
  } catch (error) {
    console.error('Failed to fetch projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, targetDuration, aspectRatio, resolution } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const [newProject] = await db.insert(projects).values({
      title,
      description: description || null,
      targetDuration: targetDuration || null,
      aspectRatio: aspectRatio || '16:9',
      resolution: resolution || '1920x1080',
      status: 'draft',
    }).returning();

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error('Failed to create project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          emailNotifications: true,
          messageNotifications: true,
          reportNotifications: true,
        },
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();

    // Validate the request body
    const validKeys = ['emailNotifications', 'messageNotifications', 'reportNotifications'];
    const updates = Object.entries(body).reduce((acc, [key, value]) => {
      if (validKeys.includes(key) && typeof value === 'boolean') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, boolean>);

    if (Object.keys(updates).length === 0) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: updates,
      create: {
        userId: session.user.id,
        ...updates,
        // Set defaults for any missing fields
        emailNotifications: updates.emailNotifications ?? true,
        messageNotifications: updates.messageNotifications ?? true,
        reportNotifications: updates.reportNotifications ?? true,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
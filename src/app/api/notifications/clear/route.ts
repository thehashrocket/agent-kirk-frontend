// src/app/api/notifications/clear/route.ts

import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.notification.deleteMany({
      where: {
        userId: session.user.id,
      },
    });
  } catch (error) {
    console.error('Failed to clear notifications:', error);
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
  return NextResponse.json({ message: 'Notifications cleared' }, { status: 200 });
}
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { getAccountRepReportData } from '@/lib/services/reports';
import { prisma } from '@/lib/prisma';

const reportRequestSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the current user and verify they are an account rep
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { role: true },
    });

    if (!currentUser || currentUser.role.name !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const json = await request.json();
    const body = reportRequestSchema.parse(json);

    const reportData = await getAccountRepReportData(
      currentUser.id,
      body.startDate,
      body.endDate
    );

    return NextResponse.json(reportData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    console.error('Error fetching account rep report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 
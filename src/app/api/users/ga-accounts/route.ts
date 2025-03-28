import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { gaAccountId, gaAccountName } = await req.json();

    if (!gaAccountId || !gaAccountName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const gaAccount = await prisma.gaAccount.create({
      data: {
        gaAccountId,
        gaAccountName,
        userId: session.user.id,
      },
    });

    return NextResponse.json(gaAccount);
  } catch (error) {
    console.error('Error adding GA account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
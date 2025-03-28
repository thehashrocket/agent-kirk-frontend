/**
 * @file src/app/api/users/[id]/ga-accounts/route.ts
 * API route for managing Google Analytics accounts for a user
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { gaAccountId, gaAccountName } = body;

    if (!gaAccountId || !gaAccountName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const gaAccount = await prisma.gaAccount.create({
      data: {
        gaAccountId,
        gaAccountName,
        userId: params.id,
      },
    });

    return NextResponse.json(gaAccount);
  } catch (error) {
    console.error('Error in GA account creation:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const gaAccounts = await prisma.gaAccount.findMany({
      where: {
        userId: params.id,
      },
      include: {
        gaProperties: true,
      },
    });

    return NextResponse.json(gaAccounts);
  } catch (error) {
    console.error('Error fetching GA accounts:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 
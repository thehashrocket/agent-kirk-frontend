/**
 * @file src/app/api/users/[id]/ga-accounts/[accountId]/properties/route.ts
 * API route for managing Google Analytics properties for a GA account
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { id: string; accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify the GA account belongs to the user
    const gaAccount = await prisma.gaAccount.findFirst({
      where: {
        id: params.accountId,
        userId: params.id,
      },
    });

    if (!gaAccount) {
      return new NextResponse('GA Account not found or unauthorized', { status: 404 });
    }

    const body = await request.json();
    const { gaPropertyId, gaPropertyName } = body;

    if (!gaPropertyId || !gaPropertyName) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const gaProperty = await prisma.gaProperty.create({
      data: {
        gaPropertyId,
        gaPropertyName,
        gaAccountId: params.accountId,
      },
    });

    return NextResponse.json(gaProperty);
  } catch (error) {
    console.error('Error in GA property creation:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify the GA account belongs to the user
    const gaAccount = await prisma.gaAccount.findFirst({
      where: {
        id: params.accountId,
        userId: params.id,
      },
    });

    if (!gaAccount) {
      return new NextResponse('GA Account not found or unauthorized', { status: 404 });
    }

    const gaProperties = await prisma.gaProperty.findMany({
      where: {
        gaAccountId: params.accountId,
      },
    });

    return NextResponse.json(gaProperties);
  } catch (error) {
    console.error('Error fetching GA properties:', error);
    return new NextResponse('Internal error', { status: 500 });
  }
} 
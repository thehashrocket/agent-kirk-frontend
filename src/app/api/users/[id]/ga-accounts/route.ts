/**
 * @fileoverview API route handlers for managing Google Analytics accounts for users.
 * This module provides endpoints to create and retrieve GA accounts associated with a user.
 * 
 * @route POST /api/users/[id]/ga-accounts - Create a new GA account for a user
 * @route GET /api/users/[id]/ga-accounts - Retrieve all GA accounts for a user
 * 
 * @see Related files:
 * - lib/auth.ts - Authentication configuration
 * - lib/prisma.ts - Database client
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Validation schema for GA account creation
 */
const gaAccountSchema = z.object({
  gaAccountId: z.string().min(1, 'GA Account ID is required'),
  gaAccountName: z.string().min(1, 'GA Account Name is required'),
});

type GaAccountInput = z.infer<typeof gaAccountSchema>;

/**
 * Custom error class for GA account-related errors
 */
class GaAccountError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'GaAccountError';
  }
}

/**
 * Creates a new Google Analytics account for a user
 * 
 * @param request - The incoming request containing GA account details
 * @param params - Route parameters containing the user ID
 * @returns The created GA account or an error response
 * 
 * @throws {GaAccountError} If validation fails or user is unauthorized
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      throw new GaAccountError('Unauthorized', 401);
    }

    const body = await request.json();
    const validatedData = gaAccountSchema.parse(body);

    const { id } = await params;

    const gaAccount = await prisma.gaAccount.create({
      data: {
        gaAccountId: validatedData.gaAccountId,
        gaAccountName: validatedData.gaAccountName,
        userId: id,
      },
    });

    return NextResponse.json(gaAccount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof GaAccountError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Error in GA account creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Retrieves all Google Analytics accounts for a user
 * 
 * @param request - The incoming request
 * @param params - Route parameters containing the user ID
 * @returns An array of GA accounts with their properties or an error response
 * 
 * @throws {GaAccountError} If user is unauthorized or forbidden
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await Promise.resolve(params);

    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new GaAccountError('Unauthorized', 401);
    }

    if (session.user.id !== id) {
      throw new GaAccountError('Forbidden - User can only access their own accounts', 403);
    }

    const gaAccounts = await prisma.gaAccount.findMany({
      where: {
        userId: id,
      },
      include: {
        gaProperties: true,
      },
    });

    return NextResponse.json(gaAccounts);
  } catch (error) {
    if (error instanceof GaAccountError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error('Error fetching GA accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
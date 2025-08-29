/**
 * @fileoverview Current User Profile API Route
 *
 * This route handles fetching and updating the current authenticated user's profile.
 * It includes basic profile information and associated Google Analytics accounts.
 *
 * @route GET /api/users/me
 * @route PATCH /api/users/me
 * @security Requires authentication via NextAuth session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateUserSchema = z.object({
  companyId: z.string().optional(),
  name: z.string().optional(),
});

/**
 * GET handler for retrieving the current user's profile
 *
 * @returns {Promise<NextResponse>} JSON response containing user data or error
 *
 * @throws {401} If user is not authenticated
 * @throws {404} If user is not found in database
 * @throws {500} If there's an internal server error
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        role: true,
        accountRep: true,
        userToGaAccounts: {
          where: {
            gaAccount: {
              deleted: false
            }
          },
          include: {
            gaAccount: {
              include: {
                gaProperties: {
                  where: {
                    deleted: false,
                  },
                },
              },
            },
          },
        },
        company: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * PATCH handler for updating the current user's profile
 *
 * @param request - Request object containing update data
 * @returns {Promise<NextResponse>} JSON response containing updated user data
 *
 * @body {string} [companyId] - Company ID to assign to user
 * @body {string} [name] - User's name
 * @throws {401} If user is not authenticated
 * @throws {400} If request body is invalid
 * @throws {404} If user or company is not found
 * @throws {500} If there's an internal server error
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!existingUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // If companyId is provided, verify the company exists
    if (validatedData.companyId) {
      const company = await prisma.company.findUnique({
        where: { id: validatedData.companyId },
      });

      if (!company) {
        return new NextResponse('Company not found', { status: 404 });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(validatedData.companyId !== undefined && { companyId: validatedData.companyId }),
        ...(validatedData.name !== undefined && { name: validatedData.name }),
      },
      include: {
        role: true,
        company: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Error updating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
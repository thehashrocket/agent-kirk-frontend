/**
 * @fileoverview User Profile API Route
 * 
 * This route handles user profile operations with role-based access control (RBAC).
 * It supports fetching user profiles based on the following permissions:
 * - Users can access their own profile
 * - Admins can access any profile
 * - Account representatives can access their clients' profiles
 * 
 * @route GET /api/users/[id]
 * @requires next-auth - For session management
 * @requires @prisma/client - For database operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Retrieves a user's profile with role-based access control.
 * 
 * @param {Request} request - The incoming HTTP request
 * @param {Object} context - The route context containing path parameters
 * @param {string} context.params.id - The ID of the user to retrieve
 * 
 * @returns {Promise<NextResponse>} JSON response containing user data or error
 * 
 * @throws {401} - When no valid session exists
 * @throws {403} - When user lacks permission to access the profile
 * @throws {404} - When target user or current user is not found
 * @throws {500} - On internal server errors
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { role: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Find the requested user
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        userToGaAccounts: {
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
        sproutSocialAccounts: {
          include: {
            sproutSocialAccount: true,
          },
        },
        emailClients: {
          include: {
            emailClient: true,
          },
        },
        company: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Allow users to access their own profile
    if (currentUser.id === user.id) {
      return NextResponse.json(user);
    }

    // Allow admins to access any profile
    if (currentUser.role.name === 'ADMIN') {
      return NextResponse.json(user);
    }

    // Allow account reps to access their clients' profiles
    if (currentUser.role.name === 'ACCOUNT_REP' && user.accountRepId === currentUser.id) {
      return NextResponse.json(user);
    }

    // If none of the above conditions are met, return forbidden
    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 

// DELETE /api/users/[id]
// Soft delete a user
// Soft delete GaAccounts and GaProperties
// Requires admin or account rep role
// Returns 200 on success
// Returns 401 if not authenticated
// Returns 403 if not authorized
// Returns 404 if user not found
// Returns 500 on internal server error

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { role: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (currentUser.role.name !== 'ADMIN' && currentUser.role.name !== 'ACCOUNT_REP') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    await prisma.user.update({
      where: { id },
      data: { deleted: true },
    });

    await prisma.gaAccount.updateMany({
      where: {
        userToGaAccounts: {
          some: {
            userId: id
          }
        }
      },
      data: { deleted: true },
    });

    // Soft delete all GaProperties associated with the user's GaAccounts
    const gaAccounts = await prisma.gaAccount.findMany({
      where: {
        userToGaAccounts: {
          some: {
            userId: id
          }
        }
      },
    });
    for (const gaAccount of gaAccounts) {
      await prisma.gaProperty.updateMany({
        where: { gaAccountId: gaAccount.id },
        data: { deleted: true },
      });
    }

    return new NextResponse('User deleted successfully', { status: 200 });
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Requires admin or account rep role
// Returns 200 on success
// Returns 401 if not authenticated
// Returns 403 if not authorized
// Returns 404 if user not found
// Returns 500 on internal server error

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { role: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    if (currentUser.role.name !== 'ADMIN' && currentUser.role.name !== 'ACCOUNT_REP') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        userToGaAccounts: {
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
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Parse request body to get update data
    const body = await request.json();
    const updateData: any = {};

    // Handle isActive updates
    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    // Handle roleId updates
    if (body.roleId) {
      updateData.roleId = body.roleId;
    }

    // Add other updateable fields here as needed
    // if (body.name) updateData.name = body.name;
    // if (body.email) updateData.email = body.email;

    // Only proceed if there's something to update
    if (Object.keys(updateData).length === 0) {
      return new NextResponse('No valid update data provided', { status: 400 });
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        userToGaAccounts: {
          include: {
            gaAccount: {
              include: {
                gaProperties: {
                  where: { deleted: false },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
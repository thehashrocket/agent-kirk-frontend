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

    console.log('Session user:', session.user);

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { role: true },
    });

    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    console.log('Current user:', {
      id: currentUser.id,
      role: currentUser.role.name,
      email: currentUser.email
    });

    // Find the requested user
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        gaAccounts: {
          include: {
            gaProperties: true,
          },
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    console.log('Requested user:', {
      id: user.id,
      role: user.role.name,
      accountRepId: user.accountRepId
    });

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
    console.log('Access denied:', {
      currentUserRole: currentUser.role.name,
      currentUserId: currentUser.id,
      requestedUserId: user.id,
      accountRepId: user.accountRepId
    });

    return new NextResponse('Forbidden', { status: 403 });
  } catch (error) {
    console.error('Error fetching user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
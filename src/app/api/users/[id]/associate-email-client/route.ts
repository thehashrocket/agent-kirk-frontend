/**
 * @file src/app/api/users/[id]/associate-email-client/route.ts
 * API endpoint for associating and disassociating users with Email Clients.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Validation schema for Email Client association
 */
const associateEmailClientSchema = z.object({
  emailClientId: z.string().min(1, 'Email Client ID is required'),
});

type AssociateEmailClientInput = z.infer<typeof associateEmailClientSchema>;

/**
 * POST /api/users/[id]/associate-email-client
 * 
 * Associates a user with an Email Client.
 * 
 * Request Body:
 * {
 *   "emailClientId": "string" // The ID of the Email Client to associate
 * }
 * 
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 * 
 * Response:
 * - 201: Successfully associated Email Client
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 403: Forbidden (not admin/account rep role)
 * - 404: User or Email Client not found
 * - 500: Server error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user information including role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'Current user not found in database' }, { status: 404 });
    }

    // Check admin/account rep role
    if (currentUser.role.name !== 'ADMIN' && currentUser.role.name !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden: Admin/Account Rep access required' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = associateEmailClientSchema.parse(body);

    // Get the target user ID from params
    const targetUserId = (await params).id;

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target user not found', userId: targetUserId },
        { status: 404 }
      );
    }

    // Verify the Email Client exists
    const emailClient = await prisma.emailClient.findFirst({
      where: {
        id: validatedData.emailClientId,
      },
    });

    if (!emailClient) {
      return NextResponse.json({ error: 'Email Client not found' }, { status: 404 });
    }

    // Check if the association already exists
    const existingAssociation = await prisma.userToEmailClient.findFirst({
      where: {
        userId: targetUserId,
        emailClientId: validatedData.emailClientId,
      },
    });

    if (existingAssociation) {
      return NextResponse.json({ error: 'Email Client already associated with user' }, { status: 400 });
    }

    // Create the association
    const userToEmailClient = await prisma.userToEmailClient.create({
      data: {
        userId: targetUserId,
        emailClientId: validatedData.emailClientId,
      },
      include: {
        emailClient: true,
      },
    });

    return NextResponse.json(userToEmailClient.emailClient, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error associating Email Client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/[id]/associate-email-client
 * 
 * Unassociates a user from an Email Client.
 * 
 * Query Parameters:
 * - emailClientId: The ID of the Email Client to unassociate
 * 
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 * 
 * Response:
 * - 204: Successfully unassociated Email Client
 * - 400: Invalid request parameters
 * - 401: Unauthorized
 * - 403: Forbidden (not admin/account rep role)
 * - 404: User or Email Client not found
 * - 500: Server error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user information including role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check admin/account rep role
    if (currentUser.role.name !== 'ADMIN' && currentUser.role.name !== 'ACCOUNT_REP') {
      return NextResponse.json({ error: 'Forbidden: Admin/Account Rep access required' }, { status: 403 });
    }

    // Get Email Client ID from query parameters
    const { searchParams } = new URL(request.url);
    const emailClientId = searchParams.get('emailClientId');

    if (!emailClientId) {
      return NextResponse.json({ error: 'Email Client ID is required' }, { status: 400 });
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: (await params).id },
      include: { role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Find and delete the association
    const association = await prisma.userToEmailClient.findFirst({
      where: {
        userId: (await params).id,
        emailClientId: emailClientId,
      },
    });

    if (!association) {
      return NextResponse.json({ error: 'Email Client not associated with user' }, { status: 404 });
    }

    // Delete the association
    await prisma.userToEmailClient.delete({
      where: {
        id: association.id,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error unassociating Email Client:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
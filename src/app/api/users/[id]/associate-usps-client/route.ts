/**
 * @file src/app/api/users/[id]/associate-usps-client/route.ts
 * API endpoint for associating and disassociating users with USPS Clients.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

/**
 * Validation schema for USPS account association
 */
const associateUspsClientSchema = z.object({
    uspsClientId: z.string().min(1, 'USPS Client ID is required'),
});

type AssociateUspsClientInput = z.infer<typeof associateUspsClientSchema>;

/**
 * POST /api/users/[id]/associate-usps-client
 *
 * Associates a user with a USPS Client.
 *
 * Request Body:
 * {
 *   "uspsClientId": "string" // The ID of the USPS Client to associate
 * }
 *
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 *
 * Response:
 * - 201: Successfully associated USPS Client
 * - 400: Invalid request body
 * - 401: Unauthorized
 * - 403: Forbidden (not admin/account rep role)
 * - 404: User or USPS Client not found
 * - 500: Server error
 */

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    console.log('POST /api/users/[id]/associate-usps-client called');
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = associateUspsClientSchema.safeParse(body);

        if (!validatedData.success) {
            return NextResponse.json({ error: validatedData.error.errors }, { status: 400 });
        }

        // Get the target user ID from params
        const { id: targetUserId } = await params;

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: { role: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        // Verify the USPS account exists
        const uspsClient = await prisma.uspsClient.findUnique({
            where: { id: validatedData.data.uspsClientId },
        });

        if (!uspsClient) {
            return NextResponse.json({ error: 'USPS Client not found' }, { status: 404 });
        }

        // Check if the association already exists
        const existingAssociation = await prisma.userToUspsClient.findFirst({
            where: {
                userId: targetUserId,
                uspsClientId: validatedData.data.uspsClientId,
            },
        });

        if (existingAssociation) {
            return NextResponse.json(
                { error: 'USPS Client already associated with this user' },
                { status: 400 }
            );
        }

        // Create the association
        await prisma.userToUspsClient.create({
            data: {
                userId: targetUserId,
                uspsClientId: validatedData.data.uspsClientId,
            },
            include: {
                uspsClient: true,
            },
        });

        // Return success response
        return NextResponse.json({ message: 'USPS Client associated successfully' }, { status: 201 });
    } catch (error) {
        console.error('Error associating USPS Client:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/users/[id]/associate-usps-client
 *
 * Unassociates a user from a USPS Client.
 *
 * Query Parameters:
 * - uspsclientId: The ID of the USPS Client to unassociate
 *
 * Authentication:
 * - Requires valid session with ADMIN or ACCOUNT_REP role
 *
 * Response:
 * - 204: Successfully unassociated USPS Client
 * - 400: Invalid request parameters
 * - 401: Unauthorized
 * - 403: Forbidden (not admin/account rep role)
 * - 404: User or USPS Client not found
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
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get the target user ID from params
        const { id: targetUserId } = await params;

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            include: { role: true },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
        }

        // Parse query parameters
        const url = new URL(request.url);
        const uspsClientId = url.searchParams.get('uspsClientId');

        if (!uspsClientId) {
            return NextResponse.json({ error: 'USPS Client ID is required' }, { status: 400 });
        }

        // Verify the USPS Client exists
        const uspsClient = await prisma.uspsClient.findUnique({
            where: { id: uspsClientId },
        });

        if (!uspsClient) {
            return NextResponse.json({ error: 'USPS Client not found' }, { status: 404 });
        }

        // Check if the association exists
        const existingAssociation = await prisma.userToUspsClient.findFirst({
            where: {
                userId: targetUserId,
                uspsClientId,
            },
        });

        if (!existingAssociation) {
            return NextResponse.json({ error: 'Association not found' }, { status: 404 });
        }

        // Delete the association
        await prisma.userToUspsClient.delete({
            where: {
                id: existingAssociation.id,
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error('Error unassociating USPS Client:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Validation failed', details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
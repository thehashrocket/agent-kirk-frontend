/**
 * @fileoverview User Associations API Route
 * 
 * This route handles fetching all associations for the current authenticated user.
 * It includes Google Analytics properties, Sprout Social accounts, and Email clients.
 * 
 * @route GET /api/users/me/associations
 * @security Requires authentication via NextAuth session
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET handler for retrieving all user associations
 * 
 * @returns {Promise<NextResponse>} JSON response containing user associations or error
 * 
 * @throws {401} If user is not authenticated
 * @throws {404} If user is not found in database
 * @throws {500} If there's an internal server error
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        role: true,
        // Google Analytics accounts and properties
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
        // Sprout Social accounts
        sproutSocialAccounts: {
          include: {
            sproutSocialAccount: true,
          },
        },
        // Email clients
        emailClients: {
          include: {
            emailClient: true,
          },
        },
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Transform the data to return clean arrays of IDs
    const associations = {
      gaPropertyIds: user.userToGaAccounts.flatMap(uta => 
        uta.gaAccount.gaProperties.map(property => property.id)
      ),
      sproutSocialAccountIds: user.sproutSocialAccounts.map(ssa => 
        ssa.sproutSocialAccount.id
      ),
      emailClientIds: user.emailClients.map(ec => 
        ec.emailClient.id
      ),
    };

    console.log('[User Associations API] User associations:', {
      userId: user.id,
      gaAccounts: user.userToGaAccounts.map(uta => ({
        accountId: uta.gaAccount.id,
        accountName: uta.gaAccount.gaAccountName,
        propertyCount: uta.gaAccount.gaProperties.length,
        properties: uta.gaAccount.gaProperties.map(p => ({ id: p.id, name: p.gaPropertyName }))
      })),
      totalGaPropertyIds: associations.gaPropertyIds.length,
      gaPropertyIds: associations.gaPropertyIds,
      sproutSocialAccountIds: associations.sproutSocialAccountIds,
      emailClientIds: associations.emailClientIds,
    });

    return NextResponse.json(associations);
  } catch (error) {
    console.error('Error fetching user associations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
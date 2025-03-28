/**
 * @fileoverview User Settings API Route
 * 
 * This route handles user settings management operations:
 * - Retrieving user settings with default fallback
 * - Updating user notification preferences and theme
 * 
 * Features:
 * - Authentication via NextAuth session
 * - Automatic creation of default settings for new users
 * - Validation of settings updates
 * - Error handling with appropriate status codes
 * 
 * @route GET /api/user/settings - Retrieve user settings
 * @route PUT /api/user/settings - Update user settings
 * @security Requires authentication via NextAuth session
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * Interface for user settings in the system
 * @property {string} userId - ID of the user these settings belong to
 * @property {boolean} emailNotifications - Whether email notifications are enabled
 * @property {string} [theme] - User's preferred theme
 * @property {number} apiCredits - Available API credits
 * @property {number} apiCreditsLimit - Maximum API credits allowed
 */
interface UserSettings {
  userId: string;
  emailNotifications: boolean;
  theme?: string | null;
  apiCredits: number;
  apiCreditsLimit: number;
}

/**
 * GET handler for retrieving user settings
 * Creates default settings if none exist for the user
 * 
 * @returns {Promise<NextResponse>} JSON response containing user settings
 * 
 * @throws {401} Unauthorized - If user is not authenticated
 * @throws {500} Internal Server Error - If database operation fails
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = await prisma.userSettings.create({
        data: {
          userId: session.user.id,
          emailNotifications: true,
          apiCredits: 0,
          apiCreditsLimit: 1000,
        },
      });
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * PUT handler for updating user settings
 * Validates and applies changes to settings
 * 
 * @param {Request} req - The incoming HTTP request
 * @returns {Promise<NextResponse>} JSON response containing updated settings
 * 
 * @throws {401} Unauthorized - If user is not authenticated
 * @throws {400} Bad Request - If request body is invalid
 * @throws {500} Internal Server Error - If database operation fails
 */
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();

    // Type for valid update fields
    type UpdateFields = {
      emailNotifications?: boolean;
      theme?: string | null;
    };

    // Validate the request body
    const updates: UpdateFields = {};
    
    // Handle emailNotifications (boolean)
    if ('emailNotifications' in body && typeof body.emailNotifications === 'boolean') {
      updates.emailNotifications = body.emailNotifications;
    }
    
    // Handle theme (string | null)
    if ('theme' in body && (typeof body.theme === 'string' || body.theme === null)) {
      updates.theme = body.theme;
    }

    if (Object.keys(updates).length === 0) {
      return new NextResponse('Invalid request body', { status: 400 });
    }

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: updates,
      create: {
        userId: session.user.id,
        ...updates,
        emailNotifications: updates.emailNotifications ?? true,
        apiCredits: 0,
        apiCreditsLimit: 1000,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
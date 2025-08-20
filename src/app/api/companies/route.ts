/**
 * @fileoverview Companies API Route
 * 
 * This route handles searching for companies and creating new companies.
 * Used primarily in the onboarding process for company selection.
 * 
 * @route GET /api/companies - Search companies by name
 * @route POST /api/companies - Create a new company
 * @security Requires authentication via NextAuth session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255, 'Company name is too long'),
});

/**
 * GET handler for searching companies by name
 * 
 * @param request - Request object containing search query
 * @returns {Promise<NextResponse>} JSON response containing matching companies
 * 
 * @query {string} q - Search query for company name
 * @throws {401} If user is not authenticated
 * @throws {500} If there's an internal server error
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    const companies = await prisma.company.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: [
        {
          name: 'asc',
        },
      ],
      take: 10, // Limit results to prevent overwhelming the UI
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error searching companies:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST handler for creating a new company
 * 
 * @param request - Request object containing company data
 * @returns {Promise<NextResponse>} JSON response containing created company
 * 
 * @body {string} name - Company name
 * @throws {401} If user is not authenticated
 * @throws {400} If request body is invalid
 * @throws {409} If company with the same name already exists
 * @throws {500} If there's an internal server error
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const validatedData = createCompanySchema.parse(body);

    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
        },
      },
    });

    if (existingCompany) {
      return new NextResponse('Company with this name already exists', { status: 409 });
    }

    // Create the new company
    const company = await prisma.company.create({
      data: {
        name: validatedData.name,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    console.error('Error creating company:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
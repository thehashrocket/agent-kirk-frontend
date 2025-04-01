import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  context: { params: Promise<{ queryId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { rating } = await request.json();
    const params = await context.params;
    const cleanQueryId = params.queryId.replace('-response', ''); // Remove -response suffix if present

    // Validate rating
    if (rating !== -1 && rating !== 1) {
      return new NextResponse('Invalid rating value', { status: 400 });
    }

    // Update the query rating
    const updatedQuery = await prisma.query.update({
      where: {
        id: cleanQueryId,
      },
      data: {
        rating,
      },
    });

    return NextResponse.json(updatedQuery);
  } catch (error) {
    console.error('Error rating query:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
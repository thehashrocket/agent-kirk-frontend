import { NextResponse } from 'next/server';
import { getLlmQueryMetrics } from '@/lib/services/reports';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  try {
    const metrics = await getLlmQueryMetrics(
      session.user.id,
      startDate || undefined,
      endDate || undefined
    );
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching LLM metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
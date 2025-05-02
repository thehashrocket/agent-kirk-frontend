import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseLLMResponse } from '@/lib/services/parseLLMResponse';
import { saveGaMetrics } from '@/lib/services/saveGaMetrics';

export async function POST(request: Request) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    if (!body || !body.gaPropertyId || !body.data) {
      return NextResponse.json(
        { error: 'Invalid request body', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Parse the LLM response
    const metrics = parseLLMResponse(body.data);

    // Save the metrics to the database
    const importRun = await saveGaMetrics(
      body.gaPropertyId,
      metrics,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      importRunId: importRun.id,
      metrics
    });
  } catch (error) {
    console.error('Error saving GA metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
} 
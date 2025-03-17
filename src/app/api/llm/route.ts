import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Define the request schema
const LLMRequestSchema = z.array(
  z.object({
    query: z.string().min(1),
    accountGA4: z.string(),
    propertyGA4: z.string(),
    conversationID: z.string(),
    dateToday: z.string(),
  })
);

// Initialize rate limiter
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '10 s'), // 20 requests per 10 seconds
  analytics: true,
});

export async function POST(request: Request) {
  try {
    // Get the IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
    
    // Check rate limit
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validatedData = LLMRequestSchema.parse(body);

    // Forward the request to the LLM service
    const llmResponse = await fetch(process.env.LLM_SERVICE_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM service responded with status: ${llmResponse.status}`);
    }

    const responseData = await llmResponse.json();

    // TODO: Store the query and response in your database
    // This would typically be done using your database client (e.g., Prisma)
    
    return NextResponse.json(responseData);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('LLM API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
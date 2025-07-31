/**
* @fileoverview Logs API Route Handler
* This module implements the Next.js route handlers for the /api/logs endpoint.
* It provides RESTful operations for managing logs in the application, including:
* - Retrieving logs with pagination and filtering(GET)
* Creating new logs(POST)
*
* @module api / logs
*/

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma, Log } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { Log as LogType } from '@/types/log';
import { memoryUsage } from 'process';

/**
 * Zod schema for validating log creation requests.
 * Enforces content length limits and file size restrictions.
 */
const logSchema = z.object({
    eventMessage: z.string().min(1).max(5000).optional(),
    eventType: z.string().min(1).max(100).optional(),
    errorMessage: z.string().min(1).max(5000).optional(),
    errorStackTrace: z.string().min(1).max(5000).optional(),
    message: z.string().min(1).max(5000).optional(),
    metrics: z.object({
        cpuUsage: z.number().optional(),
        memoryUsage: z.number().optional(),
        responseTime: z.number().optional(),
        requestSize: z.number().optional(),
        responseSize: z.number().optional(),
    }).optional(),
    nodeName: z.string().min(1).max(100).optional(),
    payload: z.object({
        data: z.string().optional(),
        metadata: z.string().optional(),
    }).optional(),
    queryId: z.string().optional(),
    sourceReferences: z.object({
        source: z.string().optional(),
        sourceId: z.string().optional(),
    }).optional(),
    userId: z.string().optional(),
    workflowName: z.string().min(1).max(100).optional(),
    environment: z.string().min(1).max(100).optional(),
    serviceName: z.string().min(1).max(100).optional(),
    version: z.string().min(1).max(100).optional(),
    requestId: z.string().min(1).max(100).optional(),
    sessionId: z.string().min(1).max(100).optional(),
    ipAddress: z.string().min(1).max(100).optional(),
    userAgent: z.string().min(1).max(500).optional(),
    duration: z.number().optional(),
    memoryUsage: z.number().optional(),
    cpuUsage: z.number().optional(),
    severity: z.string().min(1).max(50).optional(),
    isAuthenticated: z.boolean().optional(),
    permissions: z.object({
        canRead: z.boolean().optional(),
        canWrite: z.boolean().optional(),
        canDelete: z.boolean().optional(),
        canUpdate: z.boolean().optional(),
    }).optional(),
    modelName: z.string().min(1).max(100).optional(),
    tokenUsage: z.object({
        inputTokens: z.number().optional(),
        outputTokens: z.number().optional(),
    }).optional(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    clientId: z.string().min(1).max(100).optional(),
    pageUrl: z.string().min(1).max(500).optional(),
    componentName: z.string().min(1).max(100).optional(),
    errorCode: z.string().min(1).max(100).optional(),
    errorCategory: z.string().min(1).max(100).optional(),
    retryCount: z.number().optional(),
});

/**
 * GET handler to retrieve logs with optional pagination and filtering.
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} - JSON response with logs or error
 */
export async function GET(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const { searchParams } = request.nextUrl;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Fetch logs from the database with pagination
        const logs = await prisma.log.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
        });

        // Count total logs for pagination
        const totalLogs = await prisma.log.count();

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total: totalLogs,
                totalPages: Math.ceil(totalLogs / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

/**
 * POST handler to create a new log entry.
 *
 * @param {NextRequest} request - The incoming request object
 * @returns {Promise<NextResponse>} - JSON response with created log or error
 */

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await request.json();
        const parsedData = logSchema.parse(body);

        // Create a new log entry in the database
        const newLog = await prisma.log.create({
            data: parsedData,
        });

        return NextResponse.json(newLog, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error('Error creating log:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
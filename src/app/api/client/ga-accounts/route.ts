import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // Adjust import as needed

export async function GET(request: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);

    console.log('Request cookies:', request.cookies);

    if (session) console.log('Session found:', session);
    if (!session) console.log('No session found');

    let userEmail = session?.user?.email;

    console.log('Session:', session);
    // if (!session || session.user.role !== 'CLIENT') {
    //     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Session user email:', userEmail);

    if (!userEmail) {
        return NextResponse.json(
            { error: 'Unauthorized', code: 'UNAUTHORIZED' },
            { status: 401 }
        );
    }

    console.log('Fetching GA accounts for user:', userEmail);

    const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
            userToGaAccounts: {
                include: {
                    gaAccount: true
                }
            }
        }
    });

    console.log('Fetched GA accounts for user:', userEmail, user?.userToGaAccounts);

    return NextResponse.json(user);
}
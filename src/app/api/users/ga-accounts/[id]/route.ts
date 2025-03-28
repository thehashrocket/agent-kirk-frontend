import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const gaAccount = await prisma.gaAccount.findUnique({
      where: { id: params.id },
    });

    if (!gaAccount) {
      return new NextResponse('GA Account not found', { status: 404 });
    }

    // Ensure the user owns this GA account
    if (gaAccount.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await prisma.gaAccount.delete({
      where: { id: params.id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting GA account:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
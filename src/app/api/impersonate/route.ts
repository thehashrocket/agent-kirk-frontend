import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  // Check if user is authenticated
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized - No session' }, { status: 401 });
  }

  try {
    const { userId, action } = await request.json();

    // If ending impersonation, allow both the impersonator and impersonated user to end it
    if (action === "end") {
      const response = NextResponse.json({ success: true });
      
      // Delete all session cookies
      const cookieNames = ['impersonation', 'next-auth.session-token', 'next-auth.callback-url', 'next-auth.csrf-token'];
      cookieNames.forEach(name => {
        // Set an expired cookie to force deletion
        response.cookies.set(name, '', {
          expires: new Date(0),
          path: '/'
        });
      });
      
      return response;
    }

    // For starting impersonation, verify the user is an account rep
    if (session.user.role !== "ACCOUNT_REP") {
      return NextResponse.json({ error: 'Unauthorized - Not an account rep' }, { status: 401 });
    }

    // Verify the target user exists and is a client
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!targetUser || targetUser.role.name !== "CLIENT" || targetUser.accountRepId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden - Invalid target user' }, { status: 403 });
    }

    // Create response
    const response = NextResponse.json({
      success: true,
      impersonatedUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role.name,
      },
    });

    // Set impersonation cookie with proper options
    response.cookies.set('impersonation', JSON.stringify({
      userId: targetUser.id,
      originalRole: session.user.role,
      timestamp: Date.now()
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 // 1 hour
    });

    return response;
  } catch (error) {
    console.error("Impersonation error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
/**
 * @file src/app/account-rep/messages/page.tsx
 * Account Representative messages page that provides a comprehensive messaging interface.
 * Built using Next.js App Router and Server Components for optimal performance.
 * 
 * Features:
 * - Server-side authentication and role verification
 * - Responsive grid layout using Tailwind CSS
 * - Real-time message updates
 * - Split view with inbox and compose panels
 * - Mobile-first design with responsive breakpoints
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagesPage from "@/components/messages/MessagesPage";
import ComposeMessage from "@/components/messages/ComposeMessage";

/**
 * @component RepMessages
 * @path src/app/account-rep/messages/page.tsx
 * Server Component that renders the main messaging interface for account representatives.
 * 
 * Features:
 * - Message inbox with conversation threads and real-time updates
 * - Message composition panel with file attachment support
 * - Responsive grid layout (2:1 split on desktop, stacked on mobile)
 * - Server-side authentication check
 * - Role-based access control (REP role required)
 * 
 * Layout:
 * - Desktop: 2/3 width for messages list, 1/3 width for compose panel
 * - Mobile: Full width, stacked layout
 * - Consistent padding and spacing using Tailwind's spacing scale
 * 
 * Authentication:
 * - Requires valid session with user ID
 * - Requires REP role
 * - Redirects to sign-in page if not authenticated or unauthorized
 * 
 * @throws {Redirect} Redirects to /auth/signin if user is not authenticated or not a REP
 */
export default async function RepMessages() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "ACCOUNT_REP") {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Message with 1905</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {/* Messages list panel - takes up 2/3 of the grid on medium+ screens */}
        <div className="md:col-span-2">
          <MessagesPage 
            initialView="inbox" 
            // Set initial view to inbox for account representatives
          />
        </div>
        {/* Compose message panel - takes up 1/3 of the grid on medium+ screens */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">New Message</h2>
            <ComposeMessage />
          </div>
        </div>
      </div>
    </div>
  );
} 
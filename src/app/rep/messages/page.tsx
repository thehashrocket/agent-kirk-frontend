import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MessagesPage from "@/components/messages/MessagesPage";
import ComposeMessage from "@/components/messages/ComposeMessage";

export default async function RepMessages() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "REP") {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <MessagesPage initialView="inbox" />
        </div>
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
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AccountRepDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "ACCOUNT_REP") {
    console.log("Redirecting to signin. Session:", JSON.stringify(session, null, 2));
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">
        Hello, {session.user.name || session.user.email}! This is the ACCOUNT REP dashboard.
      </h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Add account rep-specific dashboard content here */}
      </div>
    </div>
  );
} 
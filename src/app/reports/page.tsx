/**
 * @file src/app/reports/page.tsx
 * Main reports landing page that provides access to various report types.
 * Features quick access cards to different report categories and recent report history.
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { BarChart3, Users, Clock, FileText } from "lucide-react";

const reportTypes = [
  {
    title: "Client Activity",
    description: "View detailed client usage patterns and engagement metrics",
    href: "/reports/client-activity",
    icon: <Users className="h-6 w-6 text-blue-500" />,
  },
  {
    title: "Usage Analytics",
    description: "Track API usage, response times, and success rates",
    href: "/reports/usage",
    icon: <BarChart3 className="h-6 w-6 text-green-500" />,
  },
  {
    title: "Historical Data",
    description: "Access historical performance and trend analysis",
    href: "/reports/history",
    icon: <Clock className="h-6 w-6 text-purple-500" />,
  },
  {
    title: "Custom Reports",
    description: "Generate custom reports based on specific metrics",
    href: "/reports/custom",
    icon: <FileText className="h-6 w-6 text-orange-500" />,
  },
];

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports Dashboard</h1>
        <p className="text-gray-600">
          Access and generate detailed reports about your system's performance and usage
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportTypes.map((report) => (
          <Link key={report.title} href={report.href}>
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mb-4">{report.icon}</div>
              <h2 className="text-lg font-semibold mb-2">{report.title}</h2>
              <p className="text-sm text-gray-600">{report.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 
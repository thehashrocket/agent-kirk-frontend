/**
 * @file src/app/admin/direct-mail/manual-entry/page.tsx
 * Admin interface for manually inserting USPS campaign and summary records.
 * Provides client selection and campaign entry form with sane defaults.
 */

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ManualEntryForm } from "./ManualEntryForm";

const privilegedCompanyName = "1905 New Media";
const privilegedCompanyNameLower = privilegedCompanyName.toLowerCase();

export default async function UspsManualEntryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  let companyName = session.user.company?.name ?? undefined;
  if (!companyName && session.user.companyId) {
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      select: { name: true },
    });
    companyName = company?.name ?? undefined;
  }

  const canAccess =
    session.user.role === "ADMIN" ||
    companyName?.toLowerCase() === privilegedCompanyNameLower;

  if (!canAccess) {
    redirect("/auth/signin");
  }

  const uspsClients = await prisma.uspsClient.findMany({
    select: {
      id: true,
      clientName: true,
    },
    orderBy: {
      clientName: "asc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-gray-900">
            USPS Campaign Manual Entry
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create a new USPS campaign and seed the first day of summary data.
          </p>
        </header>

        <ManualEntryForm clients={uspsClients} />
      </div>
    </div>
  );
}

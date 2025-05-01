import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Kirk - Your AI-Powered Business Assistant",
  description: "Kirk helps businesses streamline their operations with intelligent automation and communication tools.",
};

export default function Home() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bliss-bold tracking-tight sm:text-6xl">
            Welcome to Agent Kirk
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Your intelligent business assistant that streamlines communication,
            automates workflows, and helps you make better decisions.
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/auth/signin">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/about">
              Learn More
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border bg-card p-6 text-left shadow-sm"
            >
              <h3 className="text-lg font-bliss-bold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    title: "Smart Communication",
    description:
      "AI-powered chat interface that understands context and helps streamline conversations between teams and clients.",
  },
  {
    title: "Role-Based Access",
    description:
      "Secure, role-based dashboards for administrators, account representatives, and clients.",
  },
  {
    title: "Automated Workflows",
    description:
      "Intelligent automation that helps reduce manual tasks and improves operational efficiency.",
  },
];

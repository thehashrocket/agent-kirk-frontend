import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import { ArrowUpRight, BarChart3, Mail, Package, Share2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardChannel = {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  name: string;
  description: string;
};

const channels: DashboardChannel[] = [
  {
    href: "/analytics/channel/google-analytics",
    icon: BarChart3,
    name: "Google Analytics",
    description: "Website traffic, conversions, and audience behavior."
  },
  {
    href: "/analytics/channel/email",
    icon: Mail,
    name: "Email",
    description: "Campaign performance, engagement, and deliverability trends."
  },
  {
    href: "/analytics/channel/direct",
    icon: Package,
    name: "Direct Mail",
    description: "Track send volume, response rates, and audience impact."
  },
  {
    href: "/analytics/channel/organic-social",
    icon: Share2,
    name: "Organic Social",
    description: "Monitor reach, engagement, and community growth."
  }
];

export function ClientDashboardPicker() {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle className="text-xl">Channel dashboards</CardTitle>
        <CardDescription>Jump into detailed metrics for each channel.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {channels.map(channel => {
            const Icon = channel.icon;

            return (
              <Link
                key={channel.href}
                href={channel.href}
                className="group flex h-full flex-col justify-between rounded-lg border border-border p-4 bg-card/40 transition hover:border-primary hover:bg-background"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold leading-tight">{channel.name}</p>
                    <p className="text-sm text-muted-foreground">{channel.description}</p>
                  </div>
                </div>
                <span className="mt-6 inline-flex items-center text-sm font-medium text-primary">
                  View dashboard
                  <ArrowUpRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

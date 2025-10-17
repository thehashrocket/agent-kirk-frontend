import { CampaignReport } from '@/components/channels/email/CampaignReport';
import BreadCrumbs from '@/components/layout/BreadCrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { getEmailCampaignDetail } from '@/lib/services/email-metrics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface CampaignReportPageProps {
  params: Promise<{
    emailClientId: string;
    emailCampaignId: string;
  }>;
}

export default async function CampaignReportPage({ params }: CampaignReportPageProps) {
  const { emailClientId, emailCampaignId } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return (
      <Card className="mt-8">
        <CardContent>
          <p className="text-center text-muted-foreground">You must be signed in to view this campaign.</p>
        </CardContent>
      </Card>
    );
  }

  let campaign: Awaited<ReturnType<typeof getEmailCampaignDetail>> | null = null;
  let error: string | null = null;
  try {
    campaign = await getEmailCampaignDetail({
      userId: session.user.id,
      emailClientId,
      campaignId: emailCampaignId,
    });
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load campaign data.';
  }

  if (error) {
    return (
      <Card className="mt-8">
        <CardContent>
          <p className="text-center text-red-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!campaign) {
    return (
      <Card className="mt-8">
        <CardContent>
          <p className="text-center text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-start">
        <BreadCrumbs breadcrumbs={[{ label: "Home", href: "/" }, { label: "Dashboard", href: "/client/dashboard" }, { label: "Channel: Email", href: "/analytics/channel/email" }, { label: "Campaign Report", href: `/client/dashboard/email/${emailClientId}/campaign/${emailCampaignId}` }]} />
        <h1 className="text-2xl font-bold">Campaign Report</h1>
      </div>
      <CampaignReport campaign={campaign} />
    </div>
  );
}

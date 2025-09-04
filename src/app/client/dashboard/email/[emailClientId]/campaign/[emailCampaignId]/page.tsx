import { CampaignReport } from '@/components/channels/email/CampaignReport';
import BreadCrumbs from '@/components/layout/BreadCrumbs';
import { Card, CardContent } from '@/components/ui/card';

interface CampaignReportPageProps {
  params: Promise<{
    emailClientId: string;
    emailCampaignId: string;
  }>;
}

async function fetchCampaignData(emailClientId: string, emailCampaignId: string) {
  // TODO: Replace with real API call
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Mock data
  return {
    campaignId: emailCampaignId,
    campaignName: `Sample Campaign ${emailCampaignId}`,
    delivered: 10000,
    opens: 6500,
    clicks: 1200,
    bounces: 300,
    unsubscribes: 75,
  };
}

export default async function CampaignReportPage({ params }: CampaignReportPageProps) {
  const { emailClientId, emailCampaignId } = await params;

  let campaign = null;
  let error = null;
  try {
    campaign = await fetchCampaignData(emailClientId, emailCampaignId);
  } catch (e) {
    error = 'Failed to load campaign data.';
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
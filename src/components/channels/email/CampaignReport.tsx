import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MousePointer, AlertTriangle, UserMinus } from 'lucide-react';
import dayjs from 'dayjs';
import React from 'react';

export interface CampaignReportProps {
  campaign: {
    campaignId: string;
    campaignName: string;
    subject?: string | null;
    sendTime?: string | null;
    delivered: number;
    opens: number;
    clicks: number;
    bounces: number;
    unsubscribes: number;
  };
}

export function CampaignReport({ campaign }: CampaignReportProps) {
  if (!campaign) {
    return (
      <Card className="mt-8">
        <CardContent>
          <p className="text-center text-muted-foreground">No campaign data available.</p>
        </CardContent>
      </Card>
    );
  }

  const openRate = campaign.delivered > 0 ? (campaign.opens / campaign.delivered) * 100 : 0;
  const clickRate = campaign.delivered > 0 ? (campaign.clicks / campaign.delivered) * 100 : 0;
  const formattedSendTime = campaign.sendTime
    ? dayjs(campaign.sendTime).format('MMM D, YYYY h:mm A')
    : '—';

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>{campaign.campaignName}</CardTitle>
        <p className="text-sm text-muted-foreground">Campaign ID: {campaign.campaignId}</p>
        <p className="text-sm text-muted-foreground">Send Time: {formattedSendTime}</p>
        {campaign.subject && (
          <p className="text-sm text-muted-foreground">Subject: {campaign.subject}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Delivered:</span>
            <span>{campaign.delivered.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="font-medium">Opens:</span>
            <span>{campaign.opens.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MousePointer className="h-5 w-5 text-green-600" />
            <span className="font-medium">Clicks:</span>
            <span>{campaign.clicks.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="font-medium">Bounces:</span>
            <span>{campaign.bounces.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <UserMinus className="h-5 w-5 text-orange-600" />
            <span className="font-medium">Unsubscribes:</span>
            <span>{campaign.unsubscribes.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Open Rate:</span>
            <span>{openRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-medium">Click Rate:</span>
            <span>{clickRate.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignReport; 

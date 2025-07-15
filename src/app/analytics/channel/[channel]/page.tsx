import { notFound } from 'next/navigation';
import React from 'react';
import Email from '@/components/channels/email';
import Direct from '@/components/channels/direct';
import OrganicSearch from '@/components/channels/organic_search';
import OrganicSocial from '@/components/channels/organic_social';
import Referral from '@/components/channels/referral';
import Unassigned from '@/components/channels/unassigned';
import PaidSearch from '@/components/channels/paid_search';
import PaidSocial from '@/components/channels/paid_social';
import VisitorBehavior from '@/components/channels/visitor_behavior';
import AudienceData from '@/components/channels/audience_data';

interface ChannelPageProps {
  params: Promise<{
    channel: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ChannelPage({ params, searchParams }: ChannelPageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const channel = resolvedParams?.channel ? decodeURIComponent(resolvedParams.channel) : null;
  if (!channel) return notFound();

  // if the channel name is found, format it to capitalize the first letter of each word and replace dashes with spaces
  const formattedChannel = channel.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Channel: <span className="text-primary-600">{formattedChannel}</span></h1>
      {channel === 'audience-data' && <AudienceData />}
      {channel === 'direct' && <Direct />}
      {channel === 'email' && <Email />}
      {channel === 'organic-search' && <OrganicSearch />}
      {channel === 'organic-social' && <OrganicSocial />}
      {channel === 'paid-search' && <PaidSearch />}
      {channel === 'paidsocial' && <PaidSocial />}
      {channel === 'referral' && <Referral />}
      {channel === 'unassigned' && <Unassigned />}
      {channel === 'visitorbehavior' && <VisitorBehavior />}
    </main>
  );
} 
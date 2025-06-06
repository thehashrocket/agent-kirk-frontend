import { notFound } from 'next/navigation';
import React from 'react';

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

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Channel: <span className="text-primary-600">{channel}</span></h1>
      <p className="text-gray-600 mb-8">This page will show more data and insights about the <b>{channel}</b> channel.</p>
      {/* TODO: Add LLM-powered insights and analytics here */}
    </main>
  );
} 
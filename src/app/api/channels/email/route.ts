import { NextResponse } from 'next/server';

// Mock data types
interface EmailMetrics {
  totalDeliveries: number;
  uniqueOpens: number;
  avgOpenRate: number;
  uniqueClicks: number;
  avgCTR: number;
  totalUnsubscribes: number;
  totalBounces: number;
}

interface EmailCampaignActivity {
  id: string;
  delivered: string;
  weekDay: string;
  subject: string;
  link: string;
  successfulDeliveries: number;
  opens: number;
  openRate: number;
  clicks: number;
  ctr: number;
  unsubscribes: number;
  bounces: number;
}

interface EmailWebsiteActivity {
  id: string;
  campaign: string;
  source: string;
  medium: string;
  adContent: string;
  users: number;
  newUsers: number;
  sessions: number;
  avgSessionDuration: string;
}

interface EmailChannelData {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: EmailMetrics;
  campaignActivity: EmailCampaignActivity[];
  websiteActivity: EmailWebsiteActivity[];
}

// Mock data
const mockEmailData: EmailChannelData = {
  dateRange: {
    start: '2025-04-03',
    end: '2025-04-30'
  },
  metrics: {
    totalDeliveries: 7484,
    uniqueOpens: 2955,
    avgOpenRate: 39.48,
    uniqueClicks: 230,
    avgCTR: 3.07,
    totalUnsubscribes: 5,
    totalBounces: 46
  },
  campaignActivity: [
    {
      id: '1',
      delivered: 'Apr 17, 2025',
      weekDay: 'Friday',
      subject: 'Old Someone Say Brunch This Weekend? 🍳',
      link: 'https://sequin.com/12345',
      successfulDeliveries: 7484,
      opens: 2955,
      openRate: 39.48,
      clicks: 230,
      ctr: 3.07,
      unsubscribes: 5,
      bounces: 46
    },
    {
      id: '2',
      delivered: 'Apr 15, 2025',
      weekDay: 'Thursday',
      subject: 'A Spring Biggest Moments are Worth Watching for 🌸',
      link: 'https://sequin.com/67890',
      successfulDeliveries: 7484,
      opens: 2700,
      openRate: 36.06,
      clicks: 212,
      ctr: 2.86,
      unsubscribes: 18,
      bounces: 35
    },
    {
      id: '3',
      delivered: 'Feb 13, 2025',
      weekDay: 'Thursday',
      subject: 'February Fun & Valentine\'s Specials this Weekend',
      link: 'https://sequin.com/valentine',
      successfulDeliveries: 7396,
      opens: 2636,
      openRate: 35.64,
      clicks: 133,
      ctr: 1.83,
      unsubscribes: 6,
      bounces: 42
    },
    {
      id: '4',
      delivered: 'Jan 31, 2025',
      weekDay: 'Friday',
      subject: 'Kickstart your fitness goals at The Meadows',
      link: 'https://sequin.com/fitness',
      successfulDeliveries: 7421,
      opens: 3043,
      openRate: 41.02,
      clicks: 128,
      ctr: 1.73,
      unsubscribes: 22,
      bounces: 48
    },
    {
      id: '5',
      delivered: 'Dec 12, 2024',
      weekDay: 'Thursday',
      subject: 'Holiday Magic Starts Here 🎄',
      link: 'https://sequin.com/holiday',
      successfulDeliveries: 7404,
      opens: 3061,
      openRate: 41.34,
      clicks: 164,
      ctr: 2.27,
      unsubscribes: 7,
      bounces: 44
    }
  ],
  websiteActivity: [
    {
      id: '1',
      campaign: 'march2025',
      source: 'mailchimp',
      medium: 'email',
      adContent: 'header+garagepage',
      users: 4,
      newUsers: 4,
      sessions: 4,
      avgSessionDuration: '00:00:49'
    },
    {
      id: '2',
      campaign: 'feb2025-3',
      source: 'mailchimp',
      medium: 'email',
      adContent: 'scarn+recipe',
      users: 1,
      newUsers: 0,
      sessions: 3,
      avgSessionDuration: '00:01:57'
    },
    {
      id: '3',
      campaign: 'feb2025-1',
      source: 'mailchimp',
      medium: 'email',
      adContent: 'starry+linkage',
      users: 5,
      newUsers: 5,
      sessions: 6,
      avgSessionDuration: '00:01:33'
    },
    {
      id: '4',
      campaign: 'feb2025-1',
      source: 'mailchimp',
      medium: 'email',
      adContent: 'subscollection+image',
      users: 1,
      newUsers: 1,
      sessions: 1,
      avgSessionDuration: '00:00:00'
    }
  ]
};

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json(mockEmailData);
  } catch (error) {
    console.error('Error fetching email channel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email data' },
      { status: 500 }
    );
  }
} 
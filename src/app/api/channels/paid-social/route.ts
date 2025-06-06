import { NextResponse } from 'next/server';

// Mock data types
interface PaidSocialMetrics {
  reach: number;
  impressions: number;
  engagement: number;
  linkClicks: number;
  linkCtr: number;
  costPerLinkClick: number;
  lpvs: number;
  costPerLpv: number;
  amountSpent: number;
}

interface PaidSocialEngagement {
  id: string;
  campaignName: string;
  startDate: string;
  endDate: string;
  reach: number;
  impressions: number;
  engagement: number;
  linkClicks: number;
  linkCtr: number;
  costPerLinkClick: number;
  lpvs: number;
  costPerLpv: number;
  amountSpent: number;
}

interface PaidSocialCampaignOverview {
  id: string;
  campaign: string;
  source: string;
  adContent: string;
  users: number;
  newUsers: number;
  sessions: number;
  avgSessionDuration: string;
}

interface PaidSocialChannelData {
  dateRange: {
    start: string;
    end: string;
  };
  metrics: PaidSocialMetrics;
  engagementData: PaidSocialEngagement[];
  campaignOverview: PaidSocialCampaignOverview[];
}

// Mock data
const mockPaidSocialData: PaidSocialChannelData = {
  dateRange: {
    start: '2025-04-01',
    end: '2025-04-30'
  },
  metrics: {
    reach: 229221,
    impressions: 781297,
    engagement: 3548,
    linkClicks: 3445,
    linkCtr: 0.44,
    costPerLinkClick: 0.56,
    lpvs: 2968,
    costPerLpv: 0.65,
    amountSpent: 1917.91
  },
  engagementData: [
    {
      id: '1',
      campaignName: 'Q2/2025+Summer Camp Vetta 70+Traffic | 3PM',
      startDate: 'Mar 21, 2025',
      endDate: '',
      reach: 20696,
      impressions: 73079,
      engagement: 500,
      linkClicks: 467,
      linkCtr: 0.64,
      costPerLinkClick: 0.69,
      lpvs: 318,
      costPerLpv: 1.02,
      amountSpent: 324.16
    },
    {
      id: '2',
      campaignName: 'Q2/2025+Summer Camp St. Charles+Traffic | 3PM',
      startDate: 'Mar 21, 2025',
      endDate: '',
      reach: 23971,
      impressions: 61007,
      engagement: 503,
      linkClicks: 465,
      linkCtr: 0.76,
      costPerLinkClick: 0.70,
      lpvs: 317,
      costPerLpv: 1.02,
      amountSpent: 324.45
    },
    {
      id: '3',
      campaignName: 'Q2/2025+Summer Camp Soccerdome+Traffic | 3PM',
      startDate: 'Mar 21, 2025',
      endDate: '',
      reach: 30271,
      impressions: 64602,
      engagement: 524,
      linkClicks: 484,
      linkCtr: 0.75,
      costPerLinkClick: 0.67,
      lpvs: 324,
      costPerLpv: 1.00,
      amountSpent: 323.64
    },
    {
      id: '4',
      campaignName: 'Q2/2025+Summer Camp Manchester+Traffic | 3PM',
      startDate: 'Mar 21, 2025',
      endDate: '',
      reach: 26272,
      impressions: 62695,
      engagement: 496,
      linkClicks: 462,
      linkCtr: 0.74,
      costPerLinkClick: 0.70,
      lpvs: 320,
      costPerLpv: 1.01,
      amountSpent: 324.25
    },
    {
      id: '5',
      campaignName: 'Q2/2025+Summer Camp Concord+Traffic | 3PM',
      startDate: 'Mar 21, 2025',
      endDate: '',
      reach: 28932,
      impressions: 73642,
      engagement: 506,
      linkClicks: 467,
      linkCtr: 0.63,
      costPerLinkClick: 0.69,
      lpvs: 310,
      costPerLpv: 1.05,
      amountSpent: 324.03
    },
    {
      id: '6',
      campaignName: 'Q2/2025+Spring Camp St. Charles+Traffic | 4PM',
      startDate: 'Mar 8, 2025',
      endDate: '',
      reach: 7639,
      impressions: 15519,
      engagement: 121,
      linkClicks: 116,
      linkCtr: 0.75,
      costPerLinkClick: 0.67,
      lpvs: 70,
      costPerLpv: 1.10,
      amountSpent: 77.33
    }
  ],
  campaignOverview: [
    {
      id: '1',
      campaign: 'kickaroos',
      source: 'Facebook_Mobile_Feed',
      adContent: 'noimagetext|callingoliparents',
      users: 2467,
      newUsers: 2387,
      sessions: 2598,
      avgSessionDuration: '00:01:12'
    },
    {
      id: '2',
      campaign: 'kickaroos',
      source: 'Others',
      adContent: 'noimagetext|callingoliparents',
      users: 1651,
      newUsers: 1637,
      sessions: 1657,
      avgSessionDuration: '00:00:02'
    },
    {
      id: '3',
      campaign: 'kickaroos',
      source: 'Others',
      adContent: 'imagetestmonialtextfunsaleptwo',
      users: 1260,
      newUsers: 1254,
      sessions: 1263,
      avgSessionDuration: '00:00:01'
    },
    {
      id: '4',
      campaign: 'kickaroos',
      source: 'Others',
      adContent: 'imagetestmonialtext1ddyouknow two',
      users: 775,
      newUsers: 774,
      sessions: 775,
      avgSessionDuration: '00:00:00'
    },
    {
      id: '5',
      campaign: 'kickaroos',
      source: 'Others',
      adContent: 'imagekangarootext|callingoliparents',
      users: 691,
      newUsers: 680,
      sessions: 700,
      avgSessionDuration: '00:00:17'
    },
    {
      id: '6',
      campaign: 'kickaroos',
      source: 'Others',
      adContent: 'imagemulitext|callingaliparent',
      users: 498,
      newUsers: 496,
      sessions: 500,
      avgSessionDuration: '00:00:00'
    },
    {
      id: '7',
      campaign: 'kickaroos',
      source: 'Instagram_Stories',
      adContent: 'noimagetext|callingoliparents',
      users: 321,
      newUsers: 315,
      sessions: 339,
      avgSessionDuration: '00:01:15'
    },
    {
      id: '8',
      campaign: 'summercamp',
      source: 'Facebook_Mobile_Feed',
      adContent: 'Soccerdomegroup',
      users: 186,
      newUsers: 178,
      sessions: 202,
      avgSessionDuration: '00:00:22'
    },
    {
      id: '9',
      campaign: 'summercamp',
      source: 'Facebook_Mobile_Feed',
      adContent: 'charlesjes',
      users: 182,
      newUsers: 172,
      sessions: 190,
      avgSessionDuration: '00:00:35'
    },
    {
      id: '10',
      campaign: 'kickaroos',
      source: 'Others',
      adContent: 'imagekangarootext|buildconfidence',
      users: 142,
      newUsers: 139,
      sessions: 142,
      avgSessionDuration: '00:00:00'
    },
    {
      id: '11',
      campaign: 'kickaroos',
      source: 'Facebook_Mobile_Feed',
      adContent: 'imagetesttextfunnel',
      users: 128,
      newUsers: 125,
      sessions: 135,
      avgSessionDuration: '00:00:45'
    },
    {
      id: '12',
      campaign: 'kickaroos',
      source: 'Instagram_Stories',
      adContent: 'imagekangarootext|buildconfidence',
      users: 96,
      newUsers: 94,
      sessions: 102,
      avgSessionDuration: '00:01:08'
    }
  ]
};

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json(mockPaidSocialData);
  } catch (error) {
    console.error('Error fetching paid social channel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paid social data' },
      { status: 500 }
    );
  }
} 
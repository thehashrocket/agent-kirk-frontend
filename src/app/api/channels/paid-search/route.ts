import { NextResponse } from 'next/server';

// Mock data types
interface PaidSearchCampaignOverview {
  year: number;
  period: string;
  impressions: number;
  clicks: number;
  ctr: number;
  avgCpc: number;
  conversions: number;
  phoneCalls: number;
  totalSpend: number;
}

interface PaidSearchCampaign {
  id: string;
  name: string;
  clicks: number;
  ctr: number;
  avgCpc: number;
  conversions: number;
  phoneCalls: number;
  costPerConversion: number;
}

interface PaidSearchPerformanceData {
  date: string;
  campaign: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
}

interface FacebookCampaign {
  id: string;
  name: string;
  amountSpent: number;
  linkClicks: number;
  ctr: number;
  cpc: number;
}

interface FacebookCampaignsOverview {
  year: number;
  campaigns: FacebookCampaign[];
  totalSpent: number;
  totalLinkClicks: number;
  avgCtr: number;
  avgCpc: number;
}

interface PaidSearchChannelData {
  dateRange: {
    start: string;
    end: string;
  };
  campaignOverview: PaidSearchCampaignOverview[];
  allCampaigns: PaidSearchCampaign[];
  performanceData: PaidSearchPerformanceData[];
  facebookCampaigns: FacebookCampaignsOverview[];
}

// Mock data
const mockPaidSearchData: PaidSearchChannelData = {
  dateRange: {
    start: '2025-04-01',
    end: '2025-04-30'
  },
  campaignOverview: [
    {
      year: 2025,
      period: 'to Date',
      impressions: 2551670,
      clicks: 20894,
      ctr: 0.82,
      avgCpc: 0.30,
      conversions: 31696,
      phoneCalls: 325,
      totalSpend: 6353.06
    },
    {
      year: 2024,
      period: '',
      impressions: 3469550,
      clicks: 49542,
      ctr: 1.43,
      avgCpc: 0.25,
      conversions: 38461,
      phoneCalls: 1098,
      totalSpend: 12208.51
    },
    {
      year: 2023,
      period: '',
      impressions: 1044458,
      clicks: 15633,
      ctr: 1.50,
      avgCpc: 0.38,
      conversions: 6174,
      phoneCalls: 218,
      totalSpend: 5963.91
    }
  ],
  allCampaigns: [
    {
      id: '1',
      name: 'Kickaroos Search Dynamic',
      clicks: 5771,
      ctr: 6.96,
      avgCpc: 0.37,
      conversions: 6093,
      phoneCalls: 14,
      costPerConversion: 0.35
    },
    {
      id: '2',
      name: 'Kickaroos Search',
      clicks: 7763,
      ctr: 8.80,
      avgCpc: 0.36,
      conversions: 6519,
      phoneCalls: 35,
      costPerConversion: 0.43
    },
    {
      id: '3',
      name: 'Display | Kickaroos | Retargeting | TVS Apps',
      clicks: 7292,
      ctr: 0.31,
      avgCpc: 0.47,
      conversions: 10056,
      phoneCalls: 0,
      costPerConversion: 0.34
    },
    {
      id: '4',
      name: 'Kickaroos | Tree Trim Pads | SB | Managed Placements',
      clicks: 5135,
      ctr: 0.11,
      avgCpc: 0.42,
      conversions: 15854,
      phoneCalls: 83,
      costPerConversion: 0.14
    },
    {
      id: '5',
      name: 'Kickaroos PMG',
      clicks: 2536,
      ctr: 0.05,
      avgCpc: 0.18,
      conversions: 25914,
      phoneCalls: 209,
      costPerConversion: 0.02
    },
    {
      id: '6',
      name: 'gShoe | Kickaroos | All Locations | TVS Keyword',
      clicks: 53173,
      ctr: 0.09,
      avgCpc: 0.28,
      conversions: 48238,
      phoneCalls: 775,
      costPerConversion: 0.31
    }
  ],
  performanceData: [
    {
      date: '2024-01-01',
      campaign: 'Kickaroos Search Dynamic',
      impressions: 45000,
      clicks: 1250,
      conversions: 850,
      spend: 462.50
    },
    {
      date: '2024-01-01',
      campaign: 'Kickaroos Search',
      impressions: 52000,
      clicks: 1840,
      conversions: 925,
      spend: 662.40
    },
    {
      date: '2024-02-01',
      campaign: 'Kickaroos Search Dynamic',
      impressions: 48000,
      clicks: 1320,
      conversions: 890,
      spend: 488.40
    },
    {
      date: '2024-02-01',
      campaign: 'Kickaroos Search',
      impressions: 55000,
      clicks: 1950,
      conversions: 975,
      spend: 702.00
    },
    {
      date: '2024-03-01',
      campaign: 'Kickaroos Search Dynamic',
      impressions: 51000,
      clicks: 1420,
      conversions: 920,
      spend: 525.40
    },
    {
      date: '2024-03-01',
      campaign: 'Kickaroos Search',
      impressions: 58000,
      clicks: 2100,
      conversions: 1050,
      spend: 756.00
    },
    {
      date: '2024-04-01',
      campaign: 'Kickaroos Search Dynamic',
      impressions: 49000,
      clicks: 1380,
      conversions: 880,
      spend: 510.60
    },
    {
      date: '2024-04-01',
      campaign: 'Kickaroos Search',
      impressions: 56000,
      clicks: 2020,
      conversions: 1020,
      spend: 727.20
    },
    {
      date: '2024-05-01',
      campaign: 'Kickaroos Search Dynamic',
      impressions: 53000,
      clicks: 1480,
      conversions: 940,
      spend: 547.60
    },
    {
      date: '2024-05-01',
      campaign: 'Kickaroos Search',
      impressions: 59000,
      clicks: 2180,
      conversions: 1100,
      spend: 784.80
    }
  ],
  facebookCampaigns: [
    {
      year: 2025,
      campaigns: [
        {
          id: 'fb_2025_1',
          name: 'Roasted "all" Kickaroos Open House Ad Set',
          amountSpent: 300.00,
          linkClicks: 326,
          ctr: 1.00,
          cpc: 0.31
        },
        {
          id: 'fb_2025_2',
          name: '10/20 Ai Traffic-KickaroosBottomPaddle',
          amountSpent: 374.00,
          linkClicks: 332,
          ctr: 0.47,
          cpc: 0.48
        },
        {
          id: 'fb_2025_3',
          name: '10/20 Ai Traffic-KickaroosBottomGartering',
          amountSpent: 82.00,
          linkClicks: 31,
          ctr: 1.13,
          cpc: 0.25
        },
        {
          id: 'fb_2025_4',
          name: '10/20 Ai Traffic-KickaroosBottomFootwear',
          amountSpent: 2369.00,
          linkClicks: 176,
          ctr: 0.59,
          cpc: 0.36
        }
      ],
      totalSpent: 4729.00,
      totalLinkClicks: 3549,
      avgCtr: 0.72,
      avgCpc: 0.33
    },
    {
      year: 2024,
      campaigns: [
        {
          id: 'fb_2024_1',
          name: 'gam> Kickaroos Open House Ad Set',
          amountSpent: 310.00,
          linkClicks: 312,
          ctr: 1.41,
          cpc: 0.99
        },
        {
          id: 'fb_2024_2',
          name: 'Kickaroos Traffic - Acquisition (targeted demo:) 2023',
          amountSpent: 236.00,
          linkClicks: 479,
          ctr: 1.27,
          cpc: 0.49
        },
        {
          id: 'fb_2024_3',
          name: 'Kickaroos Traffic - Acquisition (targeted demo:) 2023',
          amountSpent: 249.00,
          linkClicks: 514,
          ctr: 1.26,
          cpc: 0.48
        },
        {
          id: 'fb_2024_4',
          name: 'Kickaroos and Forms',
          amountSpent: 188.00,
          linkClicks: 197,
          ctr: 1.86,
          cpc: 0.95
        },
        {
          id: 'fb_2024_5',
          name: 'Kickaroos and Forms Campaign - Reuel Spd - K 2024 Ad Set',
          amountSpent: 531.00,
          linkClicks: 524,
          ctr: 2.43,
          cpc: 1.01
        },
        {
          id: 'fb_2024_6',
          name: '10 2024 Traffic-KickaroosEcommerce',
          amountSpent: 57.00,
          linkClicks: 28,
          ctr: 0.60,
          cpc: 2.04
        },
        {
          id: 'fb_2024_7',
          name: '10 2024 Traffic-KickaroosGardening',
          amountSpent: 577.00,
          linkClicks: 614,
          ctr: 1.88,
          cpc: 0.94
        },
        {
          id: 'fb_2024_8',
          name: '10 2024 Traffic-KickaroosBottomFootwear',
          amountSpent: 5185.00,
          linkClicks: 4713,
          ctr: 1.16,
          cpc: 1.10
        },
        {
          id: 'fb_2024_9',
          name: '10 2024 Traffic-KickaroosBottomAttornage',
          amountSpent: 849.00,
          linkClicks: 751,
          ctr: 0.51,
          cpc: 1.13
        },
        {
          id: 'fb_2024_10',
          name: '10 2024 Traffic-KickaroosVeggareens',
          amountSpent: 437.00,
          linkClicks: 940,
          ctr: 0.71,
          cpc: 0.47
        }
      ],
      totalSpent: 8619.00,
      totalLinkClicks: 10072,
      avgCtr: 1.26,
      avgCpc: 0.85
    },
    {
      year: 2023,
      campaigns: [
        {
          id: 'fb_2023_1',
          name: 'Kickaroos Traffic - Acquisition (targeted demo:) 2023',
          amountSpent: 118.00,
          linkClicks: 1558,
          ctr: 1.41,
          cpc: 0.08
        },
        {
          id: 'fb_2023_2',
          name: 'Kickaroos Traffic - Acquisition (targeted demo:)',
          amountSpent: 1485.00,
          linkClicks: 6096,
          ctr: 1.53,
          cpc: 0.24
        },
        {
          id: 'fb_2023_3',
          name: 'Kickaroos Traffic - Acquisition (targeted)',
          amountSpent: 1185.00,
          linkClicks: 1798,
          ctr: 1.19,
          cpc: 0.66
        },
        {
          id: 'fb_2023_4',
          name: 'Kickaroos Traffic - Acquisition (baseline)',
          amountSpent: 1485.00,
          linkClicks: 8288,
          ctr: 1.16,
          cpc: 0.18
        }
      ],
      totalSpent: 9266.00,
      totalLinkClicks: 38350,
      avgCtr: 1.39,
      avgCpc: 0.24
    }
  ]
};

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json(mockPaidSearchData);
  } catch (error) {
    console.error('Error fetching paid search channel data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paid search data' },
      { status: 500 }
    );
  }
} 
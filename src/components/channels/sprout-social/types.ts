export interface SproutSocialAccount {
  id: string;
  customerProfileId: number;
  networkType: string;
  name: string;
  nativeName: string;
  link: string;
  nativeId: string;
  groups: number[];
  createdAt: string;
  updatedAt: string;
}

export interface SproutSocialMetrics {
  totalEngagements: number;
  totalImpressions: number;
  totalFollowers: number;
  engagementRate: number;
  impressionGrowth: number;
  followerGrowth: number;
}

export interface SproutSocialChannelData {
  account: SproutSocialAccount;
  dateRange: {
    from: string;
    to: string;
  };
  metrics: SproutSocialMetrics;
  comparisonMetrics: SproutSocialMetrics;
  platformType: string;
  rawData: any[];
}

// Platform-specific analytics interfaces (based on actual API response)
export interface FacebookAnalytics {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerProfileId: number;
  sproutSocialAccountId: string;
  reportingDate: string;
  impressions: number;
  impressionsUnique: number;
  engagements: number;
  followersCount: number;
  netFollowerGrowth: number;
  postContentClicks: number;
  postContentClicksOther: number;
  postLinkClicks: number;
  postPhotoViewClicks: number;
  tabViews: number;
  videoViews: number;
  videoViews10s: number;
  videoViewsOrganic: number;
  videoViewsPaid: number;
  videoViewsUnique: number;
}

export interface InstagramAnalytics {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerProfileId: number;
  sproutSocialAccountId: string;
  reportingDate: string;
  impressions: number;
  impressionsUnique: number;
  engagements: number;
  followersCount: number;
  netFollowerGrowth: number;
  videoViews: number;
  postContentClicks: number;
  likes?: number;
  commentsCount?: number;
  profileViews?: number;
  websiteClicks?: number;
}

export interface LinkedInAnalytics {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerProfileId: number;
  sproutSocialAccountId: string;
  reportingDate: string;
  impressions: number;
  impressionsUnique: number;
  engagements: number;
  followersCount: number;
  netFollowerGrowth: number;
  clicks: number;
  reactions?: number;
}

export interface PinterestAnalytics {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerProfileId: number;
  sproutSocialAccountId: string;
  reportingDate: string;
  impressions: number;
  engagements: number;
  followersCount: number;
  netFollowerGrowth: number;
  saves: number;
  clicks: number;
  followingCount?: number;
}

// Union type for all analytics data
export type SproutSocialAnalytics = FacebookAnalytics | InstagramAnalytics | LinkedInAnalytics | PinterestAnalytics;

// API Response interface (matches actual API structure)
export interface SproutSocialMetricsResponse {
  account: SproutSocialAccount;
  dateRange: {
    from: string;
    to: string;
  };
  metrics: SproutSocialAnalytics[];
  comparisonMetrics: SproutSocialAnalytics[];
  platformType: string;
}

// Computed metrics for display
export interface SproutSocialComputedMetrics {
  totalImpressions: number;
  totalImpressionsUnique: number;
  totalEngagements: number;
  totalVideoViews: number;
  totalClicks: number;
  averageFollowers: number;
  followerChange: number;
  engagementRate: number;
  impressionGrowth: number;
  followerGrowth: number;
}

// Helper function to compute metrics from raw data
export function computeMetrics(metrics: SproutSocialAnalytics[], comparisonMetrics: SproutSocialAnalytics[]): {
  current: SproutSocialComputedMetrics;
  comparison: SproutSocialComputedMetrics;
} {
  const computeFromArray = (data: SproutSocialAnalytics[]): SproutSocialComputedMetrics => {
    if (data.length === 0) {
      return {
        totalImpressions: 0,
        totalImpressionsUnique: 0,
        totalEngagements: 0,
        totalVideoViews: 0,
        totalClicks: 0,
        averageFollowers: 0,
        followerChange: 0,
        engagementRate: 0,
        impressionGrowth: 0,
        followerGrowth: 0,
      };
    }

    const totalImpressions = data.reduce((sum, item) => sum + (item.impressions || 0), 0);
    const totalImpressionsUnique = data.reduce((sum, item) => {
      return sum + (('impressionsUnique' in item) ? (item.impressionsUnique || 0) : 0);
    }, 0);
    const totalEngagements = data.reduce((sum, item) => sum + (item.engagements || 0), 0);
    
    // Video views (Facebook specific)
    const totalVideoViews = data.reduce((sum, item) => {
      if ('videoViews' in item) {
        return sum + (item.videoViews || 0);
      }
      return sum;
    }, 0);

    // Clicks (varies by platform)
    const totalClicks = data.reduce((sum, item) => {
      if ('postContentClicks' in item && 'postLinkClicks' in item) {
        // Facebook
        return sum + (item.postContentClicks || 0) + (item.postLinkClicks || 0) + (item.postContentClicksOther || 0);
      } else if ('clicks' in item) {
        // LinkedIn/Pinterest
        return sum + (item.clicks || 0);
      }
      return sum;
    }, 0);

    const averageFollowers = data.reduce((sum, item) => sum + (item.followersCount || 0), 0) / data.length;
    const firstFollowers = data[0]?.followersCount || 0;
    const lastFollowers = data[data.length - 1]?.followersCount || 0;
    const followerChange = lastFollowers - firstFollowers;

    const engagementRate = totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0;

    return {
      totalImpressions,
      totalImpressionsUnique,
      totalEngagements,
      totalVideoViews,
      totalClicks,
      averageFollowers,
      followerChange,
      engagementRate,
      impressionGrowth: 0, // Will be calculated below
      followerGrowth: 0, // Will be calculated below
    };
  };

  const current = computeFromArray(metrics);
  const comparison = computeFromArray(comparisonMetrics);

  // Calculate growth rates
  current.impressionGrowth = comparison.totalImpressions > 0 
    ? ((current.totalImpressions - comparison.totalImpressions) / comparison.totalImpressions) * 100 
    : 0;
  
  current.followerGrowth = comparison.averageFollowers > 0 
    ? ((current.averageFollowers - comparison.averageFollowers) / comparison.averageFollowers) * 100 
    : 0;

  return { current, comparison };
}

// Props interfaces for components
export interface SproutSocialMetricsProps {
  data?: SproutSocialMetricsResponse;
  isLoading?: boolean;
  error?: string;
}

export interface SproutSocialAccountSelectorProps {
  onAccountChange: (accountId: string | null) => void;
  onAccountObjectChange: (account: SproutSocialAccount | null) => void;
}

export interface SproutSocialDashboardProps {
  data?: SproutSocialMetricsResponse;
  isLoading?: boolean;
  error?: string;
} 
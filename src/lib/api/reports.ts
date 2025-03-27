import { cache } from "react";

export interface ReportMetrics {
  totalUsers: number;
  activeUsers: number;
  totalActions: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface ActionData {
  type: string;
  count: number;
  percentage: number;
}

export interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: "success" | "error" | "pending";
  metadata?: Record<string, any>;
}

export interface ReportData {
  metrics: ReportMetrics;
  actions: ActionData[];
  activities: Activity[];
  performanceMetrics: {
    cpu: number;
    memory: number;
    errorRate: number;
    responseTime: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    averageSessionDuration: number;
    retentionRate: number;
  };
}

export const fetchReportData = cache(async (startDate?: string, endDate?: string) => {
  const queryParams = new URLSearchParams();
  
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.API_URL;
  if (!baseUrl) {
    throw new Error("API URL is not defined in environment variables (NEXT_PUBLIC_BASE_URL or API_URL)");
  }

  console.log('Fetching reports from:', `${baseUrl}/api/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`);

  try {
    const response = await fetch(`${baseUrl}/api/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`, {
      headers: {
        "Content-Type": "application/json",
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
        tags: ["reports-data"],
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch report data: ${response.status} ${response.statusText}\n${errorText}`);
    }

    return response.json() as Promise<ReportData>;
  } catch (error) {
    console.error('Error fetching report data:', error);
    throw error;
  }
}); 
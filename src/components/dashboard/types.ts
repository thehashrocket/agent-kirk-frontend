export interface StatsCardData {
  title: string;
  value: string | number;
  change: number;
}

export interface StatsCardProps {
  data: StatsCardData;
} 
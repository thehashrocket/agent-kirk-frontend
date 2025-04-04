import { Card } from "@/components/ui/card";
import { getTicketStats } from "@/lib/services/ticket-service";
import { formatDuration } from "@/lib/utils";

interface TicketStatsProps {
  accountRepId?: string;
}

export async function TicketStats({ accountRepId }: TicketStatsProps) {
  const stats = await getTicketStats(accountRepId);

  return (
    <div className="flex items-center space-x-4">
      <Card className="p-3">
        <p className="text-sm text-muted-foreground">Open Tickets</p>
        <div className="flex items-baseline">
          <p className="text-2xl font-bold">{stats.open}</p>
          <p className={`ml-2 text-sm ${stats.percentageChanges.open >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.percentageChanges.open > 0 ? '+' : ''}{stats.percentageChanges.open}%
          </p>
        </div>
      </Card>
      <Card className="p-3">
        <p className="text-sm text-muted-foreground">Avg Response Time</p>
        <div className="flex items-baseline">
          <p className="text-2xl font-bold">{formatDuration(stats.averageResponseTime)}</p>
          <p className={`ml-2 text-sm ${stats.percentageChanges.averageResponseTime <= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.percentageChanges.averageResponseTime > 0 ? '+' : ''}{stats.percentageChanges.averageResponseTime}%
          </p>
        </div>
      </Card>
    </div>
  );
} 
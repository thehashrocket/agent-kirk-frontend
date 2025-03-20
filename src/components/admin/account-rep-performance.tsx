import { Card } from "@/components/ui/card";
import { getAccountRepPerformance } from "@/lib/admin";
import { TrendChart } from "@/components/ui/trend-chart";

export async function AccountRepPerformance() {
  const reps = await getAccountRepPerformance();

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Account Rep Performance</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account Rep
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Active Clients
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg. Rating
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Ratings
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating Trend
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reps.map((rep) => (
              <tr key={rep.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{rep.name}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{rep.activeClients}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm text-gray-900">{rep.averageRating.toFixed(1)}</div>
                    <div className="ml-2">
                      {rep.averageRating >= 4.5 ? '🌟' : 
                       rep.averageRating >= 4.0 ? '⭐' : 
                       rep.averageRating >= 3.0 ? '😊' : '😕'}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{rep.totalRatings}</div>
                </td>
                <td className="px-4 py-4 w-48">
                  <div className="h-8">
                    {rep.ratingTrend && (
                      <TrendChart
                        data={rep.ratingTrend}
                        dataKey="rating"
                        height={32}
                        color={rep.averageRating >= 4.0 ? '#10B981' : '#F59E0B'}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
} 
/**
 * @file src/components/reports/action-breakdown.tsx
 * Component for displaying the distribution of different activity types.
 */

interface ActionBreakdownItem {
  type: string;
  count: number;
  percentage: number;
}

interface ActionBreakdownProps {
  data: ActionBreakdownItem[];
}

const colors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
];

export function ActionBreakdown({ data }: ActionBreakdownProps) {
  if (!data.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for the selected period
      </div>
    );
  }

  // Sort by count in descending order
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      {sortedData.map((item, index) => (
        <div key={item.type} className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{item.type}</span>
            <span className="text-sm text-gray-500">
              {item.count.toLocaleString()} ({item.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${colors[index % colors.length]} transition-all`}
              style={{ width: `${item.percentage}%` }}
            />
          </div>
        </div>
      ))}

      <div className="mt-6 pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Total Actions</span>
          <span>
            {sortedData
              .reduce((sum, item) => sum + item.count, 0)
              .toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
} 
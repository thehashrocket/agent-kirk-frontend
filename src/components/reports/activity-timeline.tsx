/**
 * @file src/components/reports/activity-timeline.tsx
 * Timeline component for displaying chronological client activities.
 */

import { formatDistanceToNow } from "date-fns";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  metadata?: Record<string, any>;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const StatusIcon = ({ status }: { status: Activity['status'] }) => {
  switch (status) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'pending':
      return <Clock className="w-5 h-5 text-yellow-500" />;
  }
};

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (!activities.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        No activities found for the selected period
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50"
        >
          <div className="flex-shrink-0">
            <StatusIcon status={activity.status} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {activity.type}
              </p>
              <span className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(activity.timestamp), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {activity.description}
            </p>
            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                {Object.entries(activity.metadata).map(([key, value]) => (
                  <span key={key} className="mr-4">
                    {key}: {value}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 
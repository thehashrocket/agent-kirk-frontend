'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { AccountRepReportData } from '@/lib/services/reports';

interface SatisfactionMetricsProps {
  data: AccountRepReportData;
}

export function SatisfactionMetrics({ data }: SatisfactionMetricsProps) {
  // Calculate satisfaction distribution
  const satisfactionScore = data.metrics.clientSatisfactionScore;
  const resolutionRate = data.performanceMetrics.ticketResolutionRate;
  const retentionRate = data.clientEngagement.retentionRate;

  // Prepare data for the pie chart
  const pieData = [
    {
      name: 'Highly Satisfied',
      value: Math.round((satisfactionScore / 5) * 100),
    },
    {
      name: 'Resolution Rate',
      value: Math.round(resolutionRate),
    },
    {
      name: 'Retention Rate',
      value: Math.round(retentionRate),
    },
  ];

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Satisfaction Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Satisfaction Breakdown</h3>
              <div className="space-y-2">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Key Insights</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Average satisfaction score: {satisfactionScore.toFixed(1)}/5</li>
                <li>• Ticket resolution rate: {resolutionRate.toFixed(1)}%</li>
                <li>• Client retention rate: {retentionRate.toFixed(1)}%</li>
                <li>• Active clients: {data.metrics.activeClients} of {data.metrics.totalClients}</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
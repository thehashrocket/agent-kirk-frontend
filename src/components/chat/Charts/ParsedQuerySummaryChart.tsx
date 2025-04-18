'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

import type { ParsedQuerySummary } from '@/prisma/generated/client';

interface ParsedQuerySummaryChartProps {
    summaryData: ParsedQuerySummary[];
}

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
};

const formatValue = (value: number, metric: string) => {
    if (metric.toLowerCase().includes('rate')) {
        return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString();
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;

    return (
        <div className="bg-white p-4 shadow-lg rounded-lg border">
            <p className="font-semibold mb-2">{label}</p>
            {payload.map((entry: any) => (
                <div
                    key={entry.name}
                    className="flex items-center gap-2 text-sm"
                >
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium">{entry.name}:</span>
                    <span>{formatValue(entry.value, entry.name)}</span>
                </div>
            ))}
        </div>
    );
};

export function ParsedQuerySummaryChart({ summaryData }: ParsedQuerySummaryChartProps) {
    const formattedData = Object.values(summaryData)
        .map((item) => {
            const dateObj = new Date(item.date);
            return {
                ...item,
                sortDate: dateObj.toISOString(),
                displayDate: dateObj.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })
            };
        })
        .map(({ sortDate, ...item }) => ({
            ...item,
            date: item.displayDate
        }));

    // Sort formattedData by date
    formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="flex flex-col gap-4">
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={formattedData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        interval="preserveStartEnd"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 10 }}
                    />
                    <YAxis
                        yAxisId="left"
                        orientation="left"
                        stroke="#666"
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#FF9800"
                        domain={[0, 'auto']}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />

                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalEngagedSessions"
                        name="Engaged Sessions"
                        stroke="#2196F3"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalNewUsers"
                        name="New Users"
                        stroke="#4CAF50"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="averageBounceRate"
                        name="Bounce Rate"
                        stroke="#FF9800"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="totalConversions"
                        name="Conversions"
                        stroke="#9C27B0"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
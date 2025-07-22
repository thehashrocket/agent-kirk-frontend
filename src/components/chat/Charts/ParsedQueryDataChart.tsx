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

import type { ParsedQueryData } from '@/prisma/generated/client';

interface LineChartProps {
    queryData: ParsedQueryData[];
}

export function ParsedQueryDataChart({ queryData }: LineChartProps) {
    // Group query data by date and calculate aggregates
    const groupedQueryData = queryData.reduce((acc, item) => {
        if (!item?.date) return acc;

        // Use the date string as the key, ensuring consistent timezone handling
        const dateKey = new Date(item.date).toISOString();

        if (!acc[dateKey]) {
            acc[dateKey] = {
                date: dateKey,
                displayDate: new Date(dateKey).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                }),
                engagedSessions: 0,
                newUsers: 0,
                bounceRate: 0,
                conversions: 0,
                count: 0
            };
        }

        acc[dateKey].engagedSessions += Number(item.engagedSessions) || 0;
        acc[dateKey].newUsers += Number(item.newUsers) || 0;
        acc[dateKey].bounceRate += Number(item.bounceRate) || 0;
        acc[dateKey].conversions += Number(item.conversions) || 0;
        acc[dateKey].count += 1;

        return acc;
    }, {} as Record<string, any>);

    // Convert grouped query data to array and calculate averages
    const formattedData = Object.values(groupedQueryData)
        .map(item => ({
            originalDate: new Date(item.date), // Keep original date for sorting
            date: item.displayDate,
            engagedSessions: item.engagedSessions,
            newUsers: item.newUsers,
            bounceRate: item.bounceRate / item.count,
            conversions: item.conversions
        }))
        .sort((a, b) => a.originalDate.getTime() - b.originalDate.getTime()) // Sort by date
        .map(({ originalDate, ...rest }) => rest); // Remove the originalDate field

    // Sort formattedData by date
    formattedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="flex flex-col gap-4">
            <ResponsiveContainer width="100%" height={400}>
                <LineChart
                    data={formattedData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 10 }}
                    />
                    <YAxis
                        yAxisId="left"
                        tickFormatter={(value) => Math.round(value).toString()}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(value) => Math.round(value).toString()}
                    />
                    <Tooltip />
                    <Legend />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="engagedSessions"
                        name="Engaged Sessions"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="newUsers"
                        name="New Users"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="conversions"
                        name="Conversions"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
};
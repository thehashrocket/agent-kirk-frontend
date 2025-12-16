import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

const COLORS = [
    '#4f46e5',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#6366f1',
    '#14b8a6',
    '#f43f5e',
    '#8b5cf6',
    '#ec4899',
    '#0ea5e9',
    '#eab308',
    '#22c55e',
    '#f87171',
    '#7c3aed',
    '#d946ef',
    '#3b82f6',
];

interface Props {
    data: {
        channel: string;
        sessions: number;
        [key: string]: any; // support additional fields like conversions
    }[];
}

export function SessionsPieChart({ data }: Props) {
    const filteredData = data.filter((entry) => entry.sessions > 0);

    return (
        <div className="flex flex-col gap-4">
            <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                    <Pie
                        data={filteredData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="sessions"
                        nameKey="channel"
                        label={({ name }) => name}
                        isAnimationActive={false}
                    >
                        {filteredData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value: number | undefined, name: string | undefined) => [
                            `${(value || 0).toLocaleString()} sessions`,
                            name || '',
                        ]}
                    />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}

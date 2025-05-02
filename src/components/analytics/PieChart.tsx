import { PieChart as RechartsPieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';
import React from 'react';

export interface PieChartData {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
}

// Custom legend renderer to match screenshot style
function renderLegend({ payload, data }: any) {
  // Use the data prop for total and for each value
  const total = data.reduce((sum: number, entry: any) => sum + entry.value, 0);
  return (
    <ul className="space-y-3 ml-12">
      {payload.map((entry: any, index: number) => {
        // Find the value from the data array by name
        const dataItem = data.find((d: any) => d.name === entry.payload.name);
        const value = dataItem ? dataItem.value : 0;
        const percent = total > 0 ? (value / total) * 100 : 0;
        return (
          <li key={`item-${index}`} className="flex items-center gap-2 text-xs text-gray-900">
            <span
              className="inline-block w-4 h-4 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-sm text-gray-900">{entry.payload.name}</span>
            <span className="text-xs font-semibold" style={{ color: entry.color }}>{percent.toFixed(1)}%</span>
          </li>
        );
      })}
    </ul>
  );
}

export const PieChart: React.FC<PieChartProps> = ({ data }) => {
  // Calculate total for legend
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  return (
    <div className="flex items-center justify-center">
      <ResponsiveContainer width={460} height={260}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            isAnimationActive={true}
          >
            {data.map((entry, idx) => (
              <Cell key={`cell-${idx}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: any, name: any, props: any) => {
              const percent = total > 0 ? ((value as number) / total) * 100 : 0;
              return [
                `${value.toLocaleString()} (${percent.toFixed(1)}%)`,
                props.payload.name,
              ];
            }}
          />
          <Legend
            verticalAlign="middle"
            align="right"
            layout="vertical"
            iconType="circle"
            content={props => renderLegend({ ...props, data })}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}; 
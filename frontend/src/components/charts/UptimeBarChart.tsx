import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { UptimeTrendPoint } from '../../services/analyticsService';

interface UptimeBarChartProps {
  data: UptimeTrendPoint[];
  height?: number;
}

export const UptimeBarChart: React.FC<UptimeBarChartProps> = ({ data, height = 240 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => val.slice(5)} // MM-DD
          />
          <YAxis
            domain={[95, 100]}
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#151E30',
              borderColor: '#1E293B',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F8FAFC',
            }}
            formatter={(value: any) => [`${value}%`, 'Uptime']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Bar dataKey="uptimePercent" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => {
              const color =
                entry.uptimePercent >= 99.9
                  ? '#22C55E'
                  : entry.uptimePercent >= 99.0
                  ? '#F59E0B'
                  : '#EF4444';
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};


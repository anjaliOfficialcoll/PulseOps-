import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { LatencyTrendPoint } from '../../services/analyticsService';

interface LatencyLineChartProps {
  data: LatencyTrendPoint[];
  height?: number;
  showPercentiles?: boolean;
}

export const LatencyLineChart: React.FC<LatencyLineChartProps> = ({
  data,
  height = 240,
  showPercentiles = true,
}) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis dataKey="timestamp" stroke="#64748B" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748B" fontSize={11} tickLine={false} unit="ms" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#151E30',
              borderColor: '#1E293B',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F8FAFC',
            }}
            formatter={(value: any, name: any) => [`${value} ms`, name]}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', color: '#94A3B8' }}
          />
          <Line
            type="monotone"
            dataKey="avgLatency"
            name="Avg Latency"
            stroke="#6366F1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
          {showPercentiles && (
            <>
              <Line
                type="monotone"
                dataKey="p95Latency"
                name="P95 Latency"
                stroke="#06B6D4"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="p99Latency"
                name="P99 Latency"
                stroke="#F59E0B"
                strokeWidth={1.5}
                strokeDasharray="2 2"
                dot={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


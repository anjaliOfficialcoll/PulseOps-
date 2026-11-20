import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface StatusPieChartProps {
  operational: number;
  degraded: number;
  down: number;
  height?: number;
}

export const StatusPieChart: React.FC<StatusPieChartProps> = ({
  operational,
  degraded,
  down,
  height = 180,
}) => {
  const data = [
    { name: 'Operational', value: operational, color: '#22C55E' },
    { name: 'Degraded', value: degraded, color: '#F59E0B' },
    { name: 'Down', value: down, color: '#EF4444' },
  ].filter((d) => d.value > 0);

  const total = operational + degraded + down;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-slate-500 h-[180px]">
        No monitors configured
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="relative flex items-center justify-center">
      <ResponsiveContainer>
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: '#151E30',
              borderColor: '#1E293B',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#F8FAFC',
            }}
          />
          <Pie
            data={data}
            innerRadius={50}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="#151E30" strokeWidth={2} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl font-bold text-slate-100">{total}</span>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">APIs</span>
      </div>
    </div>
  );
};


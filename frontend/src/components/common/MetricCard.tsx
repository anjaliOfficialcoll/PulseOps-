import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  subtext?: string;
  statusColor?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  change,
  isPositive,
  icon: Icon,
  subtext,
  statusColor = 'indigo',
}) => {
  const colorMap = {
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  };

  return (
    <div className="bg-[#151E30] border border-[#1E293B] hover:border-slate-700/80 rounded-xl p-5 transition-all duration-200 shadow-sm hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`p-2 rounded-lg border ${colorMap[statusColor]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-100 tracking-tight">{value}</span>
        {unit && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
      </div>

      {(change || subtext) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {change && (
            <span className={`font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {change}
            </span>
          )}
          {subtext && <span className="text-slate-400 truncate">{subtext}</span>}
        </div>
      )}
    </div>
  );
};


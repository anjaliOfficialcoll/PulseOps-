import React from 'react';
import { MonitorStatus, IncidentStatus, IncidentSeverity } from '../../types';

interface StatusBadgeProps {
  status: MonitorStatus | IncidentStatus | IncidentSeverity | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showPulse = false }) => {
  const normalized = status.toUpperCase();

  let bg = 'bg-slate-800 text-slate-300 border-slate-700';
  let dot = 'bg-slate-400';
  let pulseDot = false;

  switch (normalized) {
    // Monitor Statuses
    case 'OPERATIONAL':
    case 'HEALTHY':
    case 'UP':
      bg = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      dot = 'bg-emerald-400';
      pulseDot = showPulse;
      break;
    case 'DEGRADED':
    case 'SLOW':
      bg = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      dot = 'bg-amber-400';
      pulseDot = showPulse;
      break;
    case 'DOWN':
    case 'FAILED':
    case 'CRITICAL':
      bg = 'bg-rose-950/60 text-rose-400 border-rose-800/60';
      dot = 'bg-rose-400';
      pulseDot = true;
      break;
    case 'PAUSED':
      bg = 'bg-slate-900 text-slate-400 border-slate-800';
      dot = 'bg-slate-500';
      break;

    // Incident Statuses
    case 'OPEN':
      bg = 'bg-rose-950/80 text-rose-400 border-rose-800/80';
      dot = 'bg-rose-400';
      pulseDot = true;
      break;
    case 'INVESTIGATING':
      bg = 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      dot = 'bg-amber-400';
      pulseDot = true;
      break;
    case 'IDENTIFIED':
      bg = 'bg-sky-950/60 text-sky-400 border-sky-800/60';
      dot = 'bg-sky-400';
      break;
    case 'MONITORING':
      bg = 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60';
      dot = 'bg-indigo-400';
      pulseDot = true;
      break;
    case 'RESOLVED':
      bg = 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60';
      dot = 'bg-emerald-400';
      break;

    // Severity
    case 'HIGH':
      bg = 'bg-orange-950/60 text-orange-400 border-orange-800/60';
      dot = 'bg-orange-400';
      break;
    case 'MEDIUM':
      bg = 'bg-amber-950/60 text-amber-400 border-amber-800/60';
      dot = 'bg-amber-400';
      break;
    case 'LOW':
      bg = 'bg-slate-900 text-slate-300 border-slate-700';
      dot = 'bg-slate-400';
      break;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-medium',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border ${bg} ${sizeClasses}`}>
      <span className="relative flex h-2 w-2">
        {pulseDot && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dot}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>
      <span>{normalized}</span>
    </span>
  );
};


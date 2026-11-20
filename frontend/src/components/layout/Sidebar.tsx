import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  AlertOctagon,
  BarChart3,
  Terminal,
  BellRing,
  Users2,
  Settings,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const { currentOrg, isDemoMode, toggleDemoMode } = useAuth();

  const navItems = [
    { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Monitors', to: '/monitors', icon: Activity },
    { name: 'Incidents', to: '/incidents', icon: AlertOctagon },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Logs & Events', to: '/logs', icon: Terminal },
    { name: 'Alerts', to: '/alerts', icon: BellRing },
    { name: 'Team & Projects', to: '/team', icon: Users2 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-[#0B1020] border-r border-[#1E293B] transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#1E293B]">
        <Link to="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Activity className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="text-base font-bold text-white tracking-tight leading-none">PulseOps</span>
              <span className="text-[11px] text-slate-400 truncate mt-1">
                {currentOrg?.name || 'Observability'}
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Demo Workspace Banner in Sidebar */}
      {isDemoMode && !collapsed && (
        <div className="m-3 p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="text-xs">
              <div className="font-semibold text-cyan-300 leading-tight">Demo Workspace</div>
              <div className="text-[10px] text-cyan-400/80">Simulated seed data</div>
            </div>
          </div>
          <button
            onClick={() => toggleDemoMode(false)}
            className="text-[10px] font-medium text-slate-300 hover:text-white underline"
          >
            Exit
          </button>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#151E30]'
                } ${collapsed ? 'justify-center px-2' : ''}`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info / Docs Link */}
      <div className="p-3 border-t border-[#1E293B] space-y-1">
        <a
          href="/swagger-ui.html"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-indigo-400 hover:bg-[#151E30] rounded-lg transition-colors ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title="OpenAPI / Swagger Spec"
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          {!collapsed && (
            <span className="flex items-center justify-between flex-1">
              <span>Swagger API</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </span>
          )}
        </a>

        {!collapsed && (
          <div className="px-3 py-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>PulseOps v1.0.0</span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>
        )}
      </div>
    </aside>
  );
};


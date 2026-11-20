import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  Building2,
  LogOut,
  User as UserIcon,
  Sparkles,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { DEMO_NOTIFICATIONS } from '../../services/demoData';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch }) => {
  const { user, currentOrg, organizations, setCurrentOrg, logout, isDemoMode, toggleDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [showOrgMenu, setShowOrgMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  return (
    <header className="h-16 px-6 bg-[#0B1020]/90 backdrop-blur-md border-b border-[#1E293B] flex items-center justify-between sticky top-0 z-20">
      {/* Left: Organization / Workspace Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setShowOrgMenu(!showOrgMenu)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151E30] hover:bg-[#1A253C] border border-[#1E293B] text-sm font-medium text-slate-200 transition-colors"
          >
            <Building2 className="w-4 h-4 text-indigo-400" />
            <span className="max-w-[140px] truncate">{currentOrg?.name || 'Workspace'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showOrgMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-[#151E30] border border-[#1E293B] rounded-xl shadow-xl py-2 z-50">
              <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Organization
              </div>
              {organizations.map((org) => (
                <button
                  key={org.id}
                  onClick={() => {
                    setCurrentOrg(org);
                    setShowOrgMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-slate-800/60 ${
                    currentOrg?.id === org.id ? 'text-indigo-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  {currentOrg?.id === org.id && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}

              <div className="border-t border-[#1E293B] mt-2 pt-2 px-2">
                <button
                  onClick={() => {
                    toggleDemoMode(!isDemoMode);
                    setShowOrgMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-cyan-300 hover:bg-cyan-950/40 rounded-lg transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isDemoMode ? 'Switch to Live Workspace' : 'Switch to Demo Workspace'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search monitors, incidents..."
            className="w-full bg-[#151E30] border border-[#1E293B] focus:border-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Demo Mode Badge */}
        {isDemoMode && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 rounded-md">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Demo Mode</span>
          </span>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#151E30] rounded-lg transition-colors border border-transparent hover:border-[#1E293B]"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-[#151E30] rounded-lg transition-colors border border-transparent hover:border-[#1E293B] relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-[#0B1020]" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-[#151E30] border border-[#1E293B] rounded-xl shadow-2xl p-3 z-50 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                <span className="text-xs font-semibold text-slate-300">Live Alert Stream</span>
                <span className="text-[10px] text-indigo-400 font-medium">3 recent</span>
              </div>
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {DEMO_NOTIFICATIONS.map((n) => (
                  <div key={n.id} className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-slate-200">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{n.subject}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#151E30] transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-500/30">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span className="hidden sm:inline text-sm font-medium text-slate-200 max-w-[120px] truncate">
              {user?.fullName || 'User'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-[#151E30] border border-[#1E293B] rounded-xl shadow-2xl py-1 z-50">
              <div className="px-4 py-3 border-b border-[#1E293B]">
                <p className="text-sm font-semibold text-slate-100 truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
              </div>

              <button
                onClick={() => {
                  navigate('/settings');
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800/60 flex items-center gap-2"
              >
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Account Settings</span>
              </button>

              <div className="border-t border-[#1E293B] my-1"></div>

              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                  navigate('/login');
                }}
                className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};


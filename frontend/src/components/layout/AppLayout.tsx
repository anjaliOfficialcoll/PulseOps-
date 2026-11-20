import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { isAuthenticated, isLoading, isDemoMode, toggleDemoMode } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B1020] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">Loading PulseOps...</span>
        </div>
      </div>
    );
  }

  // If not authenticated and not demo mode, redirect to login
  if (!isAuthenticated && !isDemoMode) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Demo Mode Notice Banner */}
        {isDemoMode && (
          <div className="bg-gradient-to-r from-cyan-950/90 via-indigo-950/90 to-cyan-950/90 border-b border-cyan-800/60 px-4 py-2 flex items-center justify-between text-xs text-cyan-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                <strong>Demo Workspace Active:</strong> You are exploring pre-seeded monitoring and incident simulation data. Real-time background probes and webhook testing are safely sandboxed.
              </span>
            </div>
            <button
              onClick={() => toggleDemoMode(false)}
              className="inline-flex items-center gap-1 font-semibold text-white bg-cyan-600/60 hover:bg-cyan-500/80 px-2.5 py-1 rounded transition-colors shrink-0"
            >
              <span>Connect Live Backend</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Top Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};


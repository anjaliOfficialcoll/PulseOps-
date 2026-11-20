import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Plus,
  Search,
  Filter,
  Play,
  Pause,
  Trash2,
  Edit2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  RefreshCw,
  Globe,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { monitorService } from '../../services/monitorService';
import { Monitor, Environment, MonitorStatus, HttpMethod } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { EmptyState } from '../../components/common/EmptyState';

export const MonitorsPage: React.FC = () => {
  const { isDemoMode, projects } = useAuth();
  const navigate = useNavigate();

  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [envFilter, setEnvFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [deletingMonitor, setDeletingMonitor] = useState<Monitor | null>(null);
  const [checkingMonitorId, setCheckingMonitorId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET' as HttpMethod,
    expectedStatusCode: 200,
    intervalSeconds: 60,
    timeoutSeconds: 5,
    environment: 'PRODUCTION' as Environment,
    headersJson: '{\n  "Accept": "application/json"\n}',
    body: '',
    projectId: '',
  });

  const loadMonitors = async () => {
    setIsLoading(true);
    try {
      const data = await monitorService.getMonitors(isDemoMode);
      setMonitors(data);
    } catch (err) {
      console.error('Failed to load monitors', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMonitors();
  }, [isDemoMode]);

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      url: 'https://',
      method: 'GET',
      expectedStatusCode: 200,
      intervalSeconds: 60,
      timeoutSeconds: 5,
      environment: 'PRODUCTION',
      headersJson: '{\n  "Accept": "application/json"\n}',
      body: '',
      projectId: projects[0]?.id || '',
    });
    setEditingMonitor(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (m: Monitor, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      name: m.name,
      url: m.url,
      method: m.method,
      expectedStatusCode: m.expectedStatusCode,
      intervalSeconds: m.intervalSeconds,
      timeoutSeconds: m.timeoutSeconds,
      environment: m.environment,
      headersJson: m.headersJson || '',
      body: m.body || '',
      projectId: m.projectId || '',
    });
    setEditingMonitor(m);
    setIsCreateModalOpen(true);
  };

  const handleSaveMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMonitor) {
        await monitorService.updateMonitor(editingMonitor.id, formData, isDemoMode);
      } else {
        await monitorService.createMonitor(formData, isDemoMode);
      }
      setIsCreateModalOpen(false);
      loadMonitors();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to save monitor');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingMonitor) return;
    try {
      await monitorService.deleteMonitor(deletingMonitor.id, isDemoMode);
      setDeletingMonitor(null);
      loadMonitors();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const handleTogglePause = async (m: Monitor, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await monitorService.togglePause(m.id, isDemoMode);
      loadMonitors();
    } catch (err) {
      console.error('Toggle pause failed', err);
    }
  };

  const handleTriggerCheck = async (m: Monitor, e: React.MouseEvent) => {
    e.stopPropagation();
    setCheckingMonitorId(m.id);
    try {
      await monitorService.triggerCheck(m.id, isDemoMode);
      await loadMonitors();
    } catch (err) {
      console.error('Manual check failed', err);
    } finally {
      setCheckingMonitorId(null);
    }
  };

  const filteredMonitors = monitors.filter((m) => {
    const matchesQuery =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    const matchesEnv = envFilter === 'ALL' || m.environment === envFilter;
    return matchesQuery && matchesStatus && matchesEnv;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>API Monitors</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              {monitors.length} Total
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure target endpoints, inspection schedules, timeouts, and multi-region health probes.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Monitor</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#151E30] border border-[#1E293B] rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter monitors by name or URL..."
            className="w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="DEGRADED">Degraded</option>
              <option value="DOWN">Down</option>
              <option value="PAUSED">Paused</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-medium">Env:</span>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Envs</option>
              <option value="PRODUCTION">Production</option>
              <option value="STAGING">Staging</option>
              <option value="DEVELOPMENT">Development</option>
            </select>
          </div>
        </div>
      </div>

      {/* Monitors List / Empty State */}
      {filteredMonitors.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No Monitors Found"
          description="Register your first API endpoint to start collecting real-time availability and latency telemetry."
          actionText="Create Monitor"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="bg-[#151E30] border border-[#1E293B] rounded-xl overflow-hidden divide-y divide-[#1E293B]">
          {filteredMonitors.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/monitors/${m.id}`)}
              className="p-5 hover:bg-[#1A253C] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5 min-w-[280px]">
                <div className="mt-0.5">
                  <span className="px-2 py-1 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {m.method}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-100 hover:text-indigo-400 transition-colors">
                      {m.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                      {m.environment}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1 truncate max-w-md">
                    {m.url}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500 mt-2">
                    <span>Interval: Every {m.intervalSeconds}s</span>
                    <span>Timeout: {m.timeoutSeconds}s</span>
                    <span>Expected: HTTP {m.expectedStatusCode}</span>
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-[#1E293B]">
                <div className="text-left md:text-right">
                  <div className="text-[11px] text-slate-400">Response Time</div>
                  <div className="text-xs font-mono font-semibold text-slate-200">
                    {m.status === 'DOWN' ? 'Timed Out' : `${m.avgResponseTimeMs || 42} ms`}
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-[11px] text-slate-400">24h Uptime</div>
                  <div className="text-xs font-semibold text-slate-200">
                    {m.uptime24h || 100}%
                  </div>
                </div>

                <StatusBadge status={m.status} showPulse />

                {/* Inline Action Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleTriggerCheck(m, e)}
                    disabled={checkingMonitorId === m.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                    title="Run manual probe now"
                  >
                    <Play className={`w-4 h-4 ${checkingMonitorId === m.id ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => handleTogglePause(m, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                    title={m.isActive ? 'Pause monitoring' : 'Resume monitoring'}
                  >
                    <Pause className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => handleOpenEdit(m, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                    title="Edit monitor settings"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingMonitor(m);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Delete monitor"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Monitor Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingMonitor ? 'Edit API Monitor' : 'Register New API Monitor'}
        subtitle="PulseOps scheduler executes non-overlapping health probes with safe timeouts."
        maxWidth="xl"
      >
        <form onSubmit={handleSaveMonitor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Monitor Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Identity & Auth Service /healthz"
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">HTTP Method</label>
              <select
                value={formData.method}
                onChange={(e) => setFormData({ ...formData, method: e.target.value as HttpMethod })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300">API Endpoint URL</label>
              <input
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.domain.com/v1/health"
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Expected Status</label>
              <input
                type="number"
                required
                value={formData.expectedStatusCode}
                onChange={(e) => setFormData({ ...formData, expectedStatusCode: Number(e.target.value) })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Check Interval</label>
              <select
                value={formData.intervalSeconds}
                onChange={(e) => setFormData({ ...formData, intervalSeconds: Number(e.target.value) })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 1 minute</option>
                <option value={300}>Every 5 minutes</option>
                <option value={600}>Every 10 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Timeout Limit</label>
              <select
                value={formData.timeoutSeconds}
                onChange={(e) => setFormData({ ...formData, timeoutSeconds: Number(e.target.value) })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value={3}>3 seconds</option>
                <option value={5}>5 seconds</option>
                <option value={10}>10 seconds</option>
                <option value={30}>30 seconds</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Environment</label>
              <select
                value={formData.environment}
                onChange={(e) => setFormData({ ...formData, environment: e.target.value as Environment })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value="PRODUCTION">Production</option>
                <option value="STAGING">Staging</option>
                <option value="DEVELOPMENT">Development</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Assign to Project</label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value="">Default Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Request Headers (JSON)</label>
            <textarea
              rows={3}
              value={formData.headersJson}
              onChange={(e) => setFormData({ ...formData, headersJson: e.target.value })}
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none"
            />
          </div>

          {(formData.method === 'POST' || formData.method === 'PUT' || formData.method === 'PATCH') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300">Request Body Payload (Optional)</label>
              <textarea
                rows={3}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                placeholder='{"ping": "pong"}'
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none"
              />
            </div>
          )}

          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-300">
            <strong>SSRF Security:</strong> Private IPv4/IPv6 address blocks and internal cloud metadata endpoints (169.254.169.254) are automatically blocked by the engine validator.
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
            >
              {editingMonitor ? 'Update Monitor' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMonitor}
        onClose={() => setDeletingMonitor(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Monitor"
        message={`Are you sure you want to delete "${deletingMonitor?.name}"? All historical ping telemetry, incidents, and uptime SLA records will be permanently removed.`}
        confirmText="Delete Monitor"
        isDestructive={true}
      />
    </div>
  );
};


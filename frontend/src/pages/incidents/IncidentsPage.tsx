import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  Plus,
  Search,
  Filter,
  Flame,
  CheckCircle2,
  Clock,
  User,
  Activity,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { incidentService } from '../../services/incidentService';
import { monitorService } from '../../services/monitorService';
import { Incident, IncidentStatus, IncidentSeverity, Monitor } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const IncidentsPage: React.FC = () => {
  const { isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // New incident modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    monitorId: '',
    severity: 'HIGH' as IncidentSeverity,
    rootCause: '',
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [incList, monList] = await Promise.all([
        incidentService.getIncidents(isDemoMode),
        monitorService.getMonitors(isDemoMode),
      ]);
      setIncidents(incList);
      setMonitors(monList);
      if (monList.length > 0 && !formData.monitorId) {
        setFormData(prev => ({ ...prev, monitorId: monList[0].id }));
      }
    } catch (err) {
      console.error('Failed to load incidents', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedMon = monitors.find(m => m.id === formData.monitorId);
      await incidentService.createIncident({
        ...formData,
        monitorName: selectedMon?.name,
      }, isDemoMode);
      setIsModalOpen(false);
      setFormData({
        title: '',
        monitorId: monitors[0]?.id || '',
        severity: 'HIGH',
        rootCause: '',
      });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create incident');
    }
  };

  const filteredIncidents = incidents.filter((i) => {
    const matchesQuery =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.monitorName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || i.severity === severityFilter;
    return matchesQuery && matchesStatus && matchesSeverity;
  });

  const activeCount = incidents.filter(i => i.status !== 'RESOLVED').length;
  const criticalCount = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Incident Command Center</span>
            {criticalCount > 0 && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 font-semibold animate-pulse">
                {criticalCount} Critical
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated anomaly triage, active outage tracking, engineer assignment, and incident resolution.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Trigger Incident</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="p-4 bg-[#151E30] border border-[#1E293B] rounded-xl flex flex-wrap items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'OPEN', 'INVESTIGATING', 'IDENTIFIED', 'MONITORING', 'RESOLVED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-1 sm:flex-initial">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search incidents..."
              className="bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none w-48"
            />
          </div>
        </div>
      </div>

      {/* Incident List */}
      {filteredIncidents.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No Incidents Reported"
          description="All monitored API endpoints are currently operational without detected failures or SLA violations."
        />
      ) : (
        <div className="bg-[#151E30] border border-[#1E293B] rounded-xl overflow-hidden divide-y divide-[#1E293B]">
          {filteredIncidents.map((inc) => (
            <div
              key={inc.id}
              onClick={() => navigate(`/incidents/${inc.id}`)}
              className="p-5 hover:bg-[#1A253C] transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <StatusBadge status={inc.severity} size="sm" />
                  <StatusBadge status={inc.status} size="sm" showPulse={inc.status !== 'RESOLVED'} />
                  <span className="text-sm font-semibold text-slate-100 hover:text-indigo-400 transition-colors">
                    {inc.title}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-slate-300">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{inc.monitorName}</span>
                  </span>
                  <span>Detected: {new Date(inc.detectedAt).toLocaleString()}</span>
                  {inc.assignedUserName && (
                    <span className="flex items-center gap-1 text-slate-300">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{inc.assignedUserName}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs self-end md:self-auto">
                <div className="text-right">
                  <div className="text-slate-400">Timeline Events</div>
                  <div className="font-semibold text-slate-200">{inc.eventsCount || 1} logged</div>
                </div>

                <div className="text-right">
                  <div className="text-slate-400">Comments</div>
                  <div className="font-semibold text-slate-200">{inc.commentsCount || 0} notes</div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Trigger Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Declare New Incident"
        subtitle="Manually declare an outage or degraded performance state for fleet monitoring."
      >
        <form onSubmit={handleCreateIncident} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Affected Monitor</label>
            <select
              required
              value={formData.monitorId}
              onChange={(e) => setFormData({ ...formData, monitorId: e.target.value })}
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
            >
              {monitors.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.environment})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Incident Title / Summary</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Auth Gateway returning HTTP 500 on token refresh"
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Incident Severity</label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData({ ...formData, severity: e.target.value as IncidentSeverity })}
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
            >
              <option value="CRITICAL">Critical (Total Outage / P0)</option>
              <option value="HIGH">High (Major Core Feature Degraded)</option>
              <option value="MEDIUM">Medium (Elevated Latency / SLA Breached)</option>
              <option value="LOW">Low (Minor Non-Critical Warning)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300">Preliminary Investigation Notes</label>
            <textarea
              rows={3}
              value={formData.rootCause}
              onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
              placeholder="Describe initial symptoms or troubleshooting hypotheses..."
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-all"
            >
              Declare Incident
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


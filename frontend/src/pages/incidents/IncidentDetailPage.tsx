import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertOctagon,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Send,
  ShieldAlert,
  Activity,
  History,
  FileText,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { incidentService } from '../../services/incidentService';
import { Incident, IncidentEvent, IncidentComment, IncidentStatus, IncidentSeverity } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';

export const IncidentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [events, setEvents] = useState<IncidentEvent[]>([]);
  const [comments, setComments] = useState<IncidentComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [inc, evList, comList] = await Promise.all([
        incidentService.getIncidentById(id, isDemoMode),
        incidentService.getEvents(id, isDemoMode),
        incidentService.getComments(id, isDemoMode),
      ]);
      setIncident(inc);
      setEvents(evList);
      setComments(comList);
    } catch (err) {
      console.error('Failed to load incident detail', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, isDemoMode]);

  const handleStatusChange = async (status: IncidentStatus) => {
    if (!id) return;
    try {
      const updated = await incidentService.updateStatus(id, status, isDemoMode);
      setIncident(updated);
      const evList = await incidentService.getEvents(id, isDemoMode);
      setEvents(evList);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleSeverityChange = async (severity: IncidentSeverity) => {
    if (!id) return;
    try {
      const updated = await incidentService.updateSeverity(id, severity, isDemoMode);
      setIncident(updated);
    } catch (err) {
      console.error('Failed to update severity', err);
    }
  };

  const handleAssignToMe = async () => {
    if (!id || !user) return;
    try {
      const updated = await incidentService.assignUser(id, user.id, user.fullName, isDemoMode);
      setIncident(updated);
    } catch (err) {
      console.error('Failed to assign user', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;
    setIsSubmittingComment(true);
    try {
      const added = await incidentService.addComment(id, newComment.trim(), isDemoMode);
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading || !incident) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-[#151E30] rounded w-32" />
        <div className="h-32 bg-[#151E30] rounded-xl" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-64 bg-[#151E30] rounded-xl" />
          <div className="h-64 bg-[#151E30] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/incidents')}
            className="p-2 text-slate-400 hover:text-slate-200 bg-[#151E30] hover:bg-[#1A253C] border border-[#1E293B] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400 font-semibold">{incident.id}</span>
              <StatusBadge status={incident.severity} size="sm" />
              <StatusBadge status={incident.status} size="sm" showPulse={incident.status !== 'RESOLVED'} />
            </div>
            <h1 className="text-xl font-bold text-white mt-1">{incident.title}</h1>
          </div>
        </div>

        {/* Status Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {incident.status !== 'RESOLVED' ? (
            <button
              onClick={() => handleStatusChange('RESOLVED')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolve Incident</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('INVESTIGATING')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reopen Incident</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Details & Discussion */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Timeline & Investigation Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Root Cause & Summary */}
          <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>Root Cause Analysis & Investigation Notes</span>
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed bg-[#0B1020] p-4 rounded-lg border border-[#1E293B]">
              {incident.rootCause || 'No root cause specified yet. Incident is actively undergoing diagnosis.'}
            </p>
          </div>

          {/* Audit Timeline */}
          <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B]">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Incident Audit Timeline</span>
            </h3>

            <div className="space-y-6 border-l border-[#1E293B] ml-2 pl-4">
              {events.map((ev) => (
                <div key={ev.id} className="relative">
                  <div className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-indigo-500 ring-4 ring-[#151E30]" />
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{ev.eventType}</span>
                    <span className="text-slate-400 font-mono">{new Date(ev.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{ev.description}</p>
                  {ev.createdByUserName && (
                    <span className="text-[10px] text-slate-400 mt-1 block">Triggered by: {ev.createdByUserName}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Engineer Comments Thread */}
          <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Investigation Discussion & War Room</span>
            </h3>

            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="p-3.5 rounded-lg bg-[#0B1020] border border-[#1E293B]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-indigo-400">{c.userName}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{new Date(c.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{c.commentText}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="pt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post an investigation update or mitigation note..."
                  className="flex-1 bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column (1 Col): Incident Meta Controls */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Incident Metadata</h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Current State</span>
                <select
                  value={incident.status}
                  onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
                  className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="INVESTIGATING">INVESTIGATING</option>
                  <option value="IDENTIFIED">IDENTIFIED</option>
                  <option value="MONITORING">MONITORING</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Severity Level</span>
                <select
                  value={incident.severity}
                  onChange={(e) => handleSeverityChange(e.target.value as IncidentSeverity)}
                  className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="CRITICAL">CRITICAL (Outage)</option>
                  <option value="HIGH">HIGH (Major degradation)</option>
                  <option value="MEDIUM">MEDIUM (SLA alert)</option>
                  <option value="LOW">LOW (Informational)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-[#1E293B]">
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Affected Service</span>
                  <span className="font-semibold text-slate-200">{incident.monitorName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Detected At</span>
                  <span className="font-mono text-slate-300">{new Date(incident.detectedAt).toLocaleString()}</span>
                </div>
                {incident.resolvedAt && (
                  <div className="flex justify-between py-1 text-emerald-400 font-semibold">
                    <span>Resolved At</span>
                    <span className="font-mono">{new Date(incident.resolvedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#1E293B]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Assigned Engineer</span>
                  {!incident.assignedUserId && (
                    <button
                      onClick={handleAssignToMe}
                      className="text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold"
                    >
                      Assign to me
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#0B1020] border border-[#1E293B] rounded-lg">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-200 font-medium">
                    {incident.assignedUserName || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


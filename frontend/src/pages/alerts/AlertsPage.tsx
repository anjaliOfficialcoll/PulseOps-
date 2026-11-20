import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Plus,
  Mail,
  Smartphone,
  Webhook,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Play,
  ShieldCheck,
  Send,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { alertService } from '../../services/alertService';
import { monitorService } from '../../services/monitorService';
import { AlertRule, NotificationLog, AlertChannel, AlertTriggerCondition, Monitor } from '../../types';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';

export const AlertsPage: React.FC = () => {
  const { isDemoMode } = useAuth();

  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<NotificationLog[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Rule Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    monitorId: '',
    channel: 'EMAIL' as AlertChannel,
    triggerCondition: 'ON_DOWN' as AlertTriggerCondition,
    thresholdMs: 1000,
    recipient: '',
  });

  // Test Alert Dispatch State
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [rList, hList, mList] = await Promise.all([
        alertService.getRules(isDemoMode),
        alertService.getDeliveryHistory(isDemoMode),
        monitorService.getMonitors(isDemoMode),
      ]);
      setRules(rList);
      setHistory(hList);
      setMonitors(mList);
    } catch (err) {
      console.error('Failed to load alert settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const selectedMon = monitors.find(m => m.id === formData.monitorId);
      await alertService.createRule({
        ...formData,
        monitorName: selectedMon?.name,
      }, isDemoMode);
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create alert rule');
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await alertService.deleteRule(id, isDemoMode);
      loadData();
    } catch (err) {
      console.error('Failed to delete rule', err);
    }
  };

  const handleTestAlert = async (channel: string, recipient: string) => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await alertService.testAlert(channel, recipient, isDemoMode);
      setTestResult(res.message);
      await loadData();
    } catch (err: any) {
      setTestResult(`Test failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Alert Rules & Dispatch Center</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure multi-channel notification policies, downtime thresholds, and audit confirmed delivery statuses.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Alert Policy</span>
        </button>
      </div>

      {testResult && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Alert Rules Section */}
      <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-4">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <BellRing className="w-4 h-4 text-indigo-400" />
          <span>Configured Notification Rules ({rules.length})</span>
        </h3>

        {rules.length === 0 ? (
          <EmptyState
            icon={BellRing}
            title="No Alert Rules"
            description="Create an alert policy to receive instant notifications via Email or In-App alerts when services degrade."
            actionText="Add Rule"
            onAction={() => setIsModalOpen(true)}
          />
        ) : (
          <div className="divide-y divide-[#1E293B] border border-[#1E293B] rounded-lg overflow-hidden">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 bg-[#0B1020]/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-[#1A253C] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    {rule.channel === 'EMAIL' ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">
                      Trigger: <span className="text-indigo-400 font-mono">{rule.triggerCondition}</span>
                      {rule.thresholdMs && ` (> ${rule.thresholdMs}ms)`}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Scope: {rule.monitorName || 'All Fleet Endpoints'} · Target: <strong className="text-slate-300">{rule.recipient}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                  <button
                    onClick={() => handleTestAlert(rule.channel, rule.recipient)}
                    disabled={isTesting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Send className="w-3 h-3 text-cyan-400" />
                    <span>Test Dispatch</span>
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Delivery History Table */}
      <div className="bg-[#151E30] border border-[#1E293B] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Confirmed Delivery Status Stream</h3>
            <p className="text-xs text-slate-400 mt-0.5">Strict delivery confirmation: alerts marked delivered only upon provider acknowledgement.</p>
          </div>
          <button onClick={loadData} className="p-1.5 rounded text-slate-400 hover:text-white">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1020] text-slate-400 border-b border-[#1E293B]">
              <tr>
                <th className="p-3.5 font-semibold">Dispatched At</th>
                <th className="p-3.5 font-semibold">Channel</th>
                <th className="p-3.5 font-semibold">Recipient</th>
                <th className="p-3.5 font-semibold">Subject / Message</th>
                <th className="p-3.5 font-semibold">Delivery Status</th>
                <th className="p-3.5 font-semibold">Retries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {history.map((log) => (
                <tr key={log.id} className="hover:bg-[#1A253C] transition-colors">
                  <td className="p-3.5 font-mono text-slate-300">{new Date(log.createdAt).toLocaleTimeString()}</td>
                  <td className="p-3.5 font-semibold text-indigo-400">{log.channel}</td>
                  <td className="p-3.5 text-slate-200">{log.recipient}</td>
                  <td className="p-3.5 text-slate-300 max-w-sm">
                    <div className="font-semibold text-slate-200 truncate">{log.subject}</div>
                    <div className="text-[11px] text-slate-400 truncate">{log.message}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-slate-400">{log.retryCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Alert Rule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Notification Rule"
        subtitle="Route automated health notifications when state transitions or latency spikes occur."
      >
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Target Scope</label>
            <select
              value={formData.monitorId}
              onChange={(e) => setFormData({ ...formData, monitorId: e.target.value })}
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
            >
              <option value="">All Fleet Monitors</option>
              {monitors.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.environment})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Channel</label>
              <select
                value={formData.channel}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value as AlertChannel })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App Notification</option>
                <option value="WEBHOOK">Webhook POST</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300">Trigger Event</label>
              <select
                value={formData.triggerCondition}
                onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value as AlertTriggerCondition })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value="ON_DOWN">When API Goes DOWN</option>
                <option value="ON_RECOVERY">When API Recovers</option>
                <option value="ON_LATENCY_THRESHOLD">When Latency Exceeds Threshold</option>
                <option value="ON_INCIDENT_CREATED">When Incident Declared</option>
                <option value="ON_INCIDENT_RESOLVED">When Incident Resolved</option>
              </select>
            </div>
          </div>

          {formData.triggerCondition === 'ON_LATENCY_THRESHOLD' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300">Latency Threshold (ms)</label>
              <input
                type="number"
                value={formData.thresholdMs}
                onChange={(e) => setFormData({ ...formData, thresholdMs: Number(e.target.value) })}
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300">Recipient Email or Webhook URL</label>
            <input
              type="text"
              required
              value={formData.recipient}
              onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
              placeholder="e.g. sre-alerts@company.io"
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
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
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
            >
              Save Alert Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


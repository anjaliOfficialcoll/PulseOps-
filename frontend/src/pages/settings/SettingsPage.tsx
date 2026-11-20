import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Shield,
  User,
  Building,
  Plus,
  Trash2,
  Copy,
  Check,
  Eye,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { settingService } from '../../services/settingService';
import { ApiKey, AuditLog } from '../../types';
import { Modal } from '../../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const { user, currentOrg, isDemoMode, refreshUserData } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'workspace' | 'keys' | 'audit'>('profile');
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Profile Form
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Workspace Form
  const [workspaceName, setWorkspaceName] = useState(currentOrg?.name || '');
  const [workspaceSuccess, setWorkspaceSuccess] = useState(false);

  // Key Generation Modal
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [hasCopied, setHasCopied] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [keys, logs] = await Promise.all([
        settingService.getApiKeys(isDemoMode),
        settingService.getAuditLogs(isDemoMode),
      ]);
      setApiKeys(keys);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (user) setFullName(user.fullName);
    if (currentOrg) setWorkspaceName(currentOrg.name);
  }, [isDemoMode, user, currentOrg]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingService.updateProfile(fullName, isDemoMode);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await settingService.updateWorkspace(workspaceName, isDemoMode);
      setWorkspaceSuccess(true);
      setTimeout(() => setWorkspaceSuccess(false), 3000);
      refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await settingService.createApiKey(newKeyName, isDemoMode);
      setGeneratedRawKey(created.rawKey || 'pop_live_sampletoken');
      setNewKeyName('');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyKey = () => {
    if (generatedRawKey) {
      navigator.clipboard.writeText(generatedRawKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Revoke this API Key immediately? External requests using this key will be rejected.')) return;
    try {
      await settingService.deleteApiKey(id, isDemoMode);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Settings & Governance</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage user profiles, multi-tenant workspace credentials, API access keys, and security audit logs.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] pb-2">
        {[
          { id: 'profile', name: 'User Profile', icon: User },
          { id: 'workspace', name: 'Workspace', icon: Building },
          { id: 'keys', name: 'API Access Keys', icon: Key },
          { id: 'audit', name: 'Audit Trail', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-xl p-6 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Personal Information</h3>
          {profileSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Profile details updated successfully.</span>
            </div>
          )}
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address (Read-only)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-3 py-2 text-slate-400 opacity-80"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Full Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Assigned Role</label>
              <input
                type="text"
                disabled
                value={user?.role || 'DEVELOPER'}
                className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-3 py-2 text-slate-400 opacity-80 font-mono font-bold"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Workspace Tab */}
      {activeTab === 'workspace' && (
        <div className="max-w-xl p-6 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-4">
          <h3 className="text-sm font-semibold text-slate-100">Organization Settings</h3>
          {workspaceSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Workspace configuration saved.</span>
            </div>
          )}
          <form onSubmit={handleUpdateWorkspace} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Workspace ID</label>
              <input
                type="text"
                disabled
                value={currentOrg?.id || 'org-main'}
                className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg px-3 py-2 text-slate-400 opacity-80 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Organization Name</label>
              <input
                type="text"
                required
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-slate-100 focus:outline-none"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
              >
                Update Workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'keys' && (
        <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>External Ingest & Automation API Keys ({apiKeys.length})</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticate CI/CD pipelines, Grafana dashboards, or telemetry collectors directly.
              </p>
            </div>
            <button
              onClick={() => {
                setGeneratedRawKey(null);
                setIsKeyModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate API Key</span>
            </button>
          </div>

          <div className="divide-y divide-[#1E293B] border border-[#1E293B] rounded-lg overflow-hidden">
            {apiKeys.map((k) => (
              <div key={k.id} className="p-4 bg-[#0B1020]/60 flex items-center justify-between gap-4 hover:bg-[#1A253C] transition-colors">
                <div>
                  <div className="text-sm font-semibold text-slate-200">{k.name}</div>
                  <div className="text-xs font-mono text-slate-400 mt-0.5">Prefix: {k.keyPrefix}••••••••••••</div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Created: {new Date(k.createdAt).toLocaleDateString()} · Last used: {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteKey(k.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                  title="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="bg-[#151E30] border border-[#1E293B] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#1E293B]">
            <h3 className="text-sm font-semibold text-slate-100">Security Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-0.5">Immutable record of administrative operations and rule modifications</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1020] text-slate-400 border-b border-[#1E293B]">
                <tr>
                  <th className="p-3.5 font-semibold">Timestamp</th>
                  <th className="p-3.5 font-semibold">User</th>
                  <th className="p-3.5 font-semibold">Action Performed</th>
                  <th className="p-3.5 font-semibold">Resource</th>
                  <th className="p-3.5 font-semibold">ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1A253C] transition-colors">
                    <td className="p-3.5 font-mono text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                    <td className="p-3.5 font-semibold text-indigo-400">{log.userName}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-200">{log.action}</td>
                    <td className="p-3.5 text-slate-300">{log.resourceType}</td>
                    <td className="p-3.5 font-mono text-slate-400">{log.resourceId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate API Key Modal */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title={generatedRawKey ? 'API Key Generated' : 'Create API Access Key'}
        subtitle={
          generatedRawKey
            ? 'Copy your secret token now. For security purposes, this secret key will NEVER be shown again.'
            : 'Generate a secret token for automated probes or ingestion.'
        }
      >
        {generatedRawKey ? (
          <div className="space-y-4">
            <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>Store this key securely in your environment variables. It cannot be recovered once closed.</span>
            </div>

            <div className="relative">
              <input
                type="text"
                readOnly
                value={generatedRawKey}
                className="w-full bg-[#0B1020] border border-[#1E293B] rounded-lg p-2.5 text-xs font-mono text-emerald-400 select-all pr-10"
              />
              <button
                onClick={handleCopyKey}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded"
                title="Copy to clipboard"
              >
                {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex justify-end pt-3">
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGenerateKey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300">Key Description</label>
              <input
                type="text"
                required
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. GitHub Action Deployment Pipeline"
                className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#1E293B]">
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
              >
                Generate Key
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import {
  Users2,
  FolderKanban,
  Plus,
  Shield,
  Mail,
  Trash2,
  UserCheck,
  CheckCircle2,
  UserX
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { teamService, TeamMember } from '../../services/teamService';
import { Project, UserRole } from '../../types';
import { Modal } from '../../components/common/Modal';

export const TeamPage: React.FC = () => {
  const { currentOrg, isDemoMode } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('DEVELOPER');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pList, mList] = await Promise.all([
        teamService.getProjects(isDemoMode),
        teamService.getMembers(isDemoMode),
      ]);
      setProjects(pList);
      setMembers(mList);
    } catch (err) {
      console.error('Failed to load team data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teamService.createProject({
        name: newProjectName,
        description: newProjectDesc,
      }, isDemoMode);
      setIsProjectModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await teamService.inviteMember(inviteEmail, inviteRole, isDemoMode);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to invite member');
    }
  };

  const handleRoleChange = async (memberId: string, role: UserRole) => {
    try {
      await teamService.updateRole(memberId, role, isDemoMode);
      loadData();
    } catch (err) {
      console.error('Failed to update role', err);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove member from organization?')) return;
    try {
      await teamService.removeMember(memberId, isDemoMode);
      loadData();
    } catch (err) {
      console.error('Failed to remove member', err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Projects & Organization RBAC</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Group API fleets into isolated projects, invite team collaborators, and enforce strict Role-Based Access Controls.
        </p>
      </div>

      {/* Projects Section */}
      <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-indigo-400" />
            <span>Monitored Projects ({projects.length})</span>
          </h3>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div key={proj.id} className="p-4 rounded-lg bg-[#0B1020] border border-[#1E293B] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-200">{proj.name}</span>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: proj.color || '#6366F1' }} />
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{proj.description || 'No description provided'}</p>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-[#1E293B]">
                {proj.monitorCount || 0} monitors associated
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members Section */}
      <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Users2 className="w-4 h-4 text-cyan-400" />
              <span>Team Members & Roles ({members.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Assigned roles apply across all organization endpoints</p>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>

        <div className="divide-y divide-[#1E293B] border border-[#1E293B] rounded-lg overflow-hidden">
          {members.map((mem) => (
            <div key={mem.id} className="p-4 bg-[#0B1020]/60 flex items-center justify-between gap-4 hover:bg-[#1A253C] transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-indigo-300 border border-slate-700">
                  {mem.fullName.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-200">{mem.fullName}</div>
                  <div className="text-xs text-slate-400">{mem.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={mem.role}
                  onChange={(e) => handleRoleChange(mem.id, e.target.value as UserRole)}
                  className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="OWNER">Owner (Full Admin)</option>
                  <option value="ADMIN">Admin (Fleet Manager)</option>
                  <option value="DEVELOPER">Developer (Edit & Trigger)</option>
                  <option value="VIEWER">Viewer (Read Only)</option>
                </select>

                <button
                  onClick={() => handleRemoveMember(mem.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Remove member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* New Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        title="Create New Project"
        subtitle="Group related microservices, lambdas, or API domains together."
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Project Name</label>
            <input
              type="text"
              required
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="e.g. Identity & Security"
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Description</label>
            <textarea
              rows={2}
              value={newProjectDesc}
              onChange={(e) => setNewProjectDesc(e.target.value)}
              placeholder="Brief description of the service tier..."
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg p-2 text-xs text-slate-100 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setIsProjectModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Invite Member Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Team Member"
        subtitle="Send an invitation to join this monitoring organization."
      >
        <form onSubmit={handleInviteMember} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300">Email Address</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.io"
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300">Assigned Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
              className="mt-1 w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none"
            >
              <option value="ADMIN">Admin</option>
              <option value="DEVELOPER">Developer</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500"
            >
              Send Invite
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};


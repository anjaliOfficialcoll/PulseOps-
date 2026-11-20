import apiClient from './api';
import { Project, User, UserRole } from '../types';
import { DEMO_PROJECTS } from './demoData';

export interface TeamMember {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  joinedAt: string;
}

let localDemoProjects = [...DEMO_PROJECTS];

let localDemoMembers: TeamMember[] = [
  { id: 'mem-1', userId: 'usr-demo-001', fullName: 'Alex Chen', email: 'alex.chen@pulseops.io', role: 'OWNER', joinedAt: '2026-01-10T08:00:00Z' },
  { id: 'mem-2', userId: 'usr-demo-002', fullName: 'Sarah Jenkins', email: 'sarah.jenkins@pulseops.io', role: 'ADMIN', joinedAt: '2026-01-14T09:30:00Z' },
  { id: 'mem-3', userId: 'usr-demo-003', fullName: 'David Patel', email: 'david.patel@pulseops.io', role: 'DEVELOPER', joinedAt: '2026-01-20T11:15:00Z' },
  { id: 'mem-4', userId: 'usr-demo-004', fullName: 'Elena Rostova', email: 'elena.rostova@pulseops.io', role: 'VIEWER', joinedAt: '2026-02-05T14:00:00Z' },
];

export const teamService = {
  async getProjects(isDemo = false): Promise<Project[]> {
    if (isDemo) return [...localDemoProjects];
    const res = await apiClient.get<Project[]>('/projects');
    return res.data;
  },

  async createProject(data: Partial<Project>, isDemo = false): Promise<Project> {
    if (isDemo) {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        organizationId: 'org-demo',
        name: data.name || 'New Project',
        description: data.description || '',
        color: data.color || '#6366F1',
        monitorCount: 0,
        createdAt: new Date().toISOString(),
      };
      localDemoProjects = [...localDemoProjects, newProj];
      return newProj;
    }
    const res = await apiClient.post<Project>('/projects', data);
    return res.data;
  },

  async deleteProject(id: string, isDemo = false): Promise<void> {
    if (isDemo) {
      localDemoProjects = localDemoProjects.filter(p => p.id !== id);
      return;
    }
    await apiClient.delete(`/projects/${id}`);
  },

  async getMembers(isDemo = false): Promise<TeamMember[]> {
    if (isDemo) return [...localDemoMembers];
    const res = await apiClient.get<TeamMember[]>('/team/members');
    return res.data;
  },

  async inviteMember(email: string, role: UserRole, isDemo = false): Promise<TeamMember> {
    if (isDemo) {
      const newMember: TeamMember = {
        id: `mem-${Date.now()}`,
        userId: `usr-${Date.now()}`,
        fullName: email.split('@')[0].replace('.', ' '),
        email,
        role,
        joinedAt: new Date().toISOString(),
      };
      localDemoMembers = [...localDemoMembers, newMember];
      return newMember;
    }
    const res = await apiClient.post<TeamMember>('/team/invite', { email, role });
    return res.data;
  },

  async updateRole(memberId: string, role: UserRole, isDemo = false): Promise<TeamMember> {
    if (isDemo) {
      localDemoMembers = localDemoMembers.map(m => m.id === memberId ? { ...m, role } : m);
      return localDemoMembers.find(m => m.id === memberId)!;
    }
    const res = await apiClient.patch<TeamMember>(`/team/members/${memberId}/role`, { role });
    return res.data;
  },

  async removeMember(memberId: string, isDemo = false): Promise<void> {
    if (isDemo) {
      localDemoMembers = localDemoMembers.filter(m => m.id !== memberId);
      return;
    }
    await apiClient.delete(`/team/members/${memberId}`);
  }
};


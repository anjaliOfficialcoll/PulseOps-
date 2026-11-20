import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, Project } from '../types';
import { DEMO_USER, DEMO_PROJECTS } from '../services/demoData';
import apiClient from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentOrg: Organization | null;
  organizations: Organization[];
  currentProject: Project | null;
  projects: Project[];
  isDemoMode: boolean;
  login: (token: string, user: User, orgs: Organization[]) => void;
  logout: () => void;
  setCurrentOrg: (org: Organization) => void;
  setCurrentProject: (proj: Project | null) => void;
  toggleDemoMode: (enable?: boolean) => void;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('pulseops_demo_mode') === 'true';
  });
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrgState] = useState<Organization | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('pulseops_jwt_token');
      const savedUserStr = localStorage.getItem('pulseops_user');
      const savedOrgStr = localStorage.getItem('pulseops_current_org');
      const demoFlag = localStorage.getItem('pulseops_demo_mode') === 'true';

      if (demoFlag) {
        setIsDemoMode(true);
        setUser(DEMO_USER);
        setToken('demo-jwt-token-active');
        const demoOrg: Organization = { id: 'org-demo', name: 'Acme Cloud Ops (Demo)', slug: 'acme-ops' };
        setOrganizations([demoOrg]);
        setCurrentOrgState(demoOrg);
        setProjects(DEMO_PROJECTS);
        setIsLoading(false);
        return;
      }

      if (savedToken && savedUserStr) {
        try {
          const parsedUser = JSON.parse(savedUserStr);
          setToken(savedToken);
          setUser(parsedUser);

          if (savedOrgStr) {
            setCurrentOrgState(JSON.parse(savedOrgStr));
          }

          // Fetch fresh user profile & orgs from backend
          const res = await apiClient.get('/auth/me');
          if (res.data) {
            setUser(res.data.user);
            setOrganizations(res.data.organizations || []);
            if (!savedOrgStr && res.data.organizations?.length > 0) {
              setCurrentOrgState(res.data.organizations[0]);
              localStorage.setItem('pulseops_current_org', JSON.stringify(res.data.organizations[0]));
              localStorage.setItem('pulseops_current_org_id', res.data.organizations[0].id);
            }
          }
        } catch (err) {
          console.warn('Session expired or offline. Using local session state.');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = (newToken: string, newUser: User, orgs: Organization[]) => {
    setIsDemoMode(false);
    localStorage.removeItem('pulseops_demo_mode');
    setToken(newToken);
    setUser(newUser);
    setOrganizations(orgs);
    localStorage.setItem('pulseops_jwt_token', newToken);
    localStorage.setItem('pulseops_user', JSON.stringify(newUser));

    if (orgs.length > 0) {
      setCurrentOrgState(orgs[0]);
      localStorage.setItem('pulseops_current_org', JSON.stringify(orgs[0]));
      localStorage.setItem('pulseops_current_org_id', orgs[0].id);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCurrentOrgState(null);
    setOrganizations([]);
    setProjects([]);
    setCurrentProjectState(null);
    setIsDemoMode(false);
    localStorage.removeItem('pulseops_jwt_token');
    localStorage.removeItem('pulseops_user');
    localStorage.removeItem('pulseops_current_org');
    localStorage.removeItem('pulseops_current_org_id');
    localStorage.removeItem('pulseops_demo_mode');
  };

  const setCurrentOrg = (org: Organization) => {
    setCurrentOrgState(org);
    localStorage.setItem('pulseops_current_org', JSON.stringify(org));
    localStorage.setItem('pulseops_current_org_id', org.id);
  };

  const setCurrentProject = (proj: Project | null) => {
    setCurrentProjectState(proj);
  };

  const toggleDemoMode = (enable?: boolean) => {
    const targetState = enable !== undefined ? enable : !isDemoMode;
    setIsDemoMode(targetState);
    if (targetState) {
      localStorage.setItem('pulseops_demo_mode', 'true');
      setUser(DEMO_USER);
      setToken('demo-jwt-token-active');
      const demoOrg: Organization = { id: 'org-demo', name: 'Acme Cloud Ops (Demo)', slug: 'acme-ops' };
      setOrganizations([demoOrg]);
      setCurrentOrgState(demoOrg);
      setProjects(DEMO_PROJECTS);
    } else {
      localStorage.removeItem('pulseops_demo_mode');
      logout();
    }
  };

  const refreshUserData = async () => {
    if (isDemoMode) return;
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data) {
        setUser(res.data.user);
        setOrganizations(res.data.organizations || []);
      }
    } catch (e) {
      console.error('Failed to refresh user data', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isLoading,
        currentOrg,
        organizations,
        currentProject,
        projects,
        isDemoMode,
        login,
        logout,
        setCurrentOrg,
        setCurrentProject,
        toggleDemoMode,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};


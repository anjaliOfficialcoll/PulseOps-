import apiClient from './api';
import { User, Organization } from '../types';

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  organizations: Organization[];
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },

  async register(fullName: string, email: string, password: string, organizationName: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', {
      fullName,
      email,
      password,
      organizationName,
    });
    return res.data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', { token, newPassword });
    return res.data;
  },

  async getCurrentUser(): Promise<AuthResponse> {
    const res = await apiClient.get<AuthResponse>('/auth/me');
    return res.data;
  },
};


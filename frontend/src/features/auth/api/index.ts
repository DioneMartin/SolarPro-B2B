import { apiClient } from '../../../shared/api/client';

export interface LoginPayload { email: string; password: string; tenantSlug: string; }
export interface SignupPayload { tenantName: string; slug: string; adminEmail: string; adminPassword: string; adminFullName: string; }

export const authApi = {
  login: (p: LoginPayload) => apiClient.post('/auth/login', p).then(r => r.data),
  signup: (p: SignupPayload) => apiClient.post('/auth/signup', p).then(r => r.data),
  me: () => apiClient.get('/auth/me').then(r => r.data),
};

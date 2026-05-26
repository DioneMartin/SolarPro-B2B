import { apiClient } from '../../../shared/api/client';

export const projectsApi = {
  list: (clientId?: string) => apiClient.get('/projects', { params: clientId ? { clientId } : {} }).then(r => r.data),
  get: (id: string) => apiClient.get(`/projects/${id}`).then(r => r.data),
  create: (body: any) => apiClient.post('/projects', body).then(r => r.data),
  dashboard: () => apiClient.get('/dashboard').then(r => r.data),
  selectProposal: (id: string, proposalId: string) =>
    apiClient.put(`/projects/${id}/select-proposal/${proposalId}`).then(r => r.data),
  approve: (id: string) => apiClient.put(`/projects/${id}/approve`).then(r => r.data),
};

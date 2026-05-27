import { apiClient } from '../../../shared/api/client';

export const proposalsApi = {
  generate: (projectId: string, body: any) =>
    apiClient.post(`/projects/${projectId}/proposals`, body).then(r => r.data),
  listByProject: (projectId: string) =>
    apiClient.get(`/projects/${projectId}/proposals`).then(r => r.data),
  listAll: () =>
    apiClient.get('/proposals').then(r => r.data),
  get: (id: string) => apiClient.get(`/proposals/${id}`).then(r => r.data),
  delete: (id: string) => apiClient.delete(`/proposals/${id}`).then(r => r.data),
  export: (id: string) => apiClient.post(`/proposals/${id}/export`).then(r => r.data),
};

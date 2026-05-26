import { apiClient } from '../../../shared/api/client';

export const clientsApi = {
  list: () => apiClient.get('/clients').then(r => r.data),
  get: (id: string) => apiClient.get(`/clients/${id}`).then(r => r.data),
  create: (body: any) => apiClient.post('/clients', body).then(r => r.data),
  update: (id: string, body: any) => apiClient.put(`/clients/${id}`, body).then(r => r.data),
};

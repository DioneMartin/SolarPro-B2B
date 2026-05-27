import { apiClient } from '../../../shared/api/client';

export const usersApi = {
  list: () => apiClient.get('/users').then(r => r.data),
  create: (body: { email: string; fullName: string; password: string; role: string }) =>
    apiClient.post('/users', body).then(r => r.data),
  changeRole: (id: string, role: string) =>
    apiClient.patch(`/users/${id}/role`, { role }).then(r => r.data),
  disable: (id: string) =>
    apiClient.patch(`/users/${id}/disable`).then(r => r.data),
};

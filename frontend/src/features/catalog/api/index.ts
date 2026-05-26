import { apiClient } from '../../../shared/api/client';

export const catalogApi = {
  panels: {
    list: (all = false) => apiClient.get('/catalog/panels', { params: { all } }).then(r => r.data),
    get: (id: string) => apiClient.get(`/catalog/panels/${id}`).then(r => r.data),
    create: (body: any) => apiClient.post('/catalog/panels', body).then(r => r.data),
    update: (id: string, body: any) => apiClient.patch(`/catalog/panels/${id}`, body).then(r => r.data),
    discontinue: (id: string) => apiClient.delete(`/catalog/panels/${id}`).then(r => r.data),
  },
  inverters: {
    list: (all = false) => apiClient.get('/catalog/inverters', { params: { all } }).then(r => r.data),
    get: (id: string) => apiClient.get(`/catalog/inverters/${id}`).then(r => r.data),
    create: (body: any) => apiClient.post('/catalog/inverters', body).then(r => r.data),
    update: (id: string, body: any) => apiClient.patch(`/catalog/inverters/${id}`, body).then(r => r.data),
    discontinue: (id: string) => apiClient.delete(`/catalog/inverters/${id}`).then(r => r.data),
  },
  aliases: {
    get: () => apiClient.get('/catalog/aliases').then(r => r.data),
    upsert: (body: any) => apiClient.put('/catalog/aliases', body).then(r => r.data),
  },
};

import { apiClient } from '../../../shared/api/client';

export const ingestionApi = {
  consumption: {
    manual: (projectId: string, body: any) =>
      apiClient.post(`/projects/${projectId}/consumption/manual`, body).then(r => r.data),
    upload: (projectId: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post(`/projects/${projectId}/consumption/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then(r => r.data);
    },
    get: (id: string) => apiClient.get(`/consumption/${id}`).then(r => r.data),
    update: (id: string, body: any) => apiClient.patch(`/consumption/${id}`, body).then(r => r.data),
  },
  surface: {
    lookup: (projectId: string, body: any) =>
      apiClient.post(`/projects/${projectId}/surface/lookup`, body).then(r => r.data),
    get: (id: string) => apiClient.get(`/surface/${id}`).then(r => r.data),
    override: (id: string, usableSqMeters: number) =>
      apiClient.patch(`/surface/${id}`, { usableSqMeters }).then(r => r.data),
  },
};

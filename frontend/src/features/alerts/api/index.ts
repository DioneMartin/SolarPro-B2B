import { apiClient } from '../../../shared/api/client';

export const alertsApi = {
  policies: {
    list: (projectId?: string) =>
      apiClient.get('/alerts/policies', { params: projectId ? { projectId } : {} }).then(r => r.data),
    create: (body: any) => apiClient.post('/alerts/policies', body).then(r => r.data),
    update: (id: string, body: any) => apiClient.patch(`/alerts/policies/${id}`, body).then(r => r.data),
    mute: (id: string) => apiClient.post(`/alerts/policies/${id}/mute`).then(r => r.data),
    unmute: (id: string) => apiClient.post(`/alerts/policies/${id}/unmute`).then(r => r.data),
    // Legacy endpoints map to mute/unmute on the backend
    enable: (id: string) => apiClient.post(`/alerts/policies/${id}/enable`).then(r => r.data),
    disable: (id: string) => apiClient.post(`/alerts/policies/${id}/disable`).then(r => r.data),
  },
  events: {
    list: (params?: { severity?: string; acknowledged?: boolean; since?: string; projectId?: string; source?: 'policy' | 'activity' }) =>
      apiClient.get('/alerts/events', { params }).then(r => r.data),
    acknowledge: (id: string) => apiClient.post(`/alerts/events/${id}/acknowledge`).then(r => r.data),
  },
};

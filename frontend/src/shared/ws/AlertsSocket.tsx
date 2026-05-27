import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { tokenStore } from '../auth/tokenStore';
import { useAuth } from '../auth/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

const severityColors: Record<string, string> = {
  INFO: 'blue',
  WARNING: 'yellow',
  CRITICAL: 'red',
};

export function AlertsSocket() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const canSeeAlerts = user?.role === 'TENANT_ADMIN' || user?.role === 'OPERATIONS';

  useEffect(() => {
    if (!isAuthenticated || !canSeeAlerts) return;
    const token = tokenStore.get();
    if (!token) return;

    const socket = io(`${WS_URL}/alerts`, {
      auth: { token },
      reconnectionDelay: 2000,
    });

    socket.on('alert', (payload: any) => {
      notifications.show({
        title: payload.title,
        message: payload.body ?? '',
        color: severityColors[payload.severity] ?? 'gray',
        autoClose: 6000,
      });
      // Refresh alerts query cache so the Alerts page is immediately up to date
      queryClient.invalidateQueries({ queryKey: ['alerts', 'events'] });
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [isAuthenticated, canSeeAlerts, queryClient]);

  return null;
}

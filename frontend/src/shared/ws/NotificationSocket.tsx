import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { tokenStore } from '../auth/tokenStore';
import { useAuth } from '../auth/AuthContext';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

/**
 * Maps event types to query keys that should be invalidated when
 * a real-time notification arrives.
 */
// All activity events also appear in the Alertas tab, so invalidate those queries too
const ALERTS_KEYS: string[][] = [['alerts', 'events'], ['alerts', 'unack-count']];

const EVENT_INVALIDATION: Record<string, string[][]> = {
  'client.created': [['clients'], ...ALERTS_KEYS],
  'project.created': [['projects'], ...ALERTS_KEYS],
  'consumption.updated': [['projects'], ...ALERTS_KEYS],
  'surface.updated': [['projects'], ...ALERTS_KEYS],
  'proposal.generated': [['proposals'], ['projects'], ...ALERTS_KEYS],
  'proposal.rejected': [['proposals'], ['projects'], ...ALERTS_KEYS],
  'project.rejected': [['projects'], ...ALERTS_KEYS],
  'project.approved': [['projects'], ...ALERTS_KEYS],
};

interface ActivityNotification {
  type: string;
  title: string;
  body: string;
  meta?: Record<string, unknown>;
}

export function NotificationSocket() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = tokenStore.get();
    if (!token) return;

    const socket = io(`${WS_URL}/notifications`, {
      auth: { token },
      reconnectionDelay: 2000,
    });

    socket.on('notification', (payload: ActivityNotification) => {
      // Show toast
      notifications.show({
        title: payload.title,
        message: payload.body,
        color: 'teal',
        autoClose: 6000,
      });

      // Invalidate relevant query caches so lists refresh automatically
      const keys = EVENT_INVALIDATION[payload.type];
      if (keys) {
        for (const key of keys) {
          queryClient.invalidateQueries({ queryKey: key });
        }
      }
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); };
  }, [isAuthenticated, queryClient]);

  return null;
}

import { StrictMode, Component, type ReactNode, type ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { AuthProvider } from './shared/auth/AuthContext';
import { AlertsSocket } from './shared/ws/AlertsSocket';
import { NotificationSocket } from './shared/ws/NotificationSocket';
import { router } from './app/router';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App crash:', error, info); }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', color: 'red' }}>
          <h2>App crashed — check console for details</h2>
          <pre>{err.message}</pre>
          <pre style={{ fontSize: 12, color: '#666' }}>{err.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <MantineProvider defaultColorScheme="light">
        <Notifications position="top-right" />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AlertsSocket />
            <NotificationSocket />
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </MantineProvider>
    </ErrorBoundary>
  </StrictMode>,
);

import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../shared/auth/AuthContext';
import { Center, Loader } from '@mantine/core';

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Center h="100vh"><Loader /></Center>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

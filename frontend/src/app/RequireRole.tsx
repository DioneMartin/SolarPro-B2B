import { Navigate } from 'react-router-dom';
import { useAuth, type Role } from '../shared/auth/AuthContext';
import type { ReactNode } from 'react';

export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

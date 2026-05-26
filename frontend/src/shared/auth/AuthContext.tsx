import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { tokenStore } from './tokenStore';
import { apiClient } from '../api/client';

export type Role = 'TENANT_ADMIN' | 'SOLAR_CONSULTANT' | 'INVENTORY_MANAGER' | 'OPERATIONS';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  tenantId: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) { setIsLoading(false); return; }
    apiClient.get('/auth/me')
      .then(r => setUser(r.data))
      .catch(() => tokenStore.clear())
      .finally(() => setIsLoading(false));
  }, []);

  const login = (token: string, user: AuthUser) => {
    tokenStore.set(token);
    setUser(user);
  };

  const logout = () => {
    tokenStore.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

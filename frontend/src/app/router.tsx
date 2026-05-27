import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShellLayout } from './layout/AppShell';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { SignupPage } from '../features/auth/pages/SignupPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClientsPage } from '../pages/ClientsPage';
import { ClientDetailPage } from '../pages/ClientDetailPage';
import { ProjectDetailPage } from '../pages/ProjectDetailPage';
import { CatalogPage } from '../pages/CatalogPage';
import { ProposalsPage } from '../pages/ProposalsPage';
import { AlertsPage } from '../pages/AlertsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { UsersPage } from '../pages/UsersPage';
import { RequireAuth } from './RequireAuth';
import { RequireRole } from './RequireRole';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  {
    element: <RequireAuth><AppShellLayout /></RequireAuth>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'clients', element: <RequireRole roles={['TENANT_ADMIN', 'SOLAR_CONSULTANT']}><ClientsPage /></RequireRole> },
      { path: 'clients/:clientId', element: <RequireRole roles={['TENANT_ADMIN', 'SOLAR_CONSULTANT']}><ClientDetailPage /></RequireRole> },
      { path: 'projects/:projectId', element: <RequireRole roles={['TENANT_ADMIN', 'SOLAR_CONSULTANT']}><ProjectDetailPage /></RequireRole> },
      { path: 'catalog', element: <RequireRole roles={['TENANT_ADMIN', 'INVENTORY_MANAGER']}><CatalogPage /></RequireRole> },
      { path: 'proposals', element: <RequireRole roles={['TENANT_ADMIN', 'SOLAR_CONSULTANT']}><ProposalsPage /></RequireRole> },
      { path: 'alerts', element: <RequireRole roles={['TENANT_ADMIN', 'OPERATIONS']}><AlertsPage /></RequireRole> },
      { path: 'users', element: <RequireRole roles={['TENANT_ADMIN']}><UsersPage /></RequireRole> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

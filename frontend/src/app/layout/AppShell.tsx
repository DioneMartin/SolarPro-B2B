import { AppShell as MantineAppShell, NavLink, Group, Text, Burger, Badge, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthContext';
import { RoleGate } from '../../shared/ui/RoleGate';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../../features/alerts/api';

const navItems = [
  { label: 'Dashboard', path: '/', roles: ['TENANT_ADMIN', 'SOLAR_CONSULTANT', 'OPERATIONS', 'INVENTORY_MANAGER'] },
  { label: 'Clients', path: '/clients', roles: ['TENANT_ADMIN', 'SOLAR_CONSULTANT'] },
  { label: 'Catalog', path: '/catalog', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER'] },
  { label: 'Proposals', path: '/proposals', roles: ['TENANT_ADMIN', 'SOLAR_CONSULTANT'] },
  { label: 'Alerts', path: '/alerts', roles: ['TENANT_ADMIN', 'OPERATIONS'] },
  { label: 'Team', path: '/users', roles: ['TENANT_ADMIN'] },
  { label: 'Settings', path: '/settings', roles: ['TENANT_ADMIN'] },
] as const;

export function AppShellLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const canSeeAlertEvents = !!user && (user.role === 'TENANT_ADMIN' || user.role === 'OPERATIONS');
  const { data: unackEvents } = useQuery({
    queryKey: ['alerts', 'events', 'unack'],
    queryFn: () => alertsApi.events.list({ acknowledged: false }),
    refetchInterval: 60_000,
    enabled: canSeeAlertEvents,
  });
  const unackCount = unackEvents?.length ?? 0;

  return (
    <MantineAppShell
      header={{ height: 56 }}
      navbar={{ width: 220, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <MantineAppShell.Header p="xs">
        <Group justify="space-between" h="100%">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text fw={700} size="lg" c="blue">SolarPro</Text>
            {user?.tenantName && <Text size="sm" c="dimmed">· {user.tenantName}</Text>}
          </Group>
          <Group>
            {unackCount > 0 && (
              <Badge color="red" radius="xl" onClick={() => navigate('/alerts')} style={{ cursor: 'pointer' }}>
                {unackCount} alert{unackCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <Text size="sm" c="dimmed">{user?.email}</Text>
            <ActionIcon variant="subtle" onClick={logout} title="Logout">
              <span>↩</span>
            </ActionIcon>
          </Group>
        </Group>
      </MantineAppShell.Header>

      <MantineAppShell.Navbar p="xs">
        {navItems.map(item => (
          <RoleGate key={item.path} roles={item.roles as any}>
            <NavLink
              label={item.label}
              active={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
              onClick={() => navigate(item.path)}
              mb={2}
            />
          </RoleGate>
        ))}
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
}

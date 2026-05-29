import { AppShell as MantineAppShell, NavLink, Group, Text, Burger, Badge, ActionIcon } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../shared/auth/AuthContext';
import { RoleGate } from '../../shared/ui/RoleGate';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../../features/alerts/api';

const navItems = [
  { label: 'Tablero', path: '/', roles: ['TENANT_ADMIN', 'SOLAR_CONSULTANT', 'OPERATIONS', 'INVENTORY_MANAGER'] },
  { label: 'Clientes', path: '/clients', roles: ['TENANT_ADMIN', 'SOLAR_CONSULTANT'] },
  { label: 'Proyectos', path: '/projects', roles: ['TENANT_ADMIN', 'SOLAR_CONSULTANT'] },
  { label: 'Catálogo', path: '/catalog', roles: ['TENANT_ADMIN', 'INVENTORY_MANAGER'] },
  { label: 'Propuestas', path: '/proposals', roles: ['TENANT_ADMIN', 'SOLAR_CONSULTANT'] },
  { label: 'Alertas', path: '/alerts', roles: ['TENANT_ADMIN', 'OPERATIONS', 'SOLAR_CONSULTANT', 'INVENTORY_MANAGER'] },
  { label: 'Equipo', path: '/users', roles: ['TENANT_ADMIN'] },
  { label: 'Configuración', path: '/settings', roles: ['TENANT_ADMIN'] },
] as const;

export function AppShellLayout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: unackEvents } = useQuery({
    queryKey: ['alerts', 'events', 'unack'],
    queryFn: () => alertsApi.events.list({ acknowledged: false }),
    refetchInterval: 60_000,
    enabled: !!user,
  });
  const unackCount = unackEvents?.length ?? 0;

  // Navega a la ruta y cierra el navbar (relevante en móvil)
  const handleNavClick = (path: string) => {
    navigate(path);
    close();
  };

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
              <Badge color="red" radius="xl" onClick={() => handleNavClick('/alerts')} style={{ cursor: 'pointer' }}>
                {unackCount} alerta{unackCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <Text size="sm" c="dimmed">{user?.email}</Text>
            <ActionIcon variant="subtle" onClick={logout} title="Cerrar sesión">
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
              onClick={() => handleNavClick(item.path)}
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
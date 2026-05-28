import { SimpleGrid, Card, Text, Title, Stack, Badge, Group, Loader, Center, Table } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../features/projects/api';
import { alertsApi } from '../features/alerts/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/auth/AuthContext';

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text size="xl" fw={800} c={color} mt={4}>{value}</Text>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'gray',
  READY_FOR_PROPOSAL: 'yellow',
  PROPOSED: 'orange',
  APPROVED: 'green',
  INSTALLED: 'teal',
  REJECTED: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  READY_FOR_PROPOSAL: 'Listo para propuesta',
  PROPOSED: 'Propuesto',
  APPROVED: 'Aprobado',
  INSTALLED: 'Instalado',
  REJECTED: 'Rechazado',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canSeeAlertEvents = user?.role === 'TENANT_ADMIN' || user?.role === 'OPERATIONS';

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.dashboard,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });
  const { data: alertEvents } = useQuery({
    queryKey: ['alerts', 'events', 'unack'],
    queryFn: () => alertsApi.events.list({ acknowledged: false }),
    refetchInterval: 30_000,
    enabled: canSeeAlertEvents,
  });

  if (isLoading) return <Center h={300}><Loader /></Center>;

  const counts = dashboard?.statusCounts ?? {};
  const recentProjects = dashboard?.recentProjects ?? [];

  return (
    <Stack>
      <Title order={2}>Tablero</Title>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
        <StatCard label="Borrador" value={counts.DRAFT ?? 0} color="gray" />
        <StatCard label="Listo" value={counts.READY_FOR_PROPOSAL ?? 0} color="yellow" />
        <StatCard label="Propuesto" value={counts.PROPOSED ?? 0} color="orange" />
        <StatCard label="Aprobado" value={counts.APPROVED ?? 0} color="green" />
        <StatCard label="Instalado" value={counts.INSTALLED ?? 0} color="teal" />
      </SimpleGrid>

      <Stack mt="md">
        <Title order={4}>Proyectos recientes</Title>
        {recentProjects.length === 0 ? (
          <Text c="dimmed" size="sm">Aún no hay proyectos. Crea un cliente y un proyecto para comenzar.</Text>
        ) : (
          <Table striped highlightOnHover withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Proyecto</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Actualizado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {recentProjects.map((p: any) => (
                <Table.Tr
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <Table.Td>{p.name}</Table.Td>
                  <Table.Td>
                    <Badge color={STATUS_COLORS[p.status] ?? 'gray'} size="sm">{STATUS_LABELS[p.status] ?? p.status}</Badge>
                  </Table.Td>
                  <Table.Td>{new Date(p.updatedAt).toLocaleString()}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      {alertEvents && alertEvents.length > 0 && (
        <Stack mt="md">
          <Title order={4}>Alertas recientes sin reconocer</Title>
          {alertEvents.slice(0, 5).map((ev: any) => (
            <Card key={ev.id} withBorder radius="md" p="sm" style={{ cursor: 'pointer' }}
              onClick={() => navigate('/alerts')}>
              <Group justify="space-between">
                <Text size="sm" fw={500}>{ev.title}</Text>
                <Badge color={ev.severity === 'CRITICAL' ? 'red' : ev.severity === 'WARNING' ? 'yellow' : 'blue'}>
                  {ev.severity}
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">{new Date(ev.triggeredAt).toLocaleString()}</Text>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

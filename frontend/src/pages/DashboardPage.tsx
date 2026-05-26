import { SimpleGrid, Card, Text, Title, Stack, Badge, Group, Loader, Center } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '../features/projects/api';
import { alertsApi } from '../features/alerts/api';
import { useNavigate } from 'react-router-dom';

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card withBorder shadow="sm" radius="md" p="lg">
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
      <Text size="xl" fw={800} c={color} mt={4}>{value}</Text>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: projectsApi.dashboard,
  });
  const { data: alertEvents } = useQuery({
    queryKey: ['alerts', 'events', 'unack'],
    queryFn: () => alertsApi.events.list({ acknowledged: false }),
    refetchInterval: 30_000,
  });

  if (isLoading) return <Center h={300}><Loader /></Center>;

  const counts = dashboard?.byStatus ?? {};

  return (
    <Stack>
      <Title order={2}>Dashboard</Title>
      <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }}>
        <StatCard label="Draft" value={counts.DRAFT ?? 0} color="gray" />
        <StatCard label="In Progress" value={(counts.CONSUMPTION ?? 0) + (counts.SURFACE ?? 0)} color="blue" />
        <StatCard label="Ready" value={counts.READY_FOR_PROPOSAL ?? 0} color="yellow" />
        <StatCard label="Proposal Selected" value={counts.PROPOSAL_SELECTED ?? 0} color="orange" />
        <StatCard label="Approved" value={counts.APPROVED ?? 0} color="green" />
      </SimpleGrid>

      {alertEvents && alertEvents.length > 0 && (
        <Stack mt="md">
          <Title order={4}>Recent Unacknowledged Alerts</Title>
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

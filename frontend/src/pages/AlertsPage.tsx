import { useState } from 'react';
import {
  Stack, Title, Tabs, Table, Badge, Button, Group, Center, Loader,
  Text, Modal, Select, NumberInput, TextInput, Switch,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@mantine/form';
import { alertsApi } from '../features/alerts/api';

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'gray', MEDIUM: 'yellow', HIGH: 'orange', CRITICAL: 'red',
};

function PoliciesTab() {
  const qc = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['alerts', 'policies'],
    queryFn: () => alertsApi.policies.list(),
  });

  const form = useForm({
    initialValues: {
      projectId: '',
      strategyKind: 'TIME_BASED' as string,
      // WEATHER_BASED fields
      lat: 0,
      lon: 0,
      windGustKmhAbove: 80,
      rainMmInDayAbove: 50,
      aqiAbove: 150,
      pollenAbove: 3,
      pollIntervalMinutes: 60,
    },
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (v: typeof form.values) => {
      let config: any;
      if (v.strategyKind === 'TIME_BASED') {
        // Default schedule: quarterly panel cleaning + annual inverter check
        config = {
          schedule: [
            { kind: 'PANEL_CLEANING', cron: '0 9 1 */3 *', leadDays: 7 },
            { kind: 'INVERTER_CHECK', cron: '0 9 1 1 *', leadDays: 14 },
          ],
        };
      } else {
        config = {
          coords: { lat: v.lat, lon: v.lon },
          thresholds: {
            windGustKmhAbove: v.windGustKmhAbove,
            rainMmInDayAbove: v.rainMmInDayAbove,
            aqiAbove: v.aqiAbove,
            pollenAbove: v.pollenAbove,
          },
          pollIntervalMinutes: v.pollIntervalMinutes,
        };
      }
      return alertsApi.policies.create({
        projectId: v.projectId,
        strategyKind: v.strategyKind,
        config,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts', 'policies'] }); close(); form.reset(); },
  });

  const { mutate: toggle } = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      enabled ? alertsApi.policies.disable(id) : alertsApi.policies.enable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', 'policies'] }),
  });

  if (isLoading) return <Center h={200}><Loader /></Center>;

  return (
    <Stack>
      <Group justify="flex-end">
        <Button onClick={open}>+ New Policy</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Strategy</Table.Th>
            <Table.Th>Project</Table.Th>
            <Table.Th>Enabled</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {policies.map((p: any) => (
            <Table.Tr key={p.id}>
              <Table.Td><Badge size="sm">{p.strategyKind}</Badge></Table.Td>
              <Table.Td>{p.projectId ? p.projectId.slice(0, 8) + '…' : '(all)'}</Table.Td>
              <Table.Td>
                <Switch
                  checked={p.enabled}
                  onChange={() => toggle({ id: p.id, enabled: p.enabled })}
                />
              </Table.Td>
              <Table.Td>
                <Button
                  size="xs" variant="subtle" color="red"
                  onClick={() => toggle({ id: p.id, enabled: true })}
                >
                  Disable
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="New Alert Policy" size="md">
        <form onSubmit={form.onSubmit((v) => create(v))}>
          <Stack>
            <TextInput
              label="Project ID"
              description="The project must be in APPROVED status"
              required
              {...form.getInputProps('projectId')}
            />
            <Select
              label="Strategy"
              data={[
                { value: 'TIME_BASED', label: 'Time-based (maintenance reminders)' },
                { value: 'WEATHER_BASED', label: 'Weather-based (environmental conditions)' },
              ]}
              {...form.getInputProps('strategyKind')}
            />

            {form.values.strategyKind === 'TIME_BASED' && (
              <Text size="xs" c="dimmed">
                Default schedule: quarterly panel cleaning + annual inverter check.
                Edit the policy config after creation for custom cron schedules.
              </Text>
            )}

            {form.values.strategyKind === 'WEATHER_BASED' && (
              <Stack>
                <Text size="xs" c="dimmed">
                  Monitors weather conditions at the project site.
                  Fires an alert when thresholds are exceeded.
                </Text>
                <Group grow>
                  <NumberInput label="Site latitude" decimalScale={6} required
                    {...form.getInputProps('lat')} />
                  <NumberInput label="Site longitude" decimalScale={6} required
                    {...form.getInputProps('lon')} />
                </Group>
                <Group grow>
                  <NumberInput label="Wind gust above (km/h)" min={0}
                    {...form.getInputProps('windGustKmhAbove')} />
                  <NumberInput label="Rain above (mm/day)" min={0}
                    {...form.getInputProps('rainMmInDayAbove')} />
                </Group>
                <Group grow>
                  <NumberInput label="AQI above (US)" min={0}
                    {...form.getInputProps('aqiAbove')} />
                  <NumberInput label="Pollen index above" min={0} max={5}
                    {...form.getInputProps('pollenAbove')} />
                </Group>
                <NumberInput label="Poll interval (minutes)" min={15} max={1440}
                  {...form.getInputProps('pollIntervalMinutes')} />
              </Stack>
            )}

            <Button type="submit" loading={isPending}>Create Policy</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

function EventsTab() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unack'>('unack');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['alerts', 'events', filter],
    queryFn: () => alertsApi.events.list(filter === 'unack' ? { acknowledged: false } : {}),
  });

  const { mutate: ack } = useMutation({
    mutationFn: (id: string) => alertsApi.events.acknowledge(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts', 'events'] });
      qc.invalidateQueries({ queryKey: ['alerts', 'unack-count'] });
    },
  });

  if (isLoading) return <Center h={200}><Loader /></Center>;

  return (
    <Stack>
      <Group>
        <Button variant={filter === 'unack' ? 'filled' : 'outline'} size="xs"
          onClick={() => setFilter('unack')}>Unacknowledged</Button>
        <Button variant={filter === 'all' ? 'filled' : 'outline'} size="xs"
          onClick={() => setFilter('all')}>All Events</Button>
      </Group>

      {events.length === 0 ? (
        <Text c="dimmed">No alert events found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Project</Table.Th>
              <Table.Th>Severity</Table.Th>
              <Table.Th>Title</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {events.map((e: any) => (
              <Table.Tr key={e.id}>
                <Table.Td>{new Date(e.firedAt).toLocaleString()}</Table.Td>
                <Table.Td>{e.projectId ? e.projectId.slice(0, 8) + '…' : '—'}</Table.Td>
                <Table.Td>
                  <Badge color={SEVERITY_COLORS[e.severity] ?? 'gray'} size="sm">{e.severity}</Badge>
                </Table.Td>
                <Table.Td>{e.title}</Table.Td>
                <Table.Td>
                  <Badge color={e.acknowledgedAt ? 'green' : 'orange'} size="sm">
                    {e.acknowledgedAt ? 'Acknowledged' : 'Open'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {!e.acknowledgedAt && (
                    <Button size="xs" variant="light" onClick={() => ack(e.id)}>Acknowledge</Button>
                  )}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

export function AlertsPage() {
  return (
    <Stack>
      <Title order={2}>Alerts</Title>
      <Tabs defaultValue="events">
        <Tabs.List>
          <Tabs.Tab value="events">Events</Tabs.Tab>
          <Tabs.Tab value="policies">Policies</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="events" pt="md"><EventsTab /></Tabs.Panel>
        <Tabs.Panel value="policies" pt="md"><PoliciesTab /></Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

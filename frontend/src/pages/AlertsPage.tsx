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
      name: '',
      // TIME_BASED config
      schedule: 'QUARTERLY' as string,
      // WEATHER_BASED config
      maxTempC: 40,
      minTempC: -10,
      maxWindKph: 80,
      maxAqiUs: 150,
      maxPollenIndex: 3,
    },
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (v: typeof form.values) => {
      const config = v.strategyKind === 'TIME_BASED'
        ? { schedule: v.schedule }
        : {
            maxTempC: v.maxTempC,
            minTempC: v.minTempC,
            maxWindKph: v.maxWindKph,
            maxAqiUs: v.maxAqiUs,
            maxPollenIndex: v.maxPollenIndex,
          };
      return alertsApi.policies.create({
        projectId: v.projectId || undefined,
        strategyKind: v.strategyKind,
        name: v.name,
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
            <Table.Th>Name</Table.Th>
            <Table.Th>Strategy</Table.Th>
            <Table.Th>Project</Table.Th>
            <Table.Th>Enabled</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {policies.map((p: any) => (
            <Table.Tr key={p.id}>
              <Table.Td>{p.name}</Table.Td>
              <Table.Td><Badge size="sm">{p.strategyKind}</Badge></Table.Td>
              <Table.Td>{p.projectId ? p.projectId.slice(0, 8) + '…' : '(all)'}</Table.Td>
              <Table.Td>
                <Switch
                  checked={p.enabled}
                  onChange={() => toggle({ id: p.id, enabled: p.enabled })}
                />
              </Table.Td>
              <Table.Td>
                <Button size="xs" variant="subtle" color="red">Delete</Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="New Alert Policy" size="md">
        <form onSubmit={form.onSubmit((v) => create(v))}>
          <Stack>
            <TextInput label="Policy name" required {...form.getInputProps('name')} />
            <TextInput label="Project ID (leave blank for all)" {...form.getInputProps('projectId')} />
            <Select
              label="Strategy"
              data={[
                { value: 'TIME_BASED', label: 'Time-based (maintenance reminders)' },
                { value: 'WEATHER_BASED', label: 'Weather-based (environmental conditions)' },
              ]}
              {...form.getInputProps('strategyKind')}
            />

            {form.values.strategyKind === 'TIME_BASED' && (
              <Select
                label="Schedule"
                data={[
                  { value: 'QUARTERLY', label: 'Quarterly' },
                  { value: 'ANNUALLY', label: 'Annually' },
                ]}
                {...form.getInputProps('schedule')}
              />
            )}

            {form.values.strategyKind === 'WEATHER_BASED' && (
              <Stack>
                <Group grow>
                  <NumberInput label="Max Temp (°C)" {...form.getInputProps('maxTempC')} />
                  <NumberInput label="Min Temp (°C)" {...form.getInputProps('minTempC')} />
                </Group>
                <NumberInput label="Max Wind (km/h)" {...form.getInputProps('maxWindKph')} />
                <NumberInput label="Max AQI (US)" {...form.getInputProps('maxAqiUs')} />
                <NumberInput label="Max Pollen Index" min={0} max={5} {...form.getInputProps('maxPollenIndex')} />
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
        <Button
          variant={filter === 'unack' ? 'filled' : 'outline'}
          size="xs"
          onClick={() => setFilter('unack')}
        >
          Unacknowledged
        </Button>
        <Button
          variant={filter === 'all' ? 'filled' : 'outline'}
          size="xs"
          onClick={() => setFilter('all')}
        >
          All Events
        </Button>
      </Group>

      {events.length === 0 ? (
        <Text c="dimmed">No alert events found.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Time</Table.Th>
              <Table.Th>Project</Table.Th>
              <Table.Th>Policy</Table.Th>
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
                <Table.Td>{e.policyId.slice(0, 8)}…</Table.Td>
                <Table.Td>
                  <Badge color={SEVERITY_COLORS[e.severity] ?? 'gray'} size="sm">
                    {e.severity}
                  </Badge>
                </Table.Td>
                <Table.Td>{e.title}</Table.Td>
                <Table.Td>
                  <Badge color={e.acknowledgedAt ? 'green' : 'orange'} size="sm">
                    {e.acknowledgedAt ? 'Acknowledged' : 'Open'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {!e.acknowledgedAt && (
                    <Button size="xs" variant="light" onClick={() => ack(e.id)}>
                      Acknowledge
                    </Button>
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

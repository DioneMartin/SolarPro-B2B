import { useState } from 'react';
import {
  Stack, Title, Tabs, Table, Badge, Button, Group, Center, Loader,
  Text, Modal, Select, NumberInput, TextInput, Switch,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@mantine/form';
import { alertsApi } from '../features/alerts/api';
import { useAuth } from '../shared/auth/AuthContext';
import type { Role } from '../shared/auth/AuthContext';

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'gray', MEDIUM: 'yellow', HIGH: 'orange', CRITICAL: 'red', INFO: 'blue', WARNING: 'orange',
};

const SEVERITY_LABELS: Record<string, string> = {
  LOW: 'Baja', MEDIUM: 'Media', HIGH: 'Alta', CRITICAL: 'Crítica', INFO: 'Info', WARNING: 'Advertencia',
};

const STRATEGY_LABELS: Record<string, string> = {
  TIME_BASED: 'Por tiempo', WEATHER_BASED: 'Por clima',
};

/** Which event source to show based on the user's role */
function eventSourceForRole(role: Role): 'policy' | 'activity' | undefined {
  if (role === 'TENANT_ADMIN') return undefined;       // all events
  if (role === 'OPERATIONS') return 'policy';          // time/weather policy alerts only
  return 'activity';                                   // SOLAR_CONSULTANT + INVENTORY_MANAGER
}

/** Which roles can manage (create/enable/disable) alert policies */
function canManagePolicies(role: Role): boolean {
  return role === 'TENANT_ADMIN' || role === 'OPERATIONS';
}

/** Which roles see the Políticas tab */
function canSeePoliciesTab(role: Role): boolean {
  return role === 'TENANT_ADMIN' || role === 'OPERATIONS';
}

function PoliciesTab() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const canManage = !!user && canManagePolicies(user.role);
  const [opened, { open, close }] = useDisclosure(false);

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['alerts', 'policies'],
    queryFn: () => alertsApi.policies.list(),
  });

  const form = useForm({
    initialValues: {
      projectId: '',
      strategyKind: 'TIME_BASED' as string,
      // WEATHER_BASED fields (lat/lon come from project site address)
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
        config = {
          schedule: [
            { kind: 'PANEL_CLEANING', cron: '0 9 1 */3 *', leadDays: 7 },
            { kind: 'INVERTER_CHECK', cron: '0 9 1 1 *', leadDays: 14 },
          ],
        };
      } else {
        // coords are omitted — the backend derives them from the project's site address
        config = {
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

  const { mutate: toggleMute } = useMutation({
    mutationFn: ({ id, muted }: { id: string; muted: boolean }) =>
      muted ? alertsApi.policies.unmute(id) : alertsApi.policies.mute(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts', 'policies'] }),
  });

  if (isLoading) return <Center h={200}><Loader /></Center>;

  return (
    <Stack>
      {canManage && (
        <Group justify="flex-end">
          <Button onClick={open}>+ Nueva política</Button>
        </Group>
      )}

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Estrategia</Table.Th>
            <Table.Th>Proyecto</Table.Th>
            <Table.Th>Notificaciones</Table.Th>
            {canManage && <Table.Th>Acciones</Table.Th>}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {policies.map((p: any) => (
            <Table.Tr key={p.id}>
              <Table.Td><Badge size="sm">{STRATEGY_LABELS[p.strategyKind] ?? p.strategyKind}</Badge></Table.Td>
              <Table.Td>{p.projectId ? p.projectId.slice(0, 8) + '…' : '(todos)'}</Table.Td>
              <Table.Td>
                <Switch
                  checked={!p.muted}
                  onChange={() => toggleMute({ id: p.id, muted: p.muted })}
                  label={p.muted ? 'Silenciada' : 'Activa'}
                />
              </Table.Td>
              {canManage && (
                <Table.Td>
                  <Button
                    size="xs" variant="subtle" color={p.muted ? 'green' : 'orange'}
                    onClick={() => toggleMute({ id: p.id, muted: p.muted })}
                  >
                    {p.muted ? 'Activar' : 'Silenciar'}
                  </Button>
                </Table.Td>
              )}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Nueva política de alertas" size="md">
        <form onSubmit={form.onSubmit((v) => create(v))}>
          <Stack>
            <TextInput
              label="ID del proyecto"
              description="El proyecto debe estar en estado APROBADO"
              required
              {...form.getInputProps('projectId')}
            />
            <Select
              label="Estrategia"
              data={[
                { value: 'TIME_BASED', label: 'Por tiempo (recordatorios de mantenimiento)' },
                { value: 'WEATHER_BASED', label: 'Por clima (condiciones ambientales)' },
              ]}
              {...form.getInputProps('strategyKind')}
            />

            {form.values.strategyKind === 'TIME_BASED' && (
              <Text size="xs" c="dimmed">
                Programación predeterminada: limpieza trimestral de paneles + revisión anual del inversor.
                Edita la configuración de la política tras crearla para programaciones cron personalizadas.
              </Text>
            )}

            {form.values.strategyKind === 'WEATHER_BASED' && (
              <Stack>
                <Text size="xs" c="dimmed">
                  Monitorea las condiciones climáticas en el sitio del proyecto.
                  Las coordenadas se obtienen automáticamente de la dirección del proyecto.
                  Dispara una alerta cuando se superan los umbrales.
                </Text>
                <Group grow>
                  <NumberInput label="Ráfaga de viento sobre (km/h)" min={0}
                    {...form.getInputProps('windGustKmhAbove')} />
                  <NumberInput label="Lluvia sobre (mm/día)" min={0}
                    {...form.getInputProps('rainMmInDayAbove')} />
                </Group>
                <Group grow>
                  <NumberInput label="ICA sobre (EE. UU.)" min={0}
                    {...form.getInputProps('aqiAbove')} />
                  <NumberInput label="Índice de polen sobre" min={0} max={5}
                    {...form.getInputProps('pollenAbove')} />
                </Group>
                <NumberInput label="Intervalo de sondeo (minutos)" min={15} max={1440}
                  {...form.getInputProps('pollIntervalMinutes')} />
              </Stack>
            )}

            <Button type="submit" loading={isPending}>Crear política</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

function EventsTab({ role }: { role: Role }) {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unack'>('unack');
  const source = eventSourceForRole(role);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['alerts', 'events', filter, source],
    queryFn: () => alertsApi.events.list({
      acknowledged: filter === 'unack' ? false : undefined,
      source,
    }),
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
          onClick={() => setFilter('unack')}>Sin reconocer</Button>
        <Button variant={filter === 'all' ? 'filled' : 'outline'} size="xs"
          onClick={() => setFilter('all')}>Todos los eventos</Button>
      </Group>

      {events.length === 0 ? (
        <Text c="dimmed">No se encontraron eventos de alerta.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Hora</Table.Th>
              <Table.Th>Proyecto</Table.Th>
              <Table.Th>Severidad</Table.Th>
              <Table.Th>Título</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {events.map((e: any) => (
              <Table.Tr key={e.id}>
                <Table.Td>{new Date(e.firedAt ?? e.triggeredAt).toLocaleString()}</Table.Td>
                <Table.Td>{e.projectId ? e.projectId.slice(0, 8) + '…' : '—'}</Table.Td>
                <Table.Td>
                  <Badge color={SEVERITY_COLORS[e.severity] ?? 'gray'} size="sm">{SEVERITY_LABELS[e.severity] ?? e.severity}</Badge>
                </Table.Td>
                <Table.Td>{e.title}</Table.Td>
                <Table.Td>
                  <Badge color={e.acknowledgedAt ? 'green' : 'orange'} size="sm">
                    {e.acknowledgedAt ? 'Reconocida' : 'Abierta'}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {!e.acknowledgedAt && (
                    <Button size="xs" variant="light" onClick={() => ack(e.id)}>Reconocer</Button>
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
  const { user } = useAuth();
  if (!user) return null;

  const showPoliciesTab = canSeePoliciesTab(user.role);

  return (
    <Stack>
      <Title order={2}>Alertas</Title>
      <Tabs defaultValue="events">
        <Tabs.List>
          <Tabs.Tab value="events">Eventos</Tabs.Tab>
          {showPoliciesTab && <Tabs.Tab value="policies">Políticas</Tabs.Tab>}
        </Tabs.List>
        <Tabs.Panel value="events" pt="md"><EventsTab role={user.role} /></Tabs.Panel>
        {showPoliciesTab && <Tabs.Panel value="policies" pt="md"><PoliciesTab /></Tabs.Panel>}
      </Tabs>
    </Stack>
  );
}

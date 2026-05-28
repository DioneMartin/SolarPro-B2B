import { useState } from 'react';
import {
  Stack, Title, Text, Badge, Tabs, Button, Group, Loader, Center,
  FileInput, NumberInput, Modal, Paper, ActionIcon, Table, SimpleGrid, Card,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { projectsApi } from '../features/projects/api';
import { ingestionApi } from '../features/ingestion/api';
import { LocationPicker } from '../features/ingestion/components/LocationPicker';
import { ProposalBuilderForm } from '../features/proposals/components/ProposalBuilderForm';
import { ProposalsTable } from '../features/proposals/components/ProposalsTable';

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

/* ─── Manual Consumption Entry ─── */
function ManualConsumptionForm({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  // NOTE: field is named 'kwh' (lowercase) to match the backend Input interface exactly
  const [months, setMonths] = useState<{ month: number; year: number; kwh: number }[]>([]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => ingestionApi.consumption.manual(projectId, { months }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
      qc.invalidateQueries({ queryKey: ['consumption'] });
      setMonths([]);
    },
  });

  const addMonth = () =>
    setMonths((prev) => [...prev, { month: new Date().getMonth() + 1, year: new Date().getFullYear(), kwh: 0 }]);

  const updateMonth = (idx: number, field: string, value: number) =>
    setMonths((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  const removeMonth = (idx: number) => setMonths((prev) => prev.filter((_, i) => i !== idx));

  return (
    <Stack>
      <Text size="sm" fw={500}>Captura manual</Text>
      <Text size="xs" c="dimmed">Ingresa al menos 3 meses de consumo para que el motor lo anualice.</Text>

      {months.map((m, i) => (
        <Group key={i} grow>
          <NumberInput label="Mes (1-12)" min={1} max={12} value={m.month}
            onChange={(v) => updateMonth(i, 'month', Number(v) || 1)} />
          <NumberInput label="Año" min={2000} max={2100} value={m.year}
            onChange={(v) => updateMonth(i, 'year', Number(v) || new Date().getFullYear())} />
          <NumberInput label="kWh" min={0} value={m.kwh}
            onChange={(v) => updateMonth(i, 'kwh', Number(v) || 0)} />
          <ActionIcon color="red" variant="subtle" mt={24} onClick={() => removeMonth(i)}>✕</ActionIcon>
        </Group>
      ))}

      <Group>
        <Button size="xs" variant="outline" onClick={addMonth}>+ Agregar mes</Button>
        {months.length >= 3 && (
          <Button size="xs" onClick={() => submit()} loading={isPending}>Guardar consumo</Button>
        )}
      </Group>
    </Stack>
  );
}

/* ─── Consumption Data Display ─── */
function ConsumptionDataPanel({ consumptionRefId }: { consumptionRefId?: string }) {
  const { data: consumption, isLoading } = useQuery({
    queryKey: ['consumption', consumptionRefId],
    queryFn: () => ingestionApi.consumption.get(consumptionRefId!),
    enabled: !!consumptionRefId,
  });

  if (!consumptionRefId) {
    return (
      <Text size="sm" c="dimmed" mt="md">
        Aún no hay datos de consumo. Sube un recibo arriba o agrega meses manualmente.
      </Text>
    );
  }
  if (isLoading) return <Loader size="sm" mt="md" />;
  if (!consumption) return <Text size="sm" c="dimmed" mt="md">No se encontraron los datos de consumo.</Text>;

  const months: { year: number; month: number; kwh: number }[] = consumption.months ?? [];
  const totalKwh = months.reduce((sum, m) => sum + (m.kwh ?? 0), 0);

  return (
    <Paper withBorder p="md" mt="md">
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" fw={600}>Consumo extraído</Text>
          <Badge color={consumption.status === 'READY' ? 'green' : 'orange'} size="sm">
            {consumption.status === 'READY' ? 'Listo' : consumption.status === 'FAILED' ? 'Fallido' : consumption.status}
          </Badge>
        </Group>

        {months.length === 0 ? (
          <Text size="sm" c="dimmed">No se extrajeron lecturas mensuales.</Text>
        ) : (
          <>
            <Table withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Periodo</Table.Th>
                  <Table.Th>kWh</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {months.map((m, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>{String(m.month).padStart(2, '0')}/{m.year}</Table.Td>
                    <Table.Td>{m.kwh}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group>
              <Text size="sm">Total ({months.length} meses):</Text>
              <Text size="sm" fw={500}>{totalKwh.toLocaleString()} kWh</Text>
            </Group>
          </>
        )}
      </Stack>
    </Paper>
  );
}

/* ─── Surface Data Display / Edit ─── */
function SurfaceDataPanel({ projectId, surfaceRefId }: { projectId: string; surfaceRefId?: string }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState<number>(0);

  const { data: surface, isLoading } = useQuery({
    queryKey: ['surface', surfaceRefId],
    queryFn: () => ingestionApi.surface.get(surfaceRefId!),
    enabled: !!surfaceRefId,
  });

  const { mutate: overrideSurface, isPending: saving } = useMutation({
    mutationFn: () => ingestionApi.surface.override(surfaceRefId!, editValue),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['surface', surfaceRefId] });
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
      setEditing(false);
    },
  });

  if (!surfaceRefId) return <Text size="sm" c="dimmed" mt="md">Aún no hay datos de superficie. Usa el formulario de búsqueda de arriba.</Text>;
  if (isLoading) return <Loader size="sm" mt="md" />;
  if (!surface) return <Text size="sm" c="dimmed" mt="md">No se encontraron los datos de superficie.</Text>;

  return (
    <Paper withBorder p="md" mt="md">
      <Stack gap="xs">
        <Text size="sm" fw={600}>Resultados de datos de superficie</Text>

        <Group>
          <Text size="sm">Irradiación anual:</Text>
          <Text size="sm" fw={500}>{surface.annualIrradiation?.toFixed(1) ?? '—'} kWh/m²</Text>
        </Group>

        <Group>
          <Text size="sm">Área utilizable:</Text>
          {editing ? (
            <Group gap="xs">
              <NumberInput size="xs" w={120} min={0} decimalScale={1}
                value={editValue} onChange={(v) => setEditValue(Number(v))} />
              <Button size="xs" onClick={() => overrideSurface()} loading={saving}>Guardar</Button>
              <Button size="xs" variant="subtle" onClick={() => setEditing(false)}>Cancelar</Button>
            </Group>
          ) : (
            <Group gap="xs">
              <Text size="sm" fw={500}>{surface.usableSqMeters?.toFixed(1) ?? '—'} m²</Text>
              {surface.manualOverride && <Badge size="xs" color="yellow">Modificado</Badge>}
              <Button size="xs" variant="subtle" onClick={() => {
                setEditValue(surface.usableSqMeters ?? 0);
                setEditing(true);
              }}>Editar</Button>
            </Group>
          )}
        </Group>

        {surface.inputAddress && (
          <Group>
            <Text size="sm">Dirección:</Text>
            <Text size="sm" c="dimmed">{surface.inputAddress}</Text>
          </Group>
        )}
        {surface.coordinates && (
          <Group>
            <Text size="sm">Coordenadas:</Text>
            <Text size="sm" c="dimmed">{surface.coordinates.lat}, {surface.coordinates.lon}</Text>
          </Group>
        )}
      </Stack>
    </Paper>
  );
}

/* ─── Main Page ─── */
export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [proposalOpen, { open: openProposal, close: closeProposal }] = useDisclosure(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId!),
    // Ingestion (OCR + surface) finishes asynchronously and the backend then
    // attaches the data and advances the status. Poll while still in DRAFT so
    // the details fill in on their own without a manual refresh.
    refetchInterval: (query) => (query.state.data?.status === 'DRAFT' ? 4000 : false),
  });

  const surfaceForm = useForm({ initialValues: { address: '', lat: 0, lon: 0 } });

  const { mutate: uploadBill, isPending: uploading } = useMutation({
    mutationFn: (file: File) => ingestionApi.consumption.upload(projectId!, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });

  const { mutate: lookupSurface, isPending: lookingUp } = useMutation({
    mutationFn: (vals: any) => ingestionApi.surface.lookup(projectId!, {
      address: vals.address || undefined,
      coords: vals.lat && vals.lon ? { lat: vals.lat, lon: vals.lon } : undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', projectId] }),
  });

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <Stack>
      <Group>
        <Button variant="subtle" onClick={() => navigate(`/clients/${project?.clientId}`)}>← Cliente</Button>
      </Group>
      <Group justify="space-between">
        <Title order={2}>{project?.name}</Title>
        <Badge size="lg" color={STATUS_COLORS[project?.status] ?? 'gray'}>{STATUS_LABELS[project?.status] ?? project?.status}</Badge>
      </Group>
      <Text c="dimmed">
        {project?.siteAddress && typeof project.siteAddress === 'object'
          ? [project.siteAddress.street, project.siteAddress.city].filter(Boolean).join(', ')
          : project?.siteAddress}
      </Text>

      {/* Project readiness checklist — fills in as data is ingested */}
      <SimpleGrid cols={{ base: 1, sm: 3 }}>
        <Card withBorder radius="md" p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Consumo</Text>
          <Badge mt={6} color={project?.consumptionRefId ? 'green' : 'gray'}>
            {project?.consumptionRefId ? 'Capturado' : 'Pendiente'}
          </Badge>
        </Card>
        <Card withBorder radius="md" p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Superficie</Text>
          <Badge mt={6} color={project?.surfaceRefId ? 'green' : 'gray'}>
            {project?.surfaceRefId ? 'Capturado' : 'Pendiente'}
          </Badge>
        </Card>
        <Card withBorder radius="md" p="sm">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Listo para propuesta</Text>
          <Badge mt={6} color={project?.status !== 'DRAFT' ? 'green' : 'gray'}>
            {project?.status !== 'DRAFT' ? 'Sí' : 'Aún no'}
          </Badge>
        </Card>
      </SimpleGrid>

      <Tabs defaultValue="consumption">
        <Tabs.List>
          <Tabs.Tab value="consumption">Consumo</Tabs.Tab>
          <Tabs.Tab value="surface">Superficie</Tabs.Tab>
          <Tabs.Tab value="proposals">Propuestas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="consumption" pt="md">
          <Stack>
            <Text size="sm" fw={500}>Sube un recibo de luz</Text>
            <Text size="xs" c="dimmed">PDF o imagen → extracción por OCR del consumo mensual.</Text>
            <FileInput label="Recibo de luz" placeholder="Elige un PDF o imagen"
              onChange={(f) => f && uploadBill(f)} disabled={uploading} />
            {uploading && <Text size="sm" c="dimmed">Subiendo…</Text>}
            {!uploading && project?.status === 'DRAFT' && !project?.consumptionRefId && (
              <Text size="xs" c="dimmed">
                Tras subirlo, la extracción se ejecuta en segundo plano: los resultados de abajo
                se actualizan automáticamente al terminar.
              </Text>
            )}

            <ConsumptionDataPanel consumptionRefId={project?.consumptionRefId} />

            <Paper withBorder p="md" mt="md">
              <ManualConsumptionForm projectId={projectId!} />
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="surface" pt="md">
          <Stack>
            <Text size="sm" c="dimmed">
              Marca la ubicación del sitio en el mapa y luego consulta los datos de superficie del techo con la API de Google Solar.
            </Text>
            <form onSubmit={surfaceForm.onSubmit((v) => lookupSurface(v))}>
              <Stack>
                <LocationPicker
                  value={{ lat: surfaceForm.values.lat, lon: surfaceForm.values.lon, address: surfaceForm.values.address }}
                  onChange={(loc) => surfaceForm.setValues({ lat: loc.lat, lon: loc.lon, address: loc.address })}
                />
                <Button type="submit" loading={lookingUp}
                  disabled={!surfaceForm.values.lat || !surfaceForm.values.lon}>
                  Consultar superficie
                </Button>
              </Stack>
            </form>

            <SurfaceDataPanel projectId={projectId!} surfaceRefId={project?.surfaceRefId} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="proposals" pt="md">
          <Stack>
            <Group justify="space-between">
              {project?.status === 'DRAFT' ? (
                <Text size="sm" c="dimmed">
                  Primero agrega los datos de consumo y superficie para generar propuestas.
                </Text>
              ) : <span />}
              <Button onClick={openProposal} disabled={project?.status === 'DRAFT'}>
                + Generar propuesta
              </Button>
            </Group>
            <ProposalsTable projectId={projectId!} projectStatus={project?.status} />
          </Stack>
          <Modal opened={proposalOpen} onClose={closeProposal} title="Generar propuesta" size="lg">
            <ProposalBuilderForm projectId={projectId!} onSuccess={closeProposal} />
          </Modal>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

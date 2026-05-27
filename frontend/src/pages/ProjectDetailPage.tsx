import { useState } from 'react';
import {
  Stack, Title, Text, Badge, Tabs, Button, Group, Loader, Center,
  FileInput, NumberInput, TextInput, Modal, Paper, ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from '@mantine/form';
import { projectsApi } from '../features/projects/api';
import { ingestionApi } from '../features/ingestion/api';
import { ProposalBuilderForm } from '../features/proposals/components/ProposalBuilderForm';
import { ProposalsTable } from '../features/proposals/components/ProposalsTable';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'gray', CONSUMPTION: 'blue', SURFACE: 'blue',
  READY_FOR_PROPOSAL: 'yellow', PROPOSAL_SELECTED: 'orange', APPROVED: 'green',
};

/* ─── Manual Consumption Entry ─── */
function ManualConsumptionForm({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [months, setMonths] = useState<{ month: number; year: number; kWh: number }[]>([]);

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => ingestionApi.consumption.manual(projectId, { months }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
      setMonths([]);
    },
  });

  const addMonth = () =>
    setMonths((prev) => [...prev, { month: new Date().getMonth() + 1, year: new Date().getFullYear(), kWh: 0 }]);

  const updateMonth = (idx: number, field: string, value: number) =>
    setMonths((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));

  const removeMonth = (idx: number) => setMonths((prev) => prev.filter((_, i) => i !== idx));

  return (
    <Stack>
      <Text size="sm" fw={500}>Manual entry</Text>
      <Text size="xs" c="dimmed">Enter at least 3 months of consumption for the engine to annualize.</Text>

      {months.map((m, i) => (
        <Group key={i} grow>
          <NumberInput label="Month (1-12)" min={1} max={12} value={m.month}
            onChange={(v) => updateMonth(i, 'month', Number(v))} />
          <NumberInput label="Year" min={2000} max={2100} value={m.year}
            onChange={(v) => updateMonth(i, 'year', Number(v))} />
          <NumberInput label="kWh" min={0} value={m.kWh}
            onChange={(v) => updateMonth(i, 'kWh', Number(v))} />
          <ActionIcon color="red" variant="subtle" mt={24} onClick={() => removeMonth(i)}>✕</ActionIcon>
        </Group>
      ))}

      <Group>
        <Button size="xs" variant="outline" onClick={addMonth}>+ Add Month</Button>
        {months.length >= 3 && (
          <Button size="xs" onClick={() => submit()} loading={isPending}>Save Consumption</Button>
        )}
      </Group>
    </Stack>
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

  if (!surfaceRefId) return <Text size="sm" c="dimmed" mt="md">No surface data yet. Use the lookup form above.</Text>;
  if (isLoading) return <Loader size="sm" mt="md" />;
  if (!surface) return <Text size="sm" c="dimmed" mt="md">Surface data not found.</Text>;

  return (
    <Paper withBorder p="md" mt="md">
      <Stack gap="xs">
        <Text size="sm" fw={600}>Surface Data Results</Text>

        <Group>
          <Text size="sm">Annual Irradiation:</Text>
          <Text size="sm" fw={500}>{surface.annualIrradiationKwhPerSqM?.toFixed(1) ?? '—'} kWh/m²</Text>
        </Group>

        <Group>
          <Text size="sm">Usable Area:</Text>
          {editing ? (
            <Group gap="xs">
              <NumberInput size="xs" w={120} min={0} decimalScale={1}
                value={editValue} onChange={(v) => setEditValue(Number(v))} />
              <Button size="xs" onClick={() => overrideSurface()} loading={saving}>Save</Button>
              <Button size="xs" variant="subtle" onClick={() => setEditing(false)}>Cancel</Button>
            </Group>
          ) : (
            <Group gap="xs">
              <Text size="sm" fw={500}>{surface.estimatedUsableSqMeters?.toFixed(1) ?? '—'} m²</Text>
              {surface.manualOverride && <Badge size="xs" color="yellow">Overridden</Badge>}
              <Button size="xs" variant="subtle" onClick={() => {
                setEditValue(surface.estimatedUsableSqMeters ?? 0);
                setEditing(true);
              }}>Edit</Button>
            </Group>
          )}
        </Group>

        {surface.inputAddress && (
          <Group>
            <Text size="sm">Address:</Text>
            <Text size="sm" c="dimmed">{surface.inputAddress}</Text>
          </Group>
        )}
        {surface.coordinates && (
          <Group>
            <Text size="sm">Coordinates:</Text>
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
        <Button variant="subtle" onClick={() => navigate(`/clients/${project?.clientId}`)}>← Client</Button>
      </Group>
      <Group justify="space-between">
        <Title order={2}>{project?.name}</Title>
        <Badge size="lg" color={STATUS_COLORS[project?.status] ?? 'gray'}>{project?.status}</Badge>
      </Group>
      <Text c="dimmed">{project?.siteAddress}</Text>

      <Tabs defaultValue="consumption">
        <Tabs.List>
          <Tabs.Tab value="consumption">Consumption</Tabs.Tab>
          <Tabs.Tab value="surface">Surface</Tabs.Tab>
          <Tabs.Tab value="proposals">Proposals</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="consumption" pt="md">
          <Stack>
            <Text size="sm" fw={500}>Upload a utility bill</Text>
            <Text size="xs" c="dimmed">PDF or image → OCR extraction of monthly consumption.</Text>
            <FileInput label="Utility bill" placeholder="Choose PDF or image"
              onChange={(f) => f && uploadBill(f)} disabled={uploading} />
            {uploading && <Text size="sm" c="dimmed">Uploading and extracting...</Text>}

            <Paper withBorder p="md" mt="md">
              <ManualConsumptionForm projectId={projectId!} />
            </Paper>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="surface" pt="md">
          <Stack>
            <Text size="sm" c="dimmed">Look up roof surface data via Google Solar API.</Text>
            <form onSubmit={surfaceForm.onSubmit((v) => lookupSurface(v))}>
              <Stack>
                <TextInput label="Address (or use coordinates below)"
                  {...surfaceForm.getInputProps('address')} />
                <Group grow>
                  <NumberInput label="Latitude" decimalScale={6} {...surfaceForm.getInputProps('lat')} />
                  <NumberInput label="Longitude" decimalScale={6} {...surfaceForm.getInputProps('lon')} />
                </Group>
                <Button type="submit" loading={lookingUp}>Lookup Surface</Button>
              </Stack>
            </form>

            <SurfaceDataPanel projectId={projectId!} surfaceRefId={project?.surfaceRefId} />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="proposals" pt="md">
          <Stack>
            <Group justify="flex-end">
              <Button onClick={openProposal} disabled={project?.status === 'DRAFT'}>
                + Generate Proposal
              </Button>
            </Group>
            <ProposalsTable projectId={projectId!} />
          </Stack>
          <Modal opened={proposalOpen} onClose={closeProposal} title="Generate Proposal" size="lg">
            <ProposalBuilderForm projectId={projectId!} onSuccess={closeProposal} />
          </Modal>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

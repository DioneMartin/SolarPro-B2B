import { Stack, Title, Text, Badge, Tabs, Button, Group, Loader, Center, FileInput, NumberInput, TextInput, Modal } from '@mantine/core';
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

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [proposalOpen, { open: openProposal, close: closeProposal }] = useDisclosure(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectsApi.get(projectId!),
  });

  const uploadForm = useForm({ initialValues: { file: null as File | null } });
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
            <Text size="sm" c="dimmed">Upload a utility bill PDF/image to extract monthly consumption automatically.</Text>
            <FileInput label="Utility bill" placeholder="Choose PDF or image"
              onChange={(f) => f && uploadBill(f)} disabled={uploading} />
            {uploading && <Text size="sm" c="dimmed">Uploading and extracting...</Text>}
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

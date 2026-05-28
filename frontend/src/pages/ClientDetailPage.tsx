import { Stack, Title, Text, Badge, Button, Table, Modal, TextInput, Loader, Center, Group } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsApi } from '../features/clients/api';
import { projectsApi } from '../features/projects/api';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'gray', READY_FOR_PROPOSAL: 'yellow', PROPOSED: 'orange',
  APPROVED: 'green', INSTALLED: 'teal', REJECTED: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  READY_FOR_PROPOSAL: 'Listo para propuesta',
  PROPOSED: 'Propuesto',
  APPROVED: 'Aprobado',
  INSTALLED: 'Instalado',
  REJECTED: 'Rechazado',
};

export function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['clients', clientId],
    queryFn: () => clientsApi.get(clientId!),
  });
  const { data: projects } = useQuery({
    queryKey: ['projects', { clientId }],
    queryFn: () => projectsApi.list(clientId),
  });

  const form = useForm({
    initialValues: { name: '', street: '', city: '', reference: '' },
  });

  const { mutate: createProject, isPending } = useMutation({
    mutationFn: (vals: typeof form.values) => projectsApi.create({
      clientId,
      name: vals.name,
      siteAddress: { street: vals.street, city: vals.city, state: '', country: '' },
      energyDemandTargetPct: 80,
    }),
    onSuccess: (p) => { qc.invalidateQueries({ queryKey: ['projects'] }); close(); navigate(`/projects/${p.id}`); },
  });

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <Stack>
      <Group>
        <Button variant="subtle" onClick={() => navigate('/clients')}>← Clientes</Button>
      </Group>
      <Title order={2}>{client?.displayName}</Title>
      <Text c="dimmed">{client?.contactEmail} · {client?.primaryAddress?.city}</Text>

      <Group justify="space-between" mt="md">
        <Title order={4}>Proyectos</Title>
        <Button size="xs" onClick={open}>+ Nuevo proyecto</Button>
      </Group>

      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th><Table.Th>Estado</Table.Th><Table.Th>Dirección</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {projects?.map((p: any) => (
            <Table.Tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
              <Table.Td><Text fw={500}>{p.name}</Text></Table.Td>
              <Table.Td><Badge color={STATUS_COLORS[p.status] ?? 'gray'}>{STATUS_LABELS[p.status] ?? p.status}</Badge></Table.Td>
              <Table.Td>{typeof p.siteAddress === 'object' ? [p.siteAddress.street, p.siteAddress.city].filter(Boolean).join(', ') : p.siteAddress}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Nuevo proyecto">
        <form onSubmit={form.onSubmit((v) => createProject(v))}>
          <Stack>
            <TextInput label="Nombre del proyecto" required {...form.getInputProps('name')} />
            <TextInput label="Calle" placeholder="Av. Principal 123" required {...form.getInputProps('street')} />
            <TextInput label="Ciudad" placeholder="Ciudad" required {...form.getInputProps('city')} />
            <TextInput label="Referencia" placeholder="Referencia interna o notas" {...form.getInputProps('reference')} />
            <Button type="submit" loading={isPending}>Crear</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

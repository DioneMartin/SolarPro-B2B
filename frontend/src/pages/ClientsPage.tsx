import { Stack, Title, Button, Table, Text, Badge, Loader, Center, Modal, TextInput, Select } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '../features/clients/api';

export function ClientsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.list,
  });

  const form = useForm({
    initialValues: {
      displayName: '', kind: 'PERSON', contactEmail: '', contactPhone: '',
      address: { street: '', city: '', state: '', postalCode: '', country: 'MX', latitude: 0, longitude: 0 },
    },
  });

  const { mutate: createClient, isPending } = useMutation({
    mutationFn: clientsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); close(); form.reset(); },
  });

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <Stack>
      <Stack justify="space-between" style={{ flexDirection: 'row' }} align="center">
        <Title order={2}>Clients</Title>
        <Button onClick={open}>+ New Client</Button>
      </Stack>

      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th><Table.Th>Kind</Table.Th>
            <Table.Th>Email</Table.Th><Table.Th>City</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {clients?.map((c: any) => (
            <Table.Tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/clients/${c.id}`)}>
              <Table.Td><Text fw={500}>{c.displayName}</Text></Table.Td>
              <Table.Td><Badge variant="light">{c.kind}</Badge></Table.Td>
              <Table.Td>{c.contactEmail}</Table.Td>
              <Table.Td>{c.address?.city}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="New Client" size="lg">
        <form onSubmit={form.onSubmit((v) => createClient(v))}>
          <Stack>
            <TextInput label="Display name" required {...form.getInputProps('displayName')} />
            <Select label="Kind" data={['PERSON', 'COMPANY']} {...form.getInputProps('kind')} />
            <TextInput label="Contact email" {...form.getInputProps('contactEmail')} />
            <TextInput label="Contact phone" {...form.getInputProps('contactPhone')} />
            <TextInput label="Street" {...form.getInputProps('address.street')} />
            <TextInput label="City" {...form.getInputProps('address.city')} />
            <TextInput label="State" {...form.getInputProps('address.state')} />
            <TextInput label="Postal code" {...form.getInputProps('address.postalCode')} />
            <Button type="submit" loading={isPending}>Create</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

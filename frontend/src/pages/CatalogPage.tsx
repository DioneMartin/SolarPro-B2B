import {
  Stack, Title, Tabs, Table, Button, Group, Badge, Modal,
  TextInput, NumberInput, Center, Loader, Switch, Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@mantine/form';
import { catalogApi } from '../features/catalog/api';
import { RoleGate } from '../shared/ui/RoleGate';

function PanelsTab() {
  const qc = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [showAll, { toggle }] = useDisclosure(false);

  const { data: panels = [], isLoading } = useQuery({
    queryKey: ['panels', showAll],
    queryFn: () => catalogApi.panels.list(showAll),
  });

  const form = useForm({
    initialValues: { brand: '', model: '', wattPeak: 400, efficiency: 0.2, areaSqm: 1.7, priceEur: 200 },
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (v: typeof form.values) => catalogApi.panels.create(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['panels'] }); close(); form.reset(); },
  });

  const { mutate: discontinue } = useMutation({
    mutationFn: (id: string) => catalogApi.panels.discontinue(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['panels'] }),
  });

  if (isLoading) return <Center h={200}><Loader /></Center>;

  return (
    <Stack>
      <Group justify="space-between">
        <Switch label="Show discontinued" checked={showAll} onChange={toggle} />
        <RoleGate roles={['INVENTORY_MANAGER']}>
          <Button onClick={open}>+ Add Panel</Button>
        </RoleGate>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Brand</Table.Th>
            <Table.Th>Model</Table.Th>
            <Table.Th>Wp</Table.Th>
            <Table.Th>Efficiency</Table.Th>
            <Table.Th>Area (m²)</Table.Th>
            <Table.Th>Price (€)</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {panels.map((p: any) => (
            <Table.Tr key={p.id}>
              <Table.Td>{p.brand}</Table.Td>
              <Table.Td>{p.model}</Table.Td>
              <Table.Td>{p.wattPeak}</Table.Td>
              <Table.Td>{(p.efficiency * 100).toFixed(1)}%</Table.Td>
              <Table.Td>{p.areaSqm}</Table.Td>
              <Table.Td>{p.priceEur}</Table.Td>
              <Table.Td>
                <Badge color={p.discontinued ? 'gray' : 'green'} size="sm">
                  {p.discontinued ? 'Discontinued' : 'Active'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <RoleGate roles={['INVENTORY_MANAGER']}>
                  {!p.discontinued && (
                    <Button size="xs" color="red" variant="subtle" onClick={() => discontinue(p.id)}>
                      Discontinue
                    </Button>
                  )}
                </RoleGate>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Add Solar Panel">
        <form onSubmit={form.onSubmit((v) => create(v))}>
          <Stack>
            <TextInput label="Brand" required {...form.getInputProps('brand')} />
            <TextInput label="Model" required {...form.getInputProps('model')} />
            <Group grow>
              <NumberInput label="Watt-peak (Wp)" min={1} required {...form.getInputProps('wattPeak')} />
              <NumberInput label="Efficiency" min={0} max={1} step={0.01} decimalScale={3} required {...form.getInputProps('efficiency')} />
            </Group>
            <Group grow>
              <NumberInput label="Area (m²)" min={0.1} decimalScale={2} required {...form.getInputProps('areaSqm')} />
              <NumberInput label="Price (€)" min={0} required {...form.getInputProps('priceEur')} />
            </Group>
            <Button type="submit" loading={isPending}>Create</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

function InvertersTab() {
  const qc = useQueryClient();
  const [opened, { open, close }] = useDisclosure(false);
  const [showAll, { toggle }] = useDisclosure(false);

  const { data: inverters = [], isLoading } = useQuery({
    queryKey: ['inverters', showAll],
    queryFn: () => catalogApi.inverters.list(showAll),
  });

  const form = useForm({
    initialValues: { brand: '', model: '', maxOutputKw: 5, phases: 1, priceEur: 500 },
  });

  const { mutate: create, isPending } = useMutation({
    mutationFn: (v: typeof form.values) => catalogApi.inverters.create(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['inverters'] }); close(); form.reset(); },
  });

  const { mutate: discontinue } = useMutation({
    mutationFn: (id: string) => catalogApi.inverters.discontinue(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inverters'] }),
  });

  if (isLoading) return <Center h={200}><Loader /></Center>;

  return (
    <Stack>
      <Group justify="space-between">
        <Switch label="Show discontinued" checked={showAll} onChange={toggle} />
        <RoleGate roles={['INVENTORY_MANAGER']}>
          <Button onClick={open}>+ Add Inverter</Button>
        </RoleGate>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Brand</Table.Th>
            <Table.Th>Model</Table.Th>
            <Table.Th>Max Output (kW)</Table.Th>
            <Table.Th>Phases</Table.Th>
            <Table.Th>Price (€)</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {inverters.map((inv: any) => (
            <Table.Tr key={inv.id}>
              <Table.Td>{inv.brand}</Table.Td>
              <Table.Td>{inv.model}</Table.Td>
              <Table.Td>{inv.maxOutputKw}</Table.Td>
              <Table.Td>{inv.phases}</Table.Td>
              <Table.Td>{inv.priceEur}</Table.Td>
              <Table.Td>
                <Badge color={inv.discontinued ? 'gray' : 'green'} size="sm">
                  {inv.discontinued ? 'Discontinued' : 'Active'}
                </Badge>
              </Table.Td>
              <Table.Td>
                <RoleGate roles={['INVENTORY_MANAGER']}>
                  {!inv.discontinued && (
                    <Button size="xs" color="red" variant="subtle" onClick={() => discontinue(inv.id)}>
                      Discontinue
                    </Button>
                  )}
                </RoleGate>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Add Inverter">
        <form onSubmit={form.onSubmit((v) => create(v))}>
          <Stack>
            <TextInput label="Brand" required {...form.getInputProps('brand')} />
            <TextInput label="Model" required {...form.getInputProps('model')} />
            <Group grow>
              <NumberInput label="Max Output (kW)" min={0.1} decimalScale={2} required {...form.getInputProps('maxOutputKw')} />
              <NumberInput label="Phases" min={1} max={3} required {...form.getInputProps('phases')} />
            </Group>
            <NumberInput label="Price (€)" min={0} required {...form.getInputProps('priceEur')} />
            <Button type="submit" loading={isPending}>Create</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

export function CatalogPage() {
  return (
    <Stack>
      <Title order={2}>Product Catalog</Title>
      <Text c="dimmed" size="sm">Manage solar panels and inverters available for proposals.</Text>

      <Tabs defaultValue="panels">
        <Tabs.List>
          <Tabs.Tab value="panels">Solar Panels</Tabs.Tab>
          <Tabs.Tab value="inverters">Inverters</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="panels" pt="md"><PanelsTab /></Tabs.Panel>
        <Tabs.Panel value="inverters" pt="md"><InvertersTab /></Tabs.Panel>
      </Tabs>
    </Stack>
  );
}

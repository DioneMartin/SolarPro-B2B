import {
  Stack, Title, Text, Table, Badge, Button, Group, Modal,
  TextInput, PasswordInput, Select, Center, Loader, ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@mantine/form';
import { usersApi } from '../features/users/api';
import { useAuth } from '../shared/auth/AuthContext';

const ROLE_LABELS: Record<string, string> = {
  TENANT_ADMIN: 'Admin',
  SOLAR_CONSULTANT: 'Solar Consultant',
  INVENTORY_MANAGER: 'Inventory Manager',
  OPERATIONS: 'Operations',
};

const ROLE_COLORS: Record<string, string> = {
  TENANT_ADMIN: 'violet',
  SOLAR_CONSULTANT: 'blue',
  INVENTORY_MANAGER: 'teal',
  OPERATIONS: 'orange',
};

const ROLE_OPTIONS = [
  { value: 'SOLAR_CONSULTANT', label: 'Solar Consultant' },
  { value: 'INVENTORY_MANAGER', label: 'Inventory Manager' },
  { value: 'OPERATIONS', label: 'Operations' },
  { value: 'TENANT_ADMIN', label: 'Admin' },
];

export function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const [opened, { open, close }] = useDisclosure(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersApi.list,
  });

  const form = useForm({
    initialValues: { email: '', fullName: '', password: '', role: 'SOLAR_CONSULTANT' },
    validate: {
      email: (v) => /\S+@\S+\.\S+/.test(v) ? null : 'Invalid email',
      fullName: (v) => v.trim().length >= 2 ? null : 'At least 2 characters',
      password: (v) => v.length >= 12 ? null : 'At least 12 characters',
    },
  });

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (v: typeof form.values) => usersApi.create(v),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); close(); form.reset(); },
  });

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.changeRole(id, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const { mutate: disable } = useMutation({
    mutationFn: (id: string) => usersApi.disable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Team Members</Title>
          <Text c="dimmed" size="sm">Manage who has access to SolarPro and what they can do.</Text>
        </div>
        <Button onClick={open}>+ Invite User</Button>
      </Group>

      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Role</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {users.map((u: any) => (
            <Table.Tr key={u.id}>
              <Table.Td>
                {u.fullName}
                {u.id === me?.id && (
                  <Badge size="xs" ml={6} color="gray">you</Badge>
                )}
              </Table.Td>
              <Table.Td>{u.email}</Table.Td>
              <Table.Td>
                <Select
                  value={u.role}
                  data={ROLE_OPTIONS}
                  size="xs"
                  w={170}
                  disabled={u.id === me?.id}
                  onChange={(role) => role && changeRole({ id: u.id, role })}
                  styles={{ input: { color: `var(--mantine-color-${ROLE_COLORS[u.role]}-7)` } }}
                />
              </Table.Td>
              <Table.Td>
                <Badge color={u.disabled ? 'gray' : 'green'} size="sm">
                  {u.disabled ? 'Disabled' : 'Active'}
                </Badge>
              </Table.Td>
              <Table.Td>
                {u.id !== me?.id && !u.disabled && (
                  <Button
                    size="xs"
                    color="red"
                    variant="subtle"
                    onClick={() => disable(u.id)}
                  >
                    Disable
                  </Button>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal opened={opened} onClose={close} title="Invite Team Member">
        <form onSubmit={form.onSubmit((v) => create(v))}>
          <Stack>
            <TextInput
              label="Full name"
              placeholder="Jane Doe"
              required
              {...form.getInputProps('fullName')}
            />
            <TextInput
              label="Email"
              placeholder="jane@yourcompany.com"
              type="email"
              required
              {...form.getInputProps('email')}
            />
            <PasswordInput
              label="Temporary password"
              description="They can change it after first login"
              placeholder="Min 12 characters"
              required
              {...form.getInputProps('password')}
            />
            <Select
              label="Role"
              description="Controls what this user can see and do"
              data={ROLE_OPTIONS}
              required
              {...form.getInputProps('role')}
            />
            <Text size="xs" c="dimmed">
              <strong>Solar Consultant</strong> — clients, projects, proposals<br />
              <strong>Inventory Manager</strong> — product catalog<br />
              <strong>Operations</strong> — alerts and monitoring<br />
              <strong>Admin</strong> — full access
            </Text>
            <Button type="submit" loading={creating}>Create User</Button>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}

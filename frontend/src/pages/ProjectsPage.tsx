import { Stack, Title, Text, Table, Badge, Center, Loader, Group, Select } from '@mantine/core';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../features/projects/api';

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

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'READY_FOR_PROPOSAL', label: 'Listo para propuesta' },
  { value: 'PROPOSED', label: 'Propuesto' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'INSTALLED', label: 'Instalado' },
  { value: 'REJECTED', label: 'Rechazado' },
];

export function ProjectsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list(),
  });

  if (isLoading) return <Center h={300}><Loader /></Center>;

  const filtered = statusFilter
    ? projects.filter((p: any) => p.status === statusFilter)
    : projects;

  return (
    <Stack>
      <Group justify="space-between">
        <div>
          <Title order={2}>Proyectos</Title>
          <Text c="dimmed" size="sm">Todos los proyectos de tu organización.</Text>
        </div>
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v ?? '')}
          data={STATUS_FILTER_OPTIONS}
          w={220}
          size="sm"
        />
      </Group>

      {filtered.length === 0 ? (
        <Text c="dimmed" ta="center" mt="xl">
          {statusFilter ? 'No hay proyectos con ese estado.' : 'No hay proyectos todavía. Crea uno desde la página de un cliente.'}
        </Text>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Dirección del sitio</Table.Th>
              <Table.Th>Demanda objetivo</Table.Th>
              <Table.Th>Creado</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((p: any) => (
              <Table.Tr
                key={p.id}
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <Table.Td>{p.name}</Table.Td>
                <Table.Td>
                  <Badge color={STATUS_COLORS[p.status] ?? 'gray'} size="sm">
                    {STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  {p.siteAddress && typeof p.siteAddress === 'object'
                    ? [p.siteAddress.street, p.siteAddress.city].filter(Boolean).join(', ')
                    : p.siteAddress ?? '—'}
                </Table.Td>
                <Table.Td>{p.energyDemandTargetPct}%</Table.Td>
                <Table.Td>{new Date(p.createdAt).toLocaleDateString('es-MX')}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

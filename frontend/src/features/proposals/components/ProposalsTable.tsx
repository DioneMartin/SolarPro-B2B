import { Table, Badge, Button, Text, Center, Loader, Stack, Group } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { notifications } from '@mantine/notifications';
import { proposalsApi } from '../api';
import { projectsApi } from '../../projects/api';

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Borrador',
  EXPORTED: 'Exportada',
  REJECTED: 'Rechazada',
};
const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'gray',
  EXPORTED: 'blue',
  REJECTED: 'red',
};

interface Props {
  projectId: string;
  /** Pass the current project status so the table can show/hide action buttons */
  projectStatus?: string;
}

export function ProposalsTable({ projectId, projectStatus }: Props) {
  const qc = useQueryClient();
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals', projectId],
    queryFn: () => proposalsApi.listByProject(projectId),
  });

  const { isPending: exporting } = useMutation({
    mutationFn: (id: string) => proposalsApi.export(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', projectId] }),
  });

  const { mutate: deleteProposal } = useMutation({
    mutationFn: (id: string) => proposalsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals', projectId] });
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });

  const { mutate: approveProposal, isPending: approving } = useMutation({
    mutationFn: async (proposalId: string) => {
      await projectsApi.selectProposal(projectId, proposalId);
      await projectsApi.approve(projectId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals', projectId] });
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });

  const { mutate: rejectProposal, isPending: rejecting } = useMutation({
    mutationFn: (id: string) => proposalsApi.reject(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals', projectId] });
      qc.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });

  const { mutate: downloadPdf, isPending: downloading } = useMutation({
    mutationFn: async (id: string) => {
      // Always re-export to get a fresh PDF, then download
      await proposalsApi.export(id);
      qc.invalidateQueries({ queryKey: ['proposals', projectId] });
      await proposalsApi.downloadPdf(id);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? 'No se pudo descargar el PDF.';
      notifications.show({
        title: 'Error al descargar PDF',
        message: typeof msg === 'string' ? msg : JSON.stringify(msg),
        color: 'red',
      });
    },
  });

  if (isLoading) return <Center h={120}><Loader size="sm" /></Center>;
  if (!proposals.length) return <Text c="dimmed" size="sm">Aún no hay propuestas. Haz clic en "Generar propuesta" para comenzar.</Text>;

  // Find optimal run (lowest payback)
  const payback = (p: any) => p.optimal?.paybackYears ?? Infinity;
  const optimalId = proposals.reduce((best: any, p: any) =>
    !best || payback(p) < payback(best) ? p : best, null)?.id;

  const chartData = proposals.map((p: any, i: number) => ({
    name: `#${i + 1}`,
    roi: +((p.optimal?.roiPct ?? 0)).toFixed(1),
    payback: +((p.optimal?.paybackYears ?? 0)).toFixed(1),
  }));

  // Actions are hidden once the project is in a terminal state
  const terminalProject = projectStatus === 'APPROVED' || projectStatus === 'INSTALLED' || projectStatus === 'REJECTED';

  return (
    <Stack>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Panel</Table.Th>
            <Table.Th>Inversor</Table.Th>
            <Table.Th>Cantidad</Table.Th>
            <Table.Th>Sistema kWp</Table.Th>
            <Table.Th>Cobertura</Table.Th>
            <Table.Th>Costo total</Table.Th>
            <Table.Th>Retorno (años)</Table.Th>
            <Table.Th>ROI (%)</Table.Th>
            <Table.Th>VPN</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {proposals.map((p: any, i: number) => {
            const isRejected = p.status === 'REJECTED';
            return (
              <Table.Tr
                key={p.id}
                style={
                  isRejected
                    ? { opacity: 0.55 }
                    : p.id === optimalId
                    ? { background: 'var(--mantine-color-green-0)' }
                    : undefined
                }
              >
                <Table.Td>
                  <Group gap={4}>
                    {i + 1}
                    {p.id === optimalId && !isRejected && <Badge size="xs" color="green">Óptima</Badge>}
                  </Group>
                </Table.Td>
                <Table.Td>{p.optimal?.panel ?? '—'}</Table.Td>
                <Table.Td>{p.optimal?.inverter ?? '—'}</Table.Td>
                <Table.Td>{p.optimal?.panelCount ?? '—'}</Table.Td>
                <Table.Td>{(p.optimal?.systemKwp ?? 0).toFixed(2)}</Table.Td>
                <Table.Td>{(p.optimal?.coveragePct ?? 0).toFixed(0)}%</Table.Td>
                <Table.Td>{(p.optimal?.totalCost ?? 0).toLocaleString()} {p.optimal?.currency ?? ''}</Table.Td>
                <Table.Td>{p.optimal?.paybackYears != null ? p.optimal.paybackYears.toFixed(1) : '—'}</Table.Td>
                <Table.Td>{(p.optimal?.roiPct ?? 0).toFixed(1)}%</Table.Td>
                <Table.Td>{p.optimal?.npv != null ? p.optimal.npv.toLocaleString() : '—'}</Table.Td>
                <Table.Td>
                  <Badge
                    color={PROPOSAL_STATUS_COLORS[p.status] ?? 'gray'}
                    size="sm"
                  >
                    {PROPOSAL_STATUS_LABELS[p.status] ?? p.status}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap={4}>
                    {!terminalProject && !isRejected && (
                      <>
                        <Button
                          size="xs"
                          color="green"
                          variant="light"
                          loading={approving}
                          onClick={() => approveProposal(p.id)}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="xs"
                          color="orange"
                          variant="light"
                          loading={rejecting}
                          onClick={() => rejectProposal(p.id)}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                    <Button
                      size="xs" variant="light"
                      loading={downloading || exporting}
                      onClick={() => downloadPdf(p.id)}
                      disabled={isRejected}
                    >
                      PDF
                    </Button>
                    <Button
                      size="xs" variant="subtle" color="red"
                      onClick={() => deleteProposal(p.id)}
                    >
                      ✕
                    </Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>

      {proposals.length > 1 && (
        <Stack>
          <Text size="sm" fw={500}>Comparación de ROI</Text>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: any) => `${v}%`} />
              <Bar dataKey="roi" fill="var(--mantine-color-blue-5)" name="ROI" />
            </BarChart>
          </ResponsiveContainer>
        </Stack>
      )}
    </Stack>
  );
}

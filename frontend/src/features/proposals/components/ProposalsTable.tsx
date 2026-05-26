import { Table, Badge, Button, Text, Center, Loader, Stack, Group, ActionIcon } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { proposalsApi } from '../api';

interface Props {
  projectId: string;
}

export function ProposalsTable({ projectId }: Props) {
  const qc = useQueryClient();
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals', projectId],
    queryFn: () => proposalsApi.list(projectId),
  });

  const { mutate: exportPdf, isPending: exporting } = useMutation({
    mutationFn: (id: string) => proposalsApi.export(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', projectId] }),
  });

  const { mutate: deleteProposal } = useMutation({
    mutationFn: (id: string) => proposalsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', projectId] }),
  });

  if (isLoading) return <Center h={120}><Loader size="sm" /></Center>;
  if (!proposals.length) return <Text c="dimmed" size="sm">No proposals yet. Click "Generate Proposal" to start.</Text>;

  // Find optimal (lowest payback period)
  const optimalId = proposals.reduce((best: any, p: any) =>
    !best || p.paybackYears < best.paybackYears ? p : best, null)?.id;

  const chartData = proposals.map((p: any, i: number) => ({
    name: `#${i + 1}`,
    roi: +(p.roiPercent * 100).toFixed(1),
    payback: +p.paybackYears.toFixed(1),
  }));

  return (
    <Stack>
      <Table striped highlightOnHover withTableBorder withColumnBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>#</Table.Th>
            <Table.Th>Panel</Table.Th>
            <Table.Th>Inverter</Table.Th>
            <Table.Th>Count</Table.Th>
            <Table.Th>System kWp</Table.Th>
            <Table.Th>Coverage</Table.Th>
            <Table.Th>Total Cost (€)</Table.Th>
            <Table.Th>Payback (yr)</Table.Th>
            <Table.Th>ROI (%)</Table.Th>
            <Table.Th>NPV (€)</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Actions</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {proposals.map((p: any, i: number) => (
            <Table.Tr
              key={p.id}
              style={p.id === optimalId ? { background: 'var(--mantine-color-green-0)' } : undefined}
            >
              <Table.Td>
                <Group gap={4}>
                  {i + 1}
                  {p.id === optimalId && <Badge size="xs" color="green">Optimal</Badge>}
                </Group>
              </Table.Td>
              <Table.Td>{p.panelModelId}</Table.Td>
              <Table.Td>{p.inverterModelId}</Table.Td>
              <Table.Td>{p.panelCount}</Table.Td>
              <Table.Td>{(p.systemKwp ?? 0).toFixed(2)}</Table.Td>
              <Table.Td>{((p.coverageRatio ?? 0) * 100).toFixed(0)}%</Table.Td>
              <Table.Td>{(p.totalCostEur ?? 0).toLocaleString()}</Table.Td>
              <Table.Td>{(p.paybackYears ?? 0).toFixed(1)}</Table.Td>
              <Table.Td>{((p.roiPercent ?? 0) * 100).toFixed(1)}%</Table.Td>
              <Table.Td>{(p.npvEur ?? 0).toLocaleString()}</Table.Td>
              <Table.Td>
                <Badge color={p.status === 'EXPORTED' ? 'blue' : 'gray'} size="sm">
                  {p.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <Button
                    size="xs" variant="light"
                    loading={exporting}
                    onClick={() => exportPdf(p.id)}
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
          ))}
        </Table.Tbody>
      </Table>

      {proposals.length > 1 && (
        <Stack>
          <Text size="sm" fw={500}>ROI Comparison</Text>
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

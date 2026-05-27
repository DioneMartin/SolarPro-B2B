import { Stack, Title, Text, Table, Badge, Button, Group, Center, Loader, Select } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { proposalsApi } from '../features/proposals/api';

export function ProposalsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: proposals = [], isLoading } = useQuery({
    queryKey: ['proposals', 'all'],
    queryFn: () => proposalsApi.listAll(),
  });

  if (isLoading) return <Center h={300}><Loader /></Center>;

  return (
    <Stack>
      <Title order={2}>All Proposals</Title>
      <Text c="dimmed" size="sm">
        Proposals are generated per-project. Navigate to a project to generate new ones.
      </Text>

      {proposals.length === 0 ? (
        <Text c="dimmed">No proposals found. Generate proposals from the project detail page.</Text>
      ) : (
        <Table striped highlightOnHover withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Project</Table.Th>
              <Table.Th>Panel</Table.Th>
              <Table.Th>Inverter</Table.Th>
              <Table.Th>System kWp</Table.Th>
              <Table.Th>Coverage</Table.Th>
              <Table.Th>Cost (€)</Table.Th>
              <Table.Th>Payback (yr)</Table.Th>
              <Table.Th>ROI (%)</Table.Th>
              <Table.Th>Status</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {proposals.map((p: any) => (
              <Table.Tr key={p.id}>
                <Table.Td>
                  <Button variant="subtle" size="xs" onClick={() => navigate(`/projects/${p.projectId}`)}>
                    {p.projectId.slice(0, 8)}…
                  </Button>
                </Table.Td>
                <Table.Td>{p.panelModelId}</Table.Td>
                <Table.Td>{p.inverterModelId}</Table.Td>
                <Table.Td>{(p.systemKwp ?? 0).toFixed(2)}</Table.Td>
                <Table.Td>{((p.coverageRatio ?? 0) * 100).toFixed(0)}%</Table.Td>
                <Table.Td>{(p.totalCostEur ?? 0).toLocaleString()}</Table.Td>
                <Table.Td>{(p.paybackYears ?? 0).toFixed(1)}</Table.Td>
                <Table.Td>{((p.roiPercent ?? 0) * 100).toFixed(1)}%</Table.Td>
                <Table.Td>
                  <Badge color={p.status === 'EXPORTED' ? 'blue' : 'gray'} size="sm">
                    {p.status}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}

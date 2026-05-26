import { Stack, NumberInput, Select, Checkbox, Group, Button, Text, Radio } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { proposalsApi } from '../api';

interface Props {
  projectId: string;
  onSuccess: () => void;
}

const OPTIMIZE_OPTIONS = [
  { value: 'lowest-roi', label: 'Best ROI' },
  { value: 'lowest-cost', label: 'Lowest Cost' },
  { value: 'shortest-payback', label: 'Shortest Payback' },
  { value: 'highest-roi', label: 'Highest ROI' },
];

export function ProposalBuilderForm({ projectId, onSuccess }: Props) {
  const qc = useQueryClient();

  const form = useForm({
    initialValues: {
      coverageTarget: 0.9,
      horizonYears: 25,
      discountRate: 0.08,
      optimizeFor: 'lowest-roi',
      fitsSurface: true,
      meetsTarget: true,
      brands: '',
      minPrice: '',
      maxPrice: '',
    },
  });

  const { mutate: generate, isPending } = useMutation({
    mutationFn: (vals: typeof form.values) => {
      const criteria: any[] = [];

      if (vals.fitsSurface) criteria.push({ type: 'fits-surface' });
      if (vals.meetsTarget) criteria.push({ type: 'meets-target', coverageTarget: vals.coverageTarget });
      if (vals.brands.trim()) {
        vals.brands.split(',').map(b => b.trim()).filter(Boolean).forEach(brand => {
          criteria.push({ type: 'brand', brand });
        });
      }
      if (vals.minPrice || vals.maxPrice) {
        criteria.push({
          type: 'price-range',
          min: vals.minPrice ? Number(vals.minPrice) : undefined,
          max: vals.maxPrice ? Number(vals.maxPrice) : undefined,
        });
      }
      if (vals.optimizeFor) criteria.push({ type: vals.optimizeFor });

      return proposalsApi.generate(projectId, {
        coverageTarget: vals.coverageTarget,
        horizonYears: vals.horizonYears,
        discountRate: vals.discountRate,
        criteria,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals', projectId] });
      onSuccess();
    },
  });

  return (
    <form onSubmit={form.onSubmit((v) => generate(v))}>
      <Stack>
        <Text size="sm" c="dimmed">
          Configure the parameters for proposal generation. The engine will evaluate all viable
          panel/inverter combinations from the catalog and apply your filters.
        </Text>

        <Group grow>
          <NumberInput
            label="Coverage target"
            description="Fraction of annual consumption to cover"
            min={0.1} max={1} step={0.05} decimalScale={2}
            {...form.getInputProps('coverageTarget')}
          />
          <NumberInput
            label="Horizon (years)"
            description="Analysis period for ROI/NPV"
            min={5} max={40}
            {...form.getInputProps('horizonYears')}
          />
          <NumberInput
            label="Discount rate"
            description="WACC for NPV calculation"
            min={0} max={0.5} step={0.01} decimalScale={3}
            {...form.getInputProps('discountRate')}
          />
        </Group>

        <Stack gap="xs">
          <Text size="sm" fw={500}>Filters</Text>
          <Checkbox
            label="Must fit available roof surface"
            {...form.getInputProps('fitsSurface', { type: 'checkbox' })}
          />
          <Checkbox
            label="Must meet coverage target"
            {...form.getInputProps('meetsTarget', { type: 'checkbox' })}
          />
        </Stack>

        <Group grow>
          <NumberInput
            label="Min price (€)"
            placeholder="No minimum"
            min={0}
            {...form.getInputProps('minPrice')}
          />
          <NumberInput
            label="Max price (€)"
            placeholder="No maximum"
            min={0}
            {...form.getInputProps('maxPrice')}
          />
        </Group>

        <Radio.Group
          label="Optimize for"
          {...form.getInputProps('optimizeFor')}
        >
          <Group mt="xs">
            {OPTIMIZE_OPTIONS.map(o => (
              <Radio key={o.value} value={o.value} label={o.label} />
            ))}
          </Group>
        </Radio.Group>

        <Button type="submit" loading={isPending}>
          Generate Proposals
        </Button>
      </Stack>
    </form>
  );
}

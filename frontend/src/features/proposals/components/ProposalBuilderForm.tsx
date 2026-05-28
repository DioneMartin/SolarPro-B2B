import { Stack, NumberInput, Checkbox, Group, Button, Text, Radio, TextInput, Alert } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { proposalsApi } from '../api';

interface Props {
  projectId: string;
  onSuccess: () => void;
}

// Values must match the backend CriterionDto['type'] union (camelCase).
const OPTIMIZE_OPTIONS = [
  { value: 'shortestPayback', label: 'Menor tiempo de retorno' },
  { value: 'highestROI', label: 'Mayor ROI' },
  { value: 'lowestCost', label: 'Menor costo' },
  { value: 'lowestROI', label: 'Menor ROI' },
];

export function ProposalBuilderForm({ projectId, onSuccess }: Props) {
  const qc = useQueryClient();

  const form = useForm({
    initialValues: {
      energyDemandTargetPct: 90,
      horizonYears: 25,
      discountRatePct: 8,
      pricePerKwh: 2.5,
      optimizeFor: 'shortestPayback',
      fitsSurface: true,
      meetsTarget: true,
      brands: '',
      minPrice: '' as number | '',
      maxPrice: '' as number | '',
    },
  });

  const { mutate: generate, isPending, error } = useMutation<any, any, typeof form.values>({
    mutationFn: (vals: typeof form.values) => {
      const criteria: any[] = [];

      if (vals.fitsSurface) criteria.push({ type: 'fitsSurface' });
      if (vals.meetsTarget) criteria.push({ type: 'meetsTarget' });
      // priceRange requires BOTH bounds on the backend.
      if (vals.minPrice !== '' && vals.maxPrice !== '') {
        criteria.push({ type: 'priceRange', min: Number(vals.minPrice), max: Number(vals.maxPrice) });
      }
      if (vals.optimizeFor) criteria.push({ type: vals.optimizeFor });

      // Multiple brands are an OR-whitelist, not stacked AND criteria.
      const brandWhitelist = vals.brands.trim()
        ? vals.brands.split(',').map((b) => b.trim()).filter(Boolean)
        : undefined;

      return proposalsApi.generate(projectId, {
        energyDemandTargetPct: vals.energyDemandTargetPct,
        horizonYears: vals.horizonYears,
        discountRatePct: vals.discountRatePct,
        pricePerKwh: vals.pricePerKwh || undefined,
        brandWhitelist,
        criteria,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proposals', projectId] });
      onSuccess();
    },
    onError: (err: any) => {
      const raw = err?.response?.data?.message;
      const msg = Array.isArray(raw) ? raw.join('; ') : (raw ?? 'Ocurrió un error inesperado al generar la propuesta.');
      notifications.show({
        title: 'No se pudo generar la propuesta',
        message: msg,
        color: 'red',
        autoClose: 10_000,
      });
    },
  });

  const errMsg = error?.response?.data?.message;

  return (
    <form onSubmit={form.onSubmit((v) => generate(v))}>
      <Stack>
        <Text size="sm" c="dimmed">
          Configura los parámetros para generar la propuesta. El motor evaluará todas las
          combinaciones viables de panel/inversor del catálogo y aplicará tus filtros.
        </Text>

        <Group grow>
          <NumberInput
            label="Objetivo de cobertura (%)"
            description="Porcentaje del consumo anual a cubrir"
            min={10} max={200} step={5}
            {...form.getInputProps('energyDemandTargetPct')}
          />
          <NumberInput
            label="Horizonte (años)"
            description="Periodo de análisis para ROI/VPN"
            min={1} max={50}
            {...form.getInputProps('horizonYears')}
          />
          <NumberInput
            label="Tasa de descuento (%)"
            description="WACC para el cálculo del VPN"
            min={0} max={50} step={0.5} decimalScale={1}
            {...form.getInputProps('discountRatePct')}
          />
          <NumberInput
            label="Tarifa eléctrica ($/kWh)"
            description="Precio por kWh para calcular retorno"
            min={0} step={0.1} decimalScale={2}
            placeholder="ej. 2.50"
            {...form.getInputProps('pricePerKwh')}
          />
        </Group>

        <Stack gap="xs">
          <Text size="sm" fw={500}>Filtros</Text>
          <Checkbox
            label="Debe caber en la superficie de techo disponible"
            {...form.getInputProps('fitsSurface', { type: 'checkbox' })}
          />
          <Checkbox
            label="Debe cumplir el objetivo de cobertura"
            {...form.getInputProps('meetsTarget', { type: 'checkbox' })}
          />
        </Stack>

        <TextInput
          label="Marcas permitidas"
          description="Marcas de panel separadas por comas (vacío para todas)"
          placeholder="ej. Jinko, Trina, LONGi"
          {...form.getInputProps('brands')}
        />

        <Group grow>
          <NumberInput
            label="Precio mínimo"
            description="Establece mínimo y máximo para filtrar por precio"
            placeholder="Sin mínimo"
            min={0}
            {...form.getInputProps('minPrice')}
          />
          <NumberInput
            label="Precio máximo"
            placeholder="Sin máximo"
            min={0}
            {...form.getInputProps('maxPrice')}
          />
        </Group>

        <Radio.Group label="Optimizar para" {...form.getInputProps('optimizeFor')}>
          <Group mt="xs">
            {OPTIMIZE_OPTIONS.map((o) => (
              <Radio key={o.value} value={o.value} label={o.label} />
            ))}
          </Group>
        </Radio.Group>

        {errMsg && (
          <Alert color="red" title="Error al generar propuesta">
            {Array.isArray(errMsg) ? errMsg.join('; ') : errMsg}
          </Alert>
        )}

        <Button type="submit" loading={isPending}>
          Generar propuestas
        </Button>
      </Stack>
    </form>
  );
}

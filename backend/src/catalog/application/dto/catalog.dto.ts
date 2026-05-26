import type { InverterSpec, PanelSpec } from '../../../shared/types/panel-spec';

export interface MoneyInput {
  amount: number;
  currency: string;
}

export interface RegisterPanelInput {
  tenantId: string;
  brand: string;
  modelName: string;
  specs: Record<string, unknown>;
  mapping?: Record<string, string>;
  unitCost: MoneyInput;
}

export interface UpdatePanelInput {
  id: string;
  tenantId: string;
  brand?: string;
  modelName?: string;
  specs?: Record<string, unknown>;
  mapping?: Record<string, string>;
  unitCost?: MoneyInput;
}

export interface PanelOutput {
  id: string;
  tenantId: string;
  brand: string;
  modelName: string;
  rawSpecs: Record<string, unknown>;
  normalizedSpecs: PanelSpec;
  unitCost: MoneyInput;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInverterInput {
  tenantId: string;
  brand: string;
  modelName: string;
  specs: Record<string, unknown>;
  mapping?: Record<string, string>;
  unitCost: MoneyInput;
}

export interface UpdateInverterInput {
  id: string;
  tenantId: string;
  brand?: string;
  modelName?: string;
  specs?: Record<string, unknown>;
  mapping?: Record<string, string>;
  unitCost?: MoneyInput;
}

export interface InverterOutput {
  id: string;
  tenantId: string;
  brand: string;
  modelName: string;
  rawSpecs: Record<string, unknown>;
  normalizedSpecs: InverterSpec;
  unitCost: MoneyInput;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AliasOutput {
  tenantId: string;
  panels: Record<string, string>;
  inverters: Record<string, string>;
}

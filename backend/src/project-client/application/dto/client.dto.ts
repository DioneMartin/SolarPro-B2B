import { AddressProps } from '../../domain/value-objects/address.vo';
import { ClientKind } from '../../domain/value-objects/client-kind.enum';

export interface CreateClientInput {
  tenantId: string;
  kind: ClientKind;
  displayName: string;
  primaryAddress: AddressProps;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
}

export interface UpdateClientInput {
  tenantId: string;
  clientId: string;
  displayName?: string;
  primaryAddress?: AddressProps;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
}

export interface ClientOutput {
  id: string;
  tenantId: string;
  kind: string;
  displayName: string;
  primaryAddress: AddressProps;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

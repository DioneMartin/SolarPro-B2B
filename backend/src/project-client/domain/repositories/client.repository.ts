import { Client } from '../entities/client.entity';

export interface ClientRepository {
  findById(id: string, tenantId: string): Promise<Client | null>;
  findAllByTenant(tenantId: string): Promise<Client[]>;
  save(client: Client): Promise<void>;
}

export const CLIENT_REPOSITORY = 'CLIENT_REPOSITORY';

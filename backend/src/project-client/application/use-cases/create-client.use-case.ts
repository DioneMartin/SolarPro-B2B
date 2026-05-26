import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Client } from '../../domain/entities/client.entity';
import { CLIENT_REPOSITORY } from '../../domain/repositories/client.repository';
import type { ClientRepository } from '../../domain/repositories/client.repository';
import type { ClientOutput, CreateClientInput } from '../dto/client.dto';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly repo: ClientRepository,
  ) {}

  async execute(input: CreateClientInput): Promise<ClientOutput> {
    const client = Client.create({ id: uuidv4(), ...input });
    await this.repo.save(client);
    return toOutput(client);
  }
}

export function toOutput(c: Client): ClientOutput {
  return {
    id: c.id, tenantId: c.tenantId, kind: c.kind,
    displayName: c.displayName, primaryAddress: c.primaryAddress.toPlain(),
    contactEmail: c.contactEmail, contactPhone: c.contactPhone,
    notes: c.notes, createdAt: c.createdAt, updatedAt: c.updatedAt,
  };
}

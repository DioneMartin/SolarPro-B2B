import { Inject, Injectable } from '@nestjs/common';
import { CLIENT_REPOSITORY } from '../../domain/repositories/client.repository';
import type { ClientRepository } from '../../domain/repositories/client.repository';
import type { ClientOutput } from '../dto/client.dto';
import { toOutput } from './create-client.use-case';

@Injectable()
export class ListClientsUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly repo: ClientRepository,
  ) {}

  async execute(tenantId: string): Promise<ClientOutput[]> {
    const clients = await this.repo.findAllByTenant(tenantId);
    return clients.map(toOutput);
  }
}

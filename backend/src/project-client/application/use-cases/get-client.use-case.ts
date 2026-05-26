import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors';
import { CLIENT_REPOSITORY } from '../../domain/repositories/client.repository';
import type { ClientRepository } from '../../domain/repositories/client.repository';
import type { ClientOutput } from '../dto/client.dto';
import { toOutput } from './create-client.use-case';

@Injectable()
export class GetClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly repo: ClientRepository,
  ) {}

  async execute(clientId: string, tenantId: string): Promise<ClientOutput> {
    const client = await this.repo.findById(clientId, tenantId);
    if (!client) throw new NotFoundError('Client', clientId);
    return toOutput(client);
  }
}

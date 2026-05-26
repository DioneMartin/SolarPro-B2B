import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '../../../shared/errors';
import { CLIENT_REPOSITORY } from '../../domain/repositories/client.repository';
import type { ClientRepository } from '../../domain/repositories/client.repository';
import type { ClientOutput, UpdateClientInput } from '../dto/client.dto';
import { toOutput } from './create-client.use-case';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENT_REPOSITORY) private readonly repo: ClientRepository,
  ) {}

  async execute(input: UpdateClientInput): Promise<ClientOutput> {
    const client = await this.repo.findById(input.clientId, input.tenantId);
    if (!client) throw new NotFoundError('Client', input.clientId);

    client.update({
      displayName: input.displayName,
      primaryAddress: input.primaryAddress,
      contactEmail: input.contactEmail,
      contactPhone: input.contactPhone,
      notes: input.notes,
    });

    await this.repo.save(client);
    return toOutput(client);
  }
}

import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { CreateClientUseCase } from '../../application/use-cases/create-client.use-case';
import { GetClientUseCase } from '../../application/use-cases/get-client.use-case';
import { ListClientsUseCase } from '../../application/use-cases/list-clients.use-case';
import { UpdateClientUseCase } from '../../application/use-cases/update-client.use-case';
import { CreateClientRequestDto } from './dto/create-client.request.dto';
import { UpdateClientRequestDto } from './dto/update-client.request.dto';

@Controller('clients')
@Roles(Role.SOLAR_CONSULTANT)
export class ClientsController {
  constructor(
    private readonly createClient: CreateClientUseCase,
    private readonly listClients: ListClientsUseCase,
    private readonly getClient: GetClientUseCase,
    private readonly updateClient: UpdateClientUseCase,
  ) {}

  @Post()
  async create(@Body() dto: CreateClientRequestDto, @CurrentUser() user: JwtPayload) {
    return this.createClient.execute({
      tenantId: user.tenantId,
      kind: dto.kind,
      displayName: dto.displayName,
      primaryAddress: dto.primaryAddress,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      notes: dto.notes,
    });
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    return this.listClients.execute(user.tenantId);
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.getClient.execute(id, user.tenantId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateClientRequestDto, @CurrentUser() user: JwtPayload) {
    return this.updateClient.execute({
      clientId: id,
      tenantId: user.tenantId,
      displayName: dto.displayName,
      primaryAddress: dto.primaryAddress,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      notes: dto.notes,
    });
  }
}

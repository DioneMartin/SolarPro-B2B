import { Body, Controller, Get, Put } from '@nestjs/common';
import { IsObject, IsOptional } from 'class-validator';
import { CurrentUser } from '../../../shared/auth/current-user.decorator';
import type { JwtPayload } from '../../../shared/auth/jwt-payload';
import { Roles } from '../../../shared/auth/roles.decorator';
import { Role } from '../../../shared/auth/role.enum';
import { GetFieldAliasUseCase } from '../../application/use-cases/get-field-alias.use-case';
import { UpsertFieldAliasUseCase } from '../../application/use-cases/upsert-field-alias.use-case';

class UpsertAliasDto {
  @IsOptional()
  @IsObject()
  panels?: Record<string, string>;

  @IsOptional()
  @IsObject()
  inverters?: Record<string, string>;
}

@Controller('catalog/aliases')
export class AliasesController {
  constructor(
    private readonly getAlias: GetFieldAliasUseCase,
    private readonly upsertAlias: UpsertFieldAliasUseCase,
  ) {}

  @Get()
  async get(@CurrentUser() user: JwtPayload) {
    return this.getAlias.execute(user.tenantId);
  }

  @Put()
  @Roles(Role.INVENTORY_MANAGER)
  async upsert(@Body() dto: UpsertAliasDto, @CurrentUser() user: JwtPayload) {
    return this.upsertAlias.execute(user.tenantId, dto.panels ?? {}, dto.inverters ?? {});
  }
}

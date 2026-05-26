import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CATALOG_QUERY_PORT } from '../../shared/types/catalog-query.port';
import { DiscontinueInverterUseCase } from '../application/use-cases/discontinue-inverter.use-case';
import { DiscontinuePanelUseCase } from '../application/use-cases/discontinue-panel.use-case';
import { GetFieldAliasUseCase } from '../application/use-cases/get-field-alias.use-case';
import { GetInverterUseCase } from '../application/use-cases/get-inverter.use-case';
import { GetPanelUseCase } from '../application/use-cases/get-panel.use-case';
import { ListInvertersUseCase } from '../application/use-cases/list-inverters.use-case';
import { ListPanelsUseCase } from '../application/use-cases/list-panels.use-case';
import { RegisterInverterUseCase } from '../application/use-cases/register-inverter.use-case';
import { RegisterPanelUseCase } from '../application/use-cases/register-panel.use-case';
import { UpdateInverterUseCase } from '../application/use-cases/update-inverter.use-case';
import { UpdatePanelUseCase } from '../application/use-cases/update-panel.use-case';
import { UpsertFieldAliasUseCase } from '../application/use-cases/upsert-field-alias.use-case';
import { SpecNormalizer } from '../domain/services/spec-normalizer';
import { CATALOG_ALIAS_REPOSITORY } from '../domain/repositories/catalog-alias.repository';
import { INVERTER_MODEL_REPOSITORY } from '../domain/repositories/inverter-model.repository';
import { PANEL_MODEL_REPOSITORY } from '../domain/repositories/panel-model.repository';
import { CatalogQueryAdapter } from './adapters/catalog-query.adapter';
import { AliasesController } from './http/aliases.controller';
import { InvertersController } from './http/inverters.controller';
import { PanelsController } from './http/panels.controller';
import { CatalogAliasOrmEntity } from './persistence/catalog-alias.orm-entity';
import { InverterModelOrmEntity } from './persistence/inverter-model.orm-entity';
import { PanelModelOrmEntity } from './persistence/panel-model.orm-entity';
import { TypeOrmCatalogAliasRepository } from './persistence/typeorm-catalog-alias.repository';
import { TypeOrmInverterModelRepository } from './persistence/typeorm-inverter-model.repository';
import { TypeOrmPanelModelRepository } from './persistence/typeorm-panel-model.repository';

@Module({
  imports: [TypeOrmModule.forFeature([PanelModelOrmEntity, InverterModelOrmEntity, CatalogAliasOrmEntity])],
  controllers: [PanelsController, InvertersController, AliasesController],
  providers: [
    // Domain service
    SpecNormalizer,
    // Use cases — panels
    RegisterPanelUseCase,
    UpdatePanelUseCase,
    DiscontinuePanelUseCase,
    ListPanelsUseCase,
    GetPanelUseCase,
    // Use cases — inverters
    RegisterInverterUseCase,
    UpdateInverterUseCase,
    DiscontinueInverterUseCase,
    ListInvertersUseCase,
    GetInverterUseCase,
    // Use cases — aliases
    UpsertFieldAliasUseCase,
    GetFieldAliasUseCase,
    // Repository bindings
    { provide: PANEL_MODEL_REPOSITORY, useClass: TypeOrmPanelModelRepository },
    { provide: INVERTER_MODEL_REPOSITORY, useClass: TypeOrmInverterModelRepository },
    { provide: CATALOG_ALIAS_REPOSITORY, useClass: TypeOrmCatalogAliasRepository },
    // Cross-module port
    CatalogQueryAdapter,
    { provide: CATALOG_QUERY_PORT, useExisting: CatalogQueryAdapter },
  ],
  exports: [CATALOG_QUERY_PORT],
})
export class CatalogModule {}

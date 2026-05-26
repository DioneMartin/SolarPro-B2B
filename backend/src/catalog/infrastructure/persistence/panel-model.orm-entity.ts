import { Column, Entity, Index, Unique } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../shared/database/base.orm-entity';

@Entity('panel_model')
@Unique(['tenantId', 'brand', 'modelName'])
@Index(['tenantId', 'status'])
export class PanelModelOrmEntity extends TenantScopedOrmEntity {
  @Column()
  brand!: string;

  @Column({ name: 'model_name' })
  modelName!: string;

  @Column({ name: 'raw_specs', type: 'jsonb' })
  rawSpecs!: Record<string, unknown>;

  @Column({ name: 'normalized_specs', type: 'jsonb' })
  normalizedSpecs!: Record<string, unknown>;

  @Column({ name: 'unit_cost', type: 'jsonb' })
  unitCost!: { amount: number; currency: string };

  @Column({ default: 'active' })
  status!: string;
}

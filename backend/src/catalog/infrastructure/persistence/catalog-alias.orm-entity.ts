import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('catalog_alias')
export class CatalogAliasOrmEntity {
  @PrimaryColumn({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ type: 'jsonb', default: '{}' })
  panels!: Record<string, string>;

  @Column({ type: 'jsonb', default: '{}' })
  inverters!: Record<string, string>;
}

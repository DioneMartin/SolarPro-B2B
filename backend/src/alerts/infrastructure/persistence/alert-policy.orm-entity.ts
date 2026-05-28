import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('alert_policy')
@Index(['tenantId', 'enabled'])
export class AlertPolicyOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ name: 'strategy_kind', type: 'text' })
  strategyKind!: string;

  @Column({ type: 'jsonb' })
  config!: object;

  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ name: 'muted_by_users', type: 'jsonb', default: '[]' })
  mutedByUsers!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}

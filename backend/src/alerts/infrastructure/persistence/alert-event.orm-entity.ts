import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';
import { AlertPolicyOrmEntity } from './alert-policy.orm-entity';

@Entity('alert_event')
@Index(['tenantId'], { where: '"acknowledged_at" IS NULL' })
export class AlertEventOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'policy_id', type: 'uuid', nullable: true })
  policyId!: string | null;

  @Column({ name: 'project_id', type: 'uuid', nullable: true })
  projectId!: string | null;

  @Column({ type: 'text' })
  severity!: string;

  @Column({ type: 'text' })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'jsonb' })
  payload!: object;

  @Column({ name: 'triggered_at', type: 'timestamptz' })
  triggeredAt!: Date;

  @Column({ name: 'acknowledged_at', type: 'timestamptz', nullable: true })
  acknowledgedAt!: Date | null;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy!: string | null;

  @ManyToOne(() => AlertPolicyOrmEntity, { onDelete: 'CASCADE', nullable: true })
  policy!: AlertPolicyOrmEntity | null;
}

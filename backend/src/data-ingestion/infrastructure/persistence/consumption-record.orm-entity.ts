import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('consumption_record')
export class ConsumptionRecordOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tenant_id' })
  tenantId: string;

  @Column('uuid', { name: 'project_id' })
  projectId: string;

  @Column('text')
  source: string;

  @Column('text')
  status: string;

  @Column('text', { name: 'raw_file_ref', nullable: true })
  rawFileRef: string | null;

  @Column('jsonb', { nullable: true })
  tariff: any | null;

  @Column('jsonb')
  months: any;

  @Column('text', { nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

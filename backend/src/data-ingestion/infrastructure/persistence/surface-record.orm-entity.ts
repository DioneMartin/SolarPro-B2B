import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('surface_record')
export class SurfaceRecordOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid', { name: 'tenant_id' })
  tenantId: string;

  @Column('uuid', { name: 'project_id' })
  projectId: string;

  @Column('text', { name: 'input_address', nullable: true })
  inputAddress: string | null;

  @Column('jsonb')
  coordinates: any;

  @Column('jsonb', { name: 'raw_api_response' })
  rawApiResponse: any;

  @Column('numeric', { name: 'estimated_usable_sqm', transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  estimatedUsableSqMeters: number;

  @Column('numeric', { name: 'annual_irradiation_kwh_sqm', transformer: { to: (v) => v, from: (v) => parseFloat(v) } })
  annualIrradiationKwhPerSqM: number;

  @Column('boolean', { name: 'manual_override', default: false })
  manualOverride: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

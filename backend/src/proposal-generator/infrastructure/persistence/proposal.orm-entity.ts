import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('proposal')
@Index(['projectId'])
@Index(['tenantId'])
export class ProposalOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId!: string;

  @Column({ type: 'jsonb' })
  query!: object;

  @Column({ name: 'raw_candidates', type: 'jsonb' })
  rawCandidates!: object[];

  @Column({ type: 'jsonb', nullable: true })
  optimal!: object | null;

  @Column({ type: 'text' })
  status!: string;

  @Column({ name: 'exported_pdf_ref', type: 'text', nullable: true })
  exportedPdfRef!: string | null;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}

import { Column, Entity, Index } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../shared/database/base.orm-entity';

@Entity('projects')
@Index(['tenantId', 'clientId'])
@Index(['tenantId', 'status'])
export class ProjectOrmEntity extends TenantScopedOrmEntity {
  @Index()
  @Column({ name: 'client_id', type: 'uuid' })
  clientId!: string;

  @Column()
  name!: string;

  @Column()
  status!: string;

  @Column({ name: 'energy_demand_target_pct', type: 'int' })
  energyDemandTargetPct!: number;

  @Column({ name: 'consumption_ref_id', nullable: true, type: 'uuid' })
  consumptionRefId!: string | null;

  @Column({ name: 'surface_ref_id', nullable: true, type: 'uuid' })
  surfaceRefId!: string | null;

  @Column({ name: 'selected_proposal_id', nullable: true, type: 'uuid' })
  selectedProposalId!: string | null;

  @Column({ name: 'site_address_street' })
  siteAddressStreet!: string;

  @Column({ name: 'site_address_city' })
  siteAddressCity!: string;

  @Column({ name: 'site_address_state' })
  siteAddressState!: string;

  @Column({ name: 'site_address_country' })
  siteAddressCountry!: string;

  @Column({ name: 'site_address_zip_code', nullable: true, type: 'varchar' })
  siteAddressZipCode!: string | null;

  @Column({ name: 'site_address_lat', nullable: true, type: 'float' })
  siteAddressLat!: number | null;

  @Column({ name: 'site_address_lon', nullable: true, type: 'float' })
  siteAddressLon!: number | null;
}

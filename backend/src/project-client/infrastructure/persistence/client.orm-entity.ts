import { Column, Entity, Index } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../shared/database/base.orm-entity';

@Entity('clients')
@Index(['tenantId', 'contactEmail'])
export class ClientOrmEntity extends TenantScopedOrmEntity {
  @Column()
  kind!: string;

  @Column({ name: 'display_name' })
  displayName!: string;

  @Column({ name: 'contact_email' })
  contactEmail!: string;

  @Column({ name: 'contact_phone', nullable: true, type: 'varchar' })
  contactPhone!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  notes!: string | null;

  @Column({ name: 'address_street' })
  addressStreet!: string;

  @Column({ name: 'address_city' })
  addressCity!: string;

  @Column({ name: 'address_state' })
  addressState!: string;

  @Column({ name: 'address_country' })
  addressCountry!: string;

  @Column({ name: 'address_zip_code', nullable: true, type: 'varchar' })
  addressZipCode!: string | null;

  @Column({ name: 'address_lat', nullable: true, type: 'float' })
  addressLat!: number | null;

  @Column({ name: 'address_lon', nullable: true, type: 'float' })
  addressLon!: number | null;
}

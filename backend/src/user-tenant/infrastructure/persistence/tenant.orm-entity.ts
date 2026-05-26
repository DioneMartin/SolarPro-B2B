import { Column, Entity, PrimaryColumn } from 'typeorm';
import { GlobalOrmEntity } from '../../../shared/database';

@Entity('tenant')
export class TenantOrmEntity extends GlobalOrmEntity {
  @Column({ name: 'name', type: 'text' })
  name!: string;

  @Column({ name: 'slug', type: 'text', unique: true })
  slug!: string;

  @Column({ name: 'status', type: 'text' })
  status!: string;
}

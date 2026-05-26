import { Column, Entity, Index } from 'typeorm';
import { TenantScopedOrmEntity } from '../../../shared/database';

@Entity('app_user')
@Index(['tenantId', 'email'], { unique: true })
export class UserOrmEntity extends TenantScopedOrmEntity {
  @Column({ name: 'email', type: 'text' })
  email!: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash!: string;

  @Column({ name: 'full_name', type: 'text' })
  fullName!: string;

  @Column({ name: 'role', type: 'text' })
  role!: string;

  @Column({ name: 'status', type: 'text' })
  status!: string;
}

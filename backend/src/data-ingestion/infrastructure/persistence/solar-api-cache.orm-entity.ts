import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('solar_api_cache')
export class SolarApiCacheOrmEntity {
  @PrimaryColumn('text', { name: 'address_hash' })
  addressHash: string;

  @Column('jsonb')
  response: any;

  @Column('timestamptz', { name: 'fetched_at' })
  fetchedAt: Date;
}

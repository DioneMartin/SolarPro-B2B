import { Client } from '../../domain/entities/client.entity';
import { ClientKind } from '../../domain/value-objects/client-kind.enum';
import { ClientOrmEntity } from './client.orm-entity';

export class ClientMapper {
  static toDomain(orm: ClientOrmEntity): Client {
    return Client.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      kind: orm.kind as ClientKind,
      displayName: orm.displayName,
      contactEmail: orm.contactEmail,
      contactPhone: orm.contactPhone ?? undefined,
      notes: orm.notes ?? undefined,
      primaryAddress: {
        street: orm.addressStreet,
        city: orm.addressCity,
        state: orm.addressState,
        country: orm.addressCountry,
        zipCode: orm.addressZipCode ?? undefined,
        lat: orm.addressLat ?? undefined,
        lon: orm.addressLon ?? undefined,
      },
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(client: Client): ClientOrmEntity {
    const orm = new ClientOrmEntity();
    orm.id = client.id;
    orm.tenantId = client.tenantId;
    orm.kind = client.kind;
    orm.displayName = client.displayName;
    orm.contactEmail = client.contactEmail;
    orm.contactPhone = client.contactPhone ?? null;
    orm.notes = client.notes ?? null;
    const addr = client.primaryAddress;
    orm.addressStreet = addr.street;
    orm.addressCity = addr.city;
    orm.addressState = addr.state;
    orm.addressCountry = addr.country;
    orm.addressZipCode = addr.zipCode ?? null;
    orm.addressLat = addr.lat ?? null;
    orm.addressLon = addr.lon ?? null;
    return orm;
  }
}

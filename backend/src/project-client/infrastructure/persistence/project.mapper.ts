import { Project } from '../../domain/entities/project.entity';
import { ProjectStatus } from '../../domain/value-objects/project-status.enum';
import { ProjectOrmEntity } from './project.orm-entity';

export class ProjectMapper {
  static toDomain(orm: ProjectOrmEntity): Project {
    return Project.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      clientId: orm.clientId,
      name: orm.name,
      status: orm.status as ProjectStatus,
      energyDemandTargetPct: orm.energyDemandTargetPct,
      consumptionRefId: orm.consumptionRefId ?? undefined,
      surfaceRefId: orm.surfaceRefId ?? undefined,
      selectedProposalId: orm.selectedProposalId ?? undefined,
      siteAddress: {
        street: orm.siteAddressStreet,
        city: orm.siteAddressCity,
        state: orm.siteAddressState,
        country: orm.siteAddressCountry,
        zipCode: orm.siteAddressZipCode ?? undefined,
        lat: orm.siteAddressLat ?? undefined,
        lon: orm.siteAddressLon ?? undefined,
      },
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(project: Project): ProjectOrmEntity {
    const orm = new ProjectOrmEntity();
    orm.id = project.id;
    orm.tenantId = project.tenantId;
    orm.clientId = project.clientId;
    orm.name = project.name;
    orm.status = project.status;
    orm.energyDemandTargetPct = project.energyDemandTargetPct;
    orm.consumptionRefId = project.consumptionRefId ?? null;
    orm.surfaceRefId = project.surfaceRefId ?? null;
    orm.selectedProposalId = project.selectedProposalId ?? null;
    const addr = project.siteAddress;
    orm.siteAddressStreet = addr.street;
    orm.siteAddressCity = addr.city;
    orm.siteAddressState = addr.state;
    orm.siteAddressCountry = addr.country;
    orm.siteAddressZipCode = addr.zipCode ?? null;
    orm.siteAddressLat = addr.lat ?? null;
    orm.siteAddressLon = addr.lon ?? null;
    return orm;
  }
}

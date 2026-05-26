import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProposalOrmEntity } from './proposal.orm-entity';
import { Proposal, ProposalStatus } from '../../domain/entities/proposal.entity';
import type { ProposalRepository } from '../../domain/repositories/proposal.repository';
import type { RawProposal } from '../../../shared/types/calculation.types';
import type { ProposalQuery } from '../../domain/value-objects/proposal-query.vo';

@Injectable()
export class TypeOrmProposalRepository implements ProposalRepository {
  constructor(
    @InjectRepository(ProposalOrmEntity)
    private readonly ormRepo: Repository<ProposalOrmEntity>,
  ) {}

  private toDomain(orm: ProposalOrmEntity): Proposal {
    return Proposal.rehydrate({
      id: orm.id,
      tenantId: orm.tenantId,
      projectId: orm.projectId,
      query: orm.query as unknown as ProposalQuery,
      rawCandidates: orm.rawCandidates as unknown as RawProposal[],
      optimal: orm.optimal as unknown as RawProposal | null,
      status: orm.status as ProposalStatus,
      exportedPdfRef: orm.exportedPdfRef ?? undefined,
      createdBy: orm.createdBy,
      createdAt: orm.createdAt,
    });
  }

  private toOrm(domain: Proposal): ProposalOrmEntity {
    const orm = new ProposalOrmEntity();
    orm.id = domain.id;
    orm.tenantId = domain.tenantId;
    orm.projectId = domain.projectId;
    orm.query = domain.query as unknown as object;
    orm.rawCandidates = domain.rawCandidates as unknown as object[];
    orm.optimal = domain.optimal as unknown as object | null;
    orm.status = domain.status;
    orm.exportedPdfRef = domain.exportedPdfRef ?? null;
    orm.createdBy = domain.createdBy;
    orm.createdAt = domain.createdAt;
    return orm;
  }

  async save(proposal: Proposal): Promise<void> {
    await this.ormRepo.save(this.toOrm(proposal));
  }

  async findById(id: string, tenantId: string): Promise<Proposal | null> {
    const orm = await this.ormRepo.findOne({ where: { id, tenantId } });
    return orm ? this.toDomain(orm) : null;
  }

  async findByProjectId(projectId: string, tenantId: string): Promise<Proposal[]> {
    const orms = await this.ormRepo.find({
      where: { projectId, tenantId },
      order: { createdAt: 'DESC' },
    });
    return orms.map(o => this.toDomain(o));
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.ormRepo.delete({ id, tenantId });
  }
}

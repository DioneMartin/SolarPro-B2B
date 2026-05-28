import { Injectable } from '@nestjs/common';
import { ProposalQueryBuilder } from '../../domain/builders/proposal-query.builder';
import type { ProposalQuery } from '../../domain/value-objects/proposal-query.vo';
import { AndCriterion } from '../../domain/criteria/and.criterion';
import { OrCriterion } from '../../domain/criteria/or.criterion';
import { CriteriaFitsSurface } from '../../domain/criteria/fits-surface.criterion';
import { CriteriaMeetsTarget } from '../../domain/criteria/meets-target.criterion';
import { CriteriaBrand } from '../../domain/criteria/brand.criterion';
import { CriteriaPriceRange } from '../../domain/criteria/price-range.criterion';
import { CriteriaLowestROI } from '../../domain/criteria/lowest-roi.criterion';
import { CriteriaHighestROI } from '../../domain/criteria/highest-roi.criterion';
import { CriteriaLowestCost } from '../../domain/criteria/lowest-cost.criterion';
import { CriteriaHighestCost } from '../../domain/criteria/highest-cost.criterion';
import { CriteriaShortestPayback } from '../../domain/criteria/shortest-payback.criterion';
import { InvalidQueryError } from '../../domain/errors/invalid-query.error';
import type { Criterion } from '../../domain/criteria/criterion';

export interface CriterionDto {
  type:
    | 'fitsSurface'
    | 'meetsTarget'
    | 'brand'
    | 'priceRange'
    | 'lowestROI'
    | 'highestROI'
    | 'lowestCost'
    | 'highestCost'
    | 'shortestPayback'
    | 'and'
    | 'or';
  brand?: string;
  min?: number;
  max?: number;
  children?: CriterionDto[];
}

export interface GenerateProposalInput {
  projectId: string;
  energyDemandTargetPct?: number;
  horizonYears?: number;
  energyInflationPctPerYear?: number;
  systemLossFactor?: number;
  discountRatePct?: number;
  brandWhitelist?: string[];
  criteria?: CriterionDto[];
  pricePerKwh?: number;
}

@Injectable()
export class ProposalQueryFactory {
  fromInput(input: GenerateProposalInput): ProposalQuery {
    const builder = ProposalQueryBuilder.forProject(input.projectId);

    if (input.energyDemandTargetPct !== undefined) builder.coverDemand(input.energyDemandTargetPct);
    if (input.horizonYears !== undefined) builder.overHorizon(input.horizonYears);
    if (input.energyInflationPctPerYear !== undefined) builder.withInflation(input.energyInflationPctPerYear);
    if (input.systemLossFactor !== undefined) builder.withSystemLoss(input.systemLossFactor);
    if (input.discountRatePct !== undefined) builder.withDiscountRate(input.discountRatePct);
    if (input.brandWhitelist?.length) builder.restrictToBrands(input.brandWhitelist);

    for (const dto of input.criteria ?? []) {
      builder.filterBy(this.buildCriterion(dto));
    }

    return builder.build();
  }

  private buildCriterion(dto: CriterionDto): Criterion {
    switch (dto.type) {
      case 'fitsSurface':    return new CriteriaFitsSurface();
      case 'meetsTarget':    return new CriteriaMeetsTarget();
      case 'brand':
        if (!dto.brand) throw new InvalidQueryError('brand criterion requires a brand value');
        return new CriteriaBrand(dto.brand);
      case 'priceRange':
        if (dto.min === undefined || dto.max === undefined)
          throw new InvalidQueryError('priceRange criterion requires min and max');
        return new CriteriaPriceRange(dto.min, dto.max);
      case 'lowestROI':      return new CriteriaLowestROI();
      case 'highestROI':     return new CriteriaHighestROI();
      case 'lowestCost':     return new CriteriaLowestCost();
      case 'highestCost':    return new CriteriaHighestCost();
      case 'shortestPayback': return new CriteriaShortestPayback();
      case 'and':
        return new AndCriterion((dto.children ?? []).map(c => this.buildCriterion(c)));
      case 'or':
        return new OrCriterion((dto.children ?? []).map(c => this.buildCriterion(c)));
      default:
        throw new InvalidQueryError(`Unknown criterion type: ${(dto as any).type}`);
    }
  }
}

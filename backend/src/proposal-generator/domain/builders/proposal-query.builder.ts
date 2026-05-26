import type { Criterion } from '../criteria/criterion';
import type { ProposalQuery } from '../value-objects/proposal-query.vo';
import { InvalidQueryError } from '../errors/invalid-query.error';

export class ProposalQueryBuilder {
  private _projectId!: string;
  private _energyTargetPct = 100;
  private _horizonYears = 20;
  private _inflationPct = 4;
  private _systemLossFactor = 0.85;
  private _discountRatePct?: number;
  private _brandWhitelist?: string[];
  private _criteria: Criterion[] = [];

  static forProject(projectId: string): ProposalQueryBuilder {
    if (!projectId) throw new InvalidQueryError('projectId is required');
    const b = new ProposalQueryBuilder();
    b._projectId = projectId;
    return b;
  }

  coverDemand(pct: number): this {
    this._energyTargetPct = pct;
    return this;
  }

  overHorizon(years: number): this {
    this._horizonYears = years;
    return this;
  }

  withInflation(pct: number): this {
    this._inflationPct = pct;
    return this;
  }

  withSystemLoss(factor: number): this {
    this._systemLossFactor = factor;
    return this;
  }

  withDiscountRate(pct: number): this {
    this._discountRatePct = pct;
    return this;
  }

  restrictToBrands(brands: string[]): this {
    this._brandWhitelist = brands;
    return this;
  }

  filterBy(criterion: Criterion): this {
    this._criteria.push(criterion);
    return this;
  }

  build(): ProposalQuery {
    if (!this._projectId) {
      throw new InvalidQueryError('projectId is required');
    }
    if (this._energyTargetPct <= 0 || this._energyTargetPct > 200) {
      throw new InvalidQueryError(`energyDemandTargetPct must be 1–200, got ${this._energyTargetPct}`);
    }
    if (this._horizonYears < 1 || this._horizonYears > 50) {
      throw new InvalidQueryError(`horizonYears must be 1–50, got ${this._horizonYears}`);
    }
    if (this._systemLossFactor <= 0 || this._systemLossFactor > 1) {
      throw new InvalidQueryError(`systemLossFactor must be 0–1, got ${this._systemLossFactor}`);
    }

    return Object.freeze({
      projectId: this._projectId,
      params: Object.freeze({
        energyDemandTargetPct: this._energyTargetPct,
        horizonYears: this._horizonYears,
        energyInflationPctPerYear: this._inflationPct,
        systemLossFactor: this._systemLossFactor,
        discountRatePct: this._discountRatePct,
      }),
      brandWhitelist: this._brandWhitelist ? Object.freeze([...this._brandWhitelist]) : undefined,
      criteria: Object.freeze([...this._criteria]),
    });
  }
}

import { DomainRuleError } from '../../../shared/errors';

export interface MoneyProps {
  amount: number;
  currency: string;
}

export class Money {
  private constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}

  static create(props: MoneyProps): Money {
    if (props.amount < 0) throw new DomainRuleError('Money amount cannot be negative');
    if (!props.currency?.trim()) throw new DomainRuleError('Money currency is required');
    return new Money(props.amount, props.currency.toUpperCase().trim());
  }

  toPlain(): MoneyProps {
    return { amount: this.amount, currency: this.currency };
  }
}

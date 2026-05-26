import { DomainRuleError } from '../../../shared/errors';

export interface AddressProps {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string;
  lat?: number;
  lon?: number;
}

export class Address {
  private constructor(
    readonly street: string,
    readonly city: string,
    readonly state: string,
    readonly country: string,
    readonly zipCode: string | undefined,
    readonly lat: number | undefined,
    readonly lon: number | undefined,
  ) {}

  static create(props: AddressProps): Address {
    if (!props.street?.trim()) throw new DomainRuleError('Address street is required');
    if (!props.city?.trim()) throw new DomainRuleError('Address city is required');
    return new Address(
      props.street.trim(),
      props.city.trim(),
      props.state.trim(),
      props.country.trim(),
      props.zipCode?.trim(),
      props.lat,
      props.lon,
    );
  }

  toPlain(): AddressProps {
    return { street: this.street, city: this.city, state: this.state, country: this.country, zipCode: this.zipCode, lat: this.lat, lon: this.lon };
  }

  toString(): string {
    return `${this.street}, ${this.city}, ${this.state}, ${this.country}`;
  }
}

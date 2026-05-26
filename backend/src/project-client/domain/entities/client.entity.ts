import { Address, AddressProps } from '../value-objects/address.vo';
import { ClientKind } from '../value-objects/client-kind.enum';

interface CreateClientProps {
  id: string;
  tenantId: string;
  kind: ClientKind;
  displayName: string;
  primaryAddress: AddressProps;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
}

interface RehydrateClientProps extends CreateClientProps {
  createdAt: Date;
  updatedAt: Date;
}

export class Client {
  private constructor(
    readonly id: string,
    readonly tenantId: string,
    readonly kind: ClientKind,
    private _displayName: string,
    private _primaryAddress: Address,
    private _contactEmail: string,
    private _contactPhone: string | undefined,
    private _notes: string | undefined,
    readonly createdAt: Date,
    private _updatedAt: Date,
  ) {}

  static create(props: CreateClientProps): Client {
    const now = new Date();
    return new Client(
      props.id,
      props.tenantId,
      props.kind,
      props.displayName.trim(),
      Address.create(props.primaryAddress),
      props.contactEmail.toLowerCase().trim(),
      props.contactPhone?.trim(),
      props.notes?.trim(),
      now,
      now,
    );
  }

  static rehydrate(props: RehydrateClientProps): Client {
    return new Client(
      props.id,
      props.tenantId,
      props.kind,
      props.displayName,
      Address.create(props.primaryAddress),
      props.contactEmail,
      props.contactPhone,
      props.notes,
      props.createdAt,
      props.updatedAt,
    );
  }

  get displayName(): string { return this._displayName; }
  get primaryAddress(): Address { return this._primaryAddress; }
  get contactEmail(): string { return this._contactEmail; }
  get contactPhone(): string | undefined { return this._contactPhone; }
  get notes(): string | undefined { return this._notes; }
  get updatedAt(): Date { return this._updatedAt; }

  update(changes: Partial<Pick<CreateClientProps, 'displayName' | 'primaryAddress' | 'contactEmail' | 'contactPhone' | 'notes'>>): void {
    if (changes.displayName !== undefined) this._displayName = changes.displayName.trim();
    if (changes.primaryAddress !== undefined) this._primaryAddress = Address.create(changes.primaryAddress);
    if (changes.contactEmail !== undefined) this._contactEmail = changes.contactEmail.toLowerCase().trim();
    if (changes.contactPhone !== undefined) this._contactPhone = changes.contactPhone?.trim();
    if (changes.notes !== undefined) this._notes = changes.notes?.trim();
    this._updatedAt = new Date();
  }
}

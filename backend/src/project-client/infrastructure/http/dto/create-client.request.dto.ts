import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ClientKind } from '../../../domain/value-objects/client-kind.enum';
import { AddressDto } from './address.request.dto';

export class CreateClientRequestDto {
  @IsEnum(ClientKind)
  kind!: ClientKind;

  @IsString()
  displayName!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  primaryAddress!: AddressDto;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

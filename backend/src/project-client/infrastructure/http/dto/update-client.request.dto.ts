import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, ValidateNested } from 'class-validator';
import { AddressDto } from './address.request.dto';

export class UpdateClientRequestDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  primaryAddress?: AddressDto;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

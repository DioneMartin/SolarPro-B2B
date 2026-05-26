import { Type } from 'class-transformer';
import { IsInt, IsString, IsUUID, Max, Min, ValidateNested } from 'class-validator';
import { AddressDto } from './address.request.dto';

export class CreateProjectRequestDto {
  @IsUUID()
  clientId!: string;

  @IsString()
  name!: string;

  @ValidateNested()
  @Type(() => AddressDto)
  siteAddress!: AddressDto;

  @IsInt()
  @Min(1)
  @Max(200)
  energyDemandTargetPct!: number;
}

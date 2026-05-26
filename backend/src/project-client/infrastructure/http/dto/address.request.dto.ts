import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddressDto {
  @IsString()
  street!: string;

  @IsString()
  city!: string;

  @IsString()
  state!: string;

  @IsString()
  country!: string;

  @IsOptional()
  @IsString()
  zipCode?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  lat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  lon?: number;
}

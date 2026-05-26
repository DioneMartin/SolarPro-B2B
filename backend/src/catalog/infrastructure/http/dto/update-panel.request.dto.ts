import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class MoneyDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  currency!: string;
}

export class UpdatePanelRequestDto {
  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  modelName?: string;

  @IsOptional()
  @IsObject()
  specs?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  mapping?: Record<string, string>;

  @IsOptional()
  @ValidateNested()
  @Type(() => MoneyDto)
  unitCost?: MoneyDto;
}

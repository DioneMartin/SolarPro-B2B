import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

class MoneyDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsString()
  currency!: string;
}

export class RegisterPanelRequestDto {
  @IsString()
  brand!: string;

  @IsString()
  modelName!: string;

  @IsObject()
  specs!: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  mapping?: Record<string, string>;

  @ValidateNested()
  @Type(() => MoneyDto)
  unitCost!: MoneyDto;
}

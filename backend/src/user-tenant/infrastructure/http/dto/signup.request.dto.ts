import { IsString, MinLength, IsEmail, Matches } from 'class-validator';

export class SignupRequestDto {
  @IsString()
  @MinLength(2)
  tenantName!: string;

  @Matches(/^[a-z0-9-]+$/, { message: 'slug may only contain lowercase letters, digits, and hyphens' })
  @MinLength(2)
  slug!: string;

  @IsEmail()
  adminEmail!: string;

  @IsString()
  @MinLength(12)
  adminPassword!: string;

  @IsString()
  @MinLength(2)
  adminFullName!: string;
}

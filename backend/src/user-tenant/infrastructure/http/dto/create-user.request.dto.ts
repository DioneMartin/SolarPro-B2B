import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '../../../domain/value-objects/user-role.enum';

export class CreateUserRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(12)
  password!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEnum(UserRole)
  role!: UserRole;
}

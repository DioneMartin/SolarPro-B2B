import { IsEnum } from 'class-validator';
import { UserRole } from '../../../domain/value-objects/user-role.enum';

export class UpdateRoleRequestDto {
  @IsEnum(UserRole)
  role!: UserRole;
}

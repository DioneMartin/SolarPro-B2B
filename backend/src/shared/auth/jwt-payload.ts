import { Role } from './role.enum';

export interface JwtPayload {
  sub: string;       // userId
  tenantId: string;
  role: Role;
  iat?: number;
  exp?: number;
}

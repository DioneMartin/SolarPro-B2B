import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload, TokenSignerPort } from '../../application/ports/token-signer.port';

@Injectable()
export class JwtTokenSignerAdapter implements TokenSignerPort {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: TokenPayload): string {
    return this.jwtService.sign(payload);
  }
}

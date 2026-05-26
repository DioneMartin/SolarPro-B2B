export interface TokenPayload {
  sub: string;
  tenantId: string;
  role: string;
}

export interface TokenSignerPort {
  sign(payload: TokenPayload): string;
}

export const TOKEN_SIGNER = 'TOKEN_SIGNER';

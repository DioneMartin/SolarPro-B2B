import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skip JWT auth for this handler. Use for /auth/login, /auth/signup, /health. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

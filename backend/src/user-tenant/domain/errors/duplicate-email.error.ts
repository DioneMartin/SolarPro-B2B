import { ConflictError } from '../../../shared/errors';

export class DuplicateEmailError extends ConflictError {
  constructor(email: string) {
    super(`Email ${email} is already in use within this tenant`);
  }
}

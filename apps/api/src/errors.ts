export type FieldError = { field: string; reason: string };

export class ApiFailure extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: FieldError[];

  constructor(status: number, code: string, message: string, details: FieldError[] = []) {
    super(message);
    this.name = 'ApiFailure';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class PersistenceFailure extends Error {
  constructor() {
    super('PERSISTENCE_UNAVAILABLE');
    this.name = 'PersistenceFailure';
  }
}

export function badRequest(code: string, message: string, details: FieldError[] = []): ApiFailure {
  return new ApiFailure(400, code, message, details);
}

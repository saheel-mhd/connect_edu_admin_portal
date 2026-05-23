export class ApiClientError extends Error {
  readonly errorCode: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    errorCode: string,
    status: number,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.errorCode = errorCode;
    this.status = status;
    this.details = details;
  }
}

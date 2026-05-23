export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

export interface ApiError {
  success: false;
  message: string;
  errorCode: string;
  details?: Record<string, unknown>;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

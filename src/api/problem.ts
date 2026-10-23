export type FieldError = {
  field?: string;
  message?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly detail: string;
  readonly errors: FieldError[];
  readonly retryAfter: number | null;

  constructor(input: {
    status: number;
    code?: string;
    detail?: string;
    title?: string;
    errors?: FieldError[];
    retryAfter?: number | null;
  }) {
    const detail = input.detail || input.title || `Request failed (${input.status})`;
    super(detail);
    this.name = 'ApiError';
    this.status = input.status;
    this.code = input.code || statusCode(input.status);
    this.detail = detail;
    this.errors = input.errors ?? [];
    this.retryAfter = input.retryAfter ?? null;
  }

  fieldMessage(field: string): string | undefined {
    return this.errors.find((item) => item.field === field)?.message;
  }
}

function statusCode(status: number): string {
  if (status === 401) return 'unauthorized';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status === 422) return 'validation_failed';
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'unavailable';
  return 'error';
}

export function parseProblem(status: number, body: unknown): ApiError {
  if (!body || typeof body !== 'object') {
    return new ApiError({ status });
  }
  const record = body as Record<string, unknown>;
  const errors = Array.isArray(record.errors)
    ? record.errors.filter((item): item is FieldError => !!item && typeof item === 'object')
    : [];
  const retryAfter =
    typeof record.retryAfter === 'number'
      ? record.retryAfter
      : typeof record.retryAfter === 'string'
        ? Number(record.retryAfter) || null
        : null;
  return new ApiError({
    status,
    code: typeof record.code === 'string' ? record.code : undefined,
    detail: typeof record.detail === 'string' ? record.detail : undefined,
    title: typeof record.title === 'string' ? record.title : undefined,
    errors,
    retryAfter,
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

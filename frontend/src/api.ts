/**
 * Tiny fetch wrapper. Extend it, replace it with a data-fetching library, or
 * delete it -- whatever you'd actually do.
 *
 * Note that DRF returns validation errors as a 400 with a body shaped like
 *   { "duration_ms": ["..."], "status": ["..."] }
 * which the form is expected to render next to the relevant field.
 */

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Request failed with ${status}`);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const text = await response.text();
  const body: unknown = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, body);
  }

  return body as T;
}

export function getJson<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function postJson<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, { method: "POST", body: JSON.stringify(payload) });
}

// An example of the kind of type we'd like to see for your real payloads.
export interface HealthResponse {
  status: string;
  database: string;
}

export function getHealth(): Promise<HealthResponse> {
  return getJson<HealthResponse>("/api/health/");
}

// TODO(candidate): types and calls for the builds list, the create-build POST,
// and the service summary.

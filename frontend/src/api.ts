/**
 * The only module that talks to the backend. Components call these functions
 * and never deal with fetch, URLs or raw Response objects.
 *
 * Errors:
 *  - 400 with field messages  -> ValidationError (has .fieldErrors for the form)
 *  - any other non-2xx        -> ApiError
 *  - network failure / abort  -> the browser's own TypeError / AbortError
 */

import type {
  Build,
  BuildFilters,
  BuildInput,
  FieldErrors,
  Paginated,
  ServiceSummary,
} from "./types";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`Request failed with ${status}`);
    this.name = "ApiError";
  }
}

/** A 400 whose body is DRF's { field: ["message", ...] } shape. */
export class ValidationError extends ApiError {
  constructor(readonly fieldErrors: FieldErrors) {
    super(400, fieldErrors);
    this.name = "ValidationError";
  }
}

function isFieldErrors(body: unknown): body is FieldErrors {
  return (
    typeof body === "object" &&
    body !== null &&
    !Array.isArray(body) &&
    Object.values(body).every(
      (v) => Array.isArray(v) && v.every((m) => typeof m === "string"),
    )
  );
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...init?.headers },
  });

  // A 500 from Django can be an HTML page, so don't assume the body is JSON.
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    if (response.status === 400 && isFieldErrors(body)) {
      throw new ValidationError(body);
    }
    throw new ApiError(response.status, body);
  }

  return body as T;
}

// ---------- health (from the starter) ----------

export interface HealthResponse {
  status: string;
  database: string;
}

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>("/api/health/", { signal });
}

// ---------- builds ----------

/** GET /api/builds/  newest first, 50 per page. Empty filters are left out of the URL. */
export function listBuilds(filters: BuildFilters = {}, signal?: AbortSignal): Promise<Paginated<Build>> {
  const params = new URLSearchParams();
  if (filters.service) params.set("service", filters.service);
  if (filters.status) params.set("status", filters.status);
  if (filters.page && filters.page > 1) params.set("page", String(filters.page));

  const query = params.toString();
  return request<Paginated<Build>>(`/api/builds/${query ? `?${query}` : ""}`, { signal });
}

/** POST /api/builds/. Throws ValidationError with per-field messages on a 400. */
export function createBuild(input: BuildInput): Promise<Build> {
  return request<Build>("/api/builds/", { method: "POST", body: JSON.stringify(input) });
}

// ---------- services ----------

/** GET /api/services/  one row per service, sorted by name. */
export function listServices(signal?: AbortSignal): Promise<ServiceSummary[]> {
  return request<ServiceSummary[]>("/api/services/", { signal });
}
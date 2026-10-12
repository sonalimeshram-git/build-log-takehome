/**
 * Types for the Build Log API. They mirror the backend exactly
 * (builds/serializers.py), so if the API changes, `npm run typecheck`
 * points at every place in the UI that needs updating.
 */

export const BUILD_STATUSES = ["success", "failed", "cancelled"] as const;
export type BuildStatus = (typeof BUILD_STATUSES)[number];

export const TRIGGERS = ["push", "pull_request", "schedule", "manual"] as const;
export type Trigger = (typeof TRIGGERS)[number];

/** A build as returned by GET/POST /api/builds/. */
export interface Build {
  id: number;
  service: string;
  branch: string;
  commit_sha: string;
  status: BuildStatus;
  /** ISO 8601, always UTC with a trailing "Z". */
  started_at: string;
  duration_ms: number;
  /** Empty string when not provided. */
  triggered_by: Trigger | "";
  author: string;
  /** When the API recorded the build (ISO 8601, UTC). */
  created_at: string;
}

/** Body for POST /api/builds/. */
export interface BuildInput {
  service: string;
  branch: string;
  commit_sha: string;
  status: BuildStatus;
  /** Must be UTC, e.g. "2026-08-01T10:00:00Z". */
  started_at: string;
  duration_ms: number;
  triggered_by?: Trigger;
  author?: string;
}

/** DRF PageNumberPagination envelope. */
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Query parameters for GET /api/builds/. */
export interface BuildFilters {
  service?: string;
  status?: BuildStatus;
  page?: number;
}

/** One row of GET /api/services/. */
export interface ServiceSummary {
  service: string;
  total_builds: number;
  success_count: number;
  failed_count: number;
  cancelled_count: number;
  /** success / (success + failed), 0..1. Null when there are no completed builds. */
  success_rate: number | null;
  latest_status: BuildStatus;
  latest_started_at: string;
}

/**
 * A 400 from the API: messages keyed by field name, plus "non_field_errors"
 * for problems that aren't about one field (e.g. a duplicate build).
 */
export type FieldErrors = Partial<Record<keyof BuildInput | "non_field_errors", string[]>> &
  Record<string, string[] | undefined>;
/** Display helpers. Pure functions, so they're easy to test. */

/** 83362 -> "1m 23s", 950 -> "0.9s", 3_725_000 -> "1h 2m". */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${(ms / 1000).toFixed(1)}s`;
  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** "2026-08-01T10:00:00.123Z" -> "2026-08-01 10:00 UTC". Shown in UTC so everyone sees the same time. */
export function formatUtc(iso: string): string {
  return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;
}

/** First 7 characters, like `git log --oneline`. */
export function shortSha(sha: string): string {
  return sha.slice(0, 7);
}

/** 0.7824 -> "78.2%", null -> "—". */
export function formatRate(rate: number | null): string {
  return rate === null ? "—" : `${(rate * 100).toFixed(1)}%`;
}
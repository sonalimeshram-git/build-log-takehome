import { useState, type FormEvent } from "react";

import { createBuild, ValidationError } from "../api";
import { BUILD_STATUSES, TRIGGERS, type Build, type BuildInput, type FieldErrors } from "../types";

interface Props {
  /** Existing service names, offered as suggestions (any name can still be typed). */
  serviceNames: string[];
  /** Called after the API accepts a build, so the page can refresh its lists. */
  onCreated: (build: Build) => void;
}

/** Everything is kept as the raw text the user typed; it's converted only when submitting. */
interface FormValues {
  service: string;
  branch: string;
  commit_sha: string;
  status: string;
  started_at: string; // value of <input type="datetime-local">, in the browser's local time
  duration_ms: string;
  triggered_by: string;
  author: string;
}

const EMPTY: FormValues = {
  service: "",
  branch: "",
  commit_sha: "",
  status: "success",
  started_at: "",
  duration_ms: "",
  triggered_by: "",
  author: "",
};

const FIELDS_IN_FORM = new Set<string>(Object.keys(EMPTY));

/** "2026-08-01T03:00" (local) -> "2026-08-01T10:00:00.000Z". Unparseable input is sent as-is so the API reports it. */
function localToUtcIso(local: string): string {
  if (!local) return "";
  const date = new Date(local);
  return Number.isNaN(date.getTime()) ? local : date.toISOString();
}

/** Send a real number when the text is a whole number; otherwise send the text and let the API say what's wrong. */
function toDuration(text: string): number | string {
  return /^-?\d+$/.test(text.trim()) ? Number(text) : text;
}

/** Build the POST body. The API does all validation; nothing is silently dropped or "fixed" here. */
function toPayload(v: FormValues): BuildInput {
  const payload: Record<string, unknown> = {
    service: v.service.trim(),
    branch: v.branch.trim(),
    commit_sha: v.commit_sha.trim(),
    status: v.status,
    started_at: localToUtcIso(v.started_at),
    duration_ms: toDuration(v.duration_ms),
  };
  if (v.triggered_by) payload.triggered_by = v.triggered_by;
  if (v.author.trim()) payload.author = v.author.trim();
  return payload as unknown as BuildInput;
}

export default function CreateBuildForm({ serviceNames, onCreated }: Props) {
  const [values, setValues] = useState<FormValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<Build | null>(null);

  function update(field: keyof FormValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    // Clear that field's error as soon as the user edits it.
    setErrors(({ [field]: _removed, ...rest }) => rest);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return; // no double submits
    setSubmitting(true);
    setErrors({});
    setGeneralError(null);
    setLastCreated(null);

    try {
      const build = await createBuild(toPayload(values));
      setValues(EMPTY);
      setLastCreated(build);
      onCreated(build);
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors(err.fieldErrors);
      } else {
        setGeneralError(err instanceof Error ? err.message : String(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Errors not tied to a visible input (non_field_errors, or any field the form doesn't show).
  const topErrors = Object.entries(errors)
    .filter(([field]) => !FIELDS_IN_FORM.has(field))
    .flatMap(([, messages]) => messages ?? []);

  const utcPreview = values.started_at ? localToUtcIso(values.started_at) : "";

  /** Props shared by every input: value, onChange and accessible error wiring. */
  function fieldProps(field: keyof FormValues) {
    const hasError = Boolean(errors[field]?.length);
    return {
      id: `build-${field}`,
      name: field,
      value: values[field],
      "aria-invalid": hasError || undefined,
      "aria-describedby": hasError ? `build-${field}-error` : undefined,
      onChange: (e: { target: { value: string } }) => update(field, e.target.value),
    };
  }

  /** A plain function (not a component) so React doesn't remount it on every render. */
  function fieldError(field: keyof FormValues) {
    const messages = errors[field];
    if (!messages?.length) return null;
    return (
      <span className="field-error" id={`build-${field}-error`}>
        {messages.join(" ")}
      </span>
    );
  }

  return (
    // noValidate: the API is the source of truth for validation, so every rule
    // and message comes from one place instead of being duplicated here.
    <form className="build-form" onSubmit={handleSubmit} noValidate>
      {topErrors.length > 0 && <p role="alert">{topErrors.join(" ")}</p>}
      {generalError && <p role="alert">Could not save the build: {generalError}</p>}
      {lastCreated && (
        <p className="success" role="status">
          Recorded build #{lastCreated.id} for {lastCreated.service}.
        </p>
      )}

      <div className="grid">
        <label htmlFor="build-service">Service</label>
        <div>
          <input {...fieldProps("service")} list="service-names" placeholder="checkout-api" autoComplete="off" />
          <datalist id="service-names">
            {serviceNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {fieldError("service")}
        </div>

        <label htmlFor="build-branch">Branch</label>
        <div>
          <input {...fieldProps("branch")} placeholder="main" />
          {fieldError("branch")}
        </div>

        <label htmlFor="build-commit_sha">Commit SHA</label>
        <div>
          <input {...fieldProps("commit_sha")} placeholder="40 hex characters" maxLength={64} spellCheck={false} />
          {fieldError("commit_sha")}
        </div>

        <label htmlFor="build-status">Status</label>
        <div>
          <select {...fieldProps("status")}>
            {BUILD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {fieldError("status")}
        </div>

        <label htmlFor="build-started_at">Started at</label>
        <div>
          <input {...fieldProps("started_at")} type="datetime-local" step={1} />
          <span className="hint">
            {" "}
            Your local time{utcPreview ? `, sent as ${utcPreview}` : ", sent as UTC"}
          </span>
          {fieldError("started_at")}
        </div>

        <label htmlFor="build-duration_ms">Duration (ms)</label>
        <div>
          <input {...fieldProps("duration_ms")} inputMode="numeric" placeholder="83362" />
          {fieldError("duration_ms")}
        </div>

        <label htmlFor="build-triggered_by">Triggered by</label>
        <div>
          <select {...fieldProps("triggered_by")}>
            <option value="">(not set)</option>
            {TRIGGERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {fieldError("triggered_by")}
        </div>

        <label htmlFor="build-author">Author</label>
        <div>
          <input {...fieldProps("author")} placeholder="optional" />
          {fieldError("author")}
        </div>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving…" : "Record build"}
      </button>
    </form>
  );
}
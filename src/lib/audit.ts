/**
 * Lightweight structured audit logging for privileged admin actions.
 *
 * Emits a single JSON line per action to stdout, which the hosting platform's
 * log pipeline (Vercel, CloudWatch, etc.) captures and retains. This gives a
 * tamper-evident-ish trail of *who did what, to what, and when* without standing
 * up extra infrastructure.
 *
 * For stronger guarantees (queryable history, immutability), promote this to a
 * dedicated append-only `audit_log` table — the call sites below stay the same.
 */
import "server-only";

type AuditEntry = {
  actor: string | null; // admin username, or null if somehow unattributed
  action: string; // e.g. "reservation.status_change"
  target: string; // affected resource id
  details?: Record<string, unknown>;
};

export function auditLog(entry: AuditEntry): void {
  const record = {
    type: "audit",
    at: new Date().toISOString(),
    actor: entry.actor ?? "unknown",
    action: entry.action,
    target: entry.target,
    ...(entry.details ? { details: entry.details } : {}),
  };
  // Single JSON line — easy to grep/aggregate downstream.
  console.info(JSON.stringify(record));
}

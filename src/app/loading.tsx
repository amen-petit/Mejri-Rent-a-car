/**
 * Root-level loading UI, shown during server navigation/data fetches for routes
 * that don't define their own loading state. Calm, branded, and accessible.
 */
import { getServerI18n } from "@/i18n/server";

export default async function Loading() {
  const { t } = await getServerI18n();
  return (
    <main
      className="flex min-h-screen items-center justify-center bg-paper"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        <span className="text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-stone">
          {t.common.loading}
        </span>
      </div>
    </main>
  );
}

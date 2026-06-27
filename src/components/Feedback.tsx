"use client";

/**
 * App-wide feedback layer: toasts + confirmation dialogs.
 *
 * Replaces the browser's native alert()/confirm() (jarring, unstyled, and they
 * leak technical text) with on-brand, accessible UI:
 *  - useToast(): transient status messages, announced to screen readers.
 *  - useConfirm(): a promise-based confirmation dialog (focus-managed, Escape to
 *    cancel) so destructive actions get a graceful prompt.
 *
 * Mounted once in the root layout, so every page (public + admin) can use it.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & {
  resolve: (ok: boolean) => void;
};

type FeedbackContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function useToast() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useToast must be used within <FeedbackProvider>");
  return ctx.toast;
}

export function useConfirm() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error("useConfirm must be used within <FeedbackProvider>");
  return ctx.confirm;
}

const TOAST_TTL_MS = 5000;

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return (
      <svg className="h-4 w-4 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  if (variant === "error") {
    return (
      <svg className="h-4 w-4 shrink-0 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 shrink-0 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export default function FeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const idRef = useRef(0);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = (idRef.current += 1);
      setToasts((list) => [...list, { id, message, variant }]);
      setTimeout(() => dismiss(id), TOAST_TTL_MS);
    },
    [dismiss],
  );

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const settleConfirm = useCallback(
    (ok: boolean) => {
      setConfirmState((current) => {
        current?.resolve(ok);
        return null;
      });
    },
    [],
  );

  // Confirm dialog: focus the primary action on open, Escape cancels.
  useEffect(() => {
    if (!confirmState) return;
    confirmButtonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") settleConfirm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmState, settleConfirm]);

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast region — polite live region so screen readers announce updates. */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 px-4 pb-4 sm:inset-x-auto sm:right-4 sm:items-end"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className="toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius)] border border-white/12 bg-ink px-4 py-3 text-sm text-paper shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)]"
          >
            <ToastIcon variant={t.variant} />
            <span className="min-w-0 flex-1 leading-snug" style={{ overflowWrap: "anywhere" }}>
              {t.message}
            </span>
            <button
              onClick={() => dismiss(t.id)}
              className="-mr-1 -mt-0.5 shrink-0 rounded p-0.5 text-white/45 transition-colors hover:text-white"
              aria-label="Fermer la notification"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation dialog */}
      {confirmState && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/50 px-4 backdrop-blur-sm"
          onClick={() => settleConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div
            className="w-full max-w-sm rounded-[var(--radius-lg)] border border-mist bg-paper p-7 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="confirm-title" className="font-display text-xl font-medium text-ink">
              {confirmState.title}
            </h2>
            {confirmState.message && (
              <p className="mt-2.5 text-sm leading-6 text-stone">
                {confirmState.message}
              </p>
            )}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row-reverse">
              <button
                ref={confirmButtonRef}
                onClick={() => settleConfirm(true)}
                className={`flex-1 rounded-[var(--radius)] px-4 py-2.5 text-sm font-medium transition-colors active:scale-[0.98] ${
                  confirmState.danger
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-ink text-paper hover:bg-graphite"
                }`}
              >
                {confirmState.confirmLabel ?? "Confirmer"}
              </button>
              <button
                onClick={() => settleConfirm(false)}
                className="flex-1 rounded-[var(--radius)] border border-line px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink active:scale-[0.98]"
              >
                {confirmState.cancelLabel ?? "Annuler"}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}

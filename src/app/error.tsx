"use client";

/**
 * Route-level error boundary. Catches render/data errors anywhere in the page
 * tree and shows a calm, human recovery screen instead of a raw stack trace.
 * `reset()` re-attempts rendering the segment.
 */
import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for diagnostics (server/observability picks this up); never shown to
    // the user.
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 py-20 text-center">
      <span className="eyebrow">Une erreur est survenue</span>
      <h1 className="mt-5 font-display text-[clamp(2rem,5vw,3.25rem)] font-medium leading-[1.05] tracking-tight text-ink">
        Quelque chose s&apos;est mal passé
      </h1>
      <p className="mt-4 max-w-md text-sm leading-7 text-stone">
        Nous n&apos;avons pas pu afficher cette page pour le moment. Vous pouvez
        réessayer — si le problème persiste, revenez dans quelques instants.
      </p>
      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <button onClick={reset} className="btn-primary px-7 py-3">
          Réessayer
        </button>
        <Link href="/" className="btn-outline px-7 py-3">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}

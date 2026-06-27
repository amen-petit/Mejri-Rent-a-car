"use client";

/**
 * Root error boundary — the last line of defense. It replaces the root layout
 * when an error occurs there, so it must render its own <html>/<body> and can't
 * depend on the app's CSS. Styles are inlined to stay self-contained and on-brand.
 */
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "2rem 1.5rem",
          background: "#f6f4f0",
          color: "#0b0b0c",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <p
          style={{
            fontSize: "0.7rem",
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#6b675f",
            margin: 0,
          }}
        >
          Erreur
        </p>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(2rem, 5vw, 3rem)",
            fontWeight: 500,
            lineHeight: 1.05,
            margin: "1.25rem 0 0",
          }}
        >
          Quelque chose s&apos;est mal passé
        </h1>
        <p
          style={{
            maxWidth: "28rem",
            fontSize: "0.9rem",
            lineHeight: 1.7,
            color: "#6b675f",
            margin: "1rem 0 0",
          }}
        >
          Nous rencontrons un problème technique. Veuillez réessayer dans un
          instant.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "2rem",
            background: "#0b0b0c",
            color: "#f6f4f0",
            border: "none",
            borderRadius: "7px",
            padding: "0.8rem 1.75rem",
            fontSize: "0.85rem",
            fontWeight: 560,
            cursor: "pointer",
          }}
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}

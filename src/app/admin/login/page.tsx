"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        // Map to human French copy; never surface the raw server/status text.
        if (response.status === 429) {
          throw new Error(
            "Trop de tentatives. Patientez une minute, puis réessayez.",
          );
        }
        if (response.status === 401) {
          throw new Error("Nom d'utilisateur ou mot de passe incorrect.");
        }
        throw new Error(
          "Connexion impossible pour le moment. Réessayez dans un instant.",
        );
      }

      router.push(nextPath);
      router.refresh();
    } catch (loginError) {
      // A thrown Error from above carries friendly copy; anything else is a
      // network/unexpected failure.
      const isFriendly =
        loginError instanceof Error &&
        !/fetch|network|failed to/i.test(loginError.message);
      setError(
        isFriendly && loginError instanceof Error
          ? loginError.message
          : "Problème de connexion. Vérifiez votre connexion internet et réessayez.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="card-surface w-full max-w-md p-8 sm:p-10">
        <div className="mb-8">
          <span className="eyebrow">Admin Access</span>
          <h1 className="mt-4 font-display text-3xl font-medium text-ink">
            Connexion administrateur
          </h1>
          <p className="mt-3 text-sm leading-7 text-stone">
            Connectez-vous pour gérer les véhicules et les réservations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
              Nom d&apos;utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-premium"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-stone">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-premium"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="rounded-[var(--radius)] border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-paper">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

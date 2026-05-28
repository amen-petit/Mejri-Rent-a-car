/**
 * SERVER-ONLY Supabase client using the service-role key.
 *
 * ⚠️ Never import this from a file that runs in the browser (no "use client"
 * components, no client-imported modules). It bypasses Row Level Security and
 * must only be reached from Route Handlers / Server Components / Server Actions.
 *
 * The client is created lazily so that simply importing this module never throws
 * at build time. It only throws when actually used without the required env vars
 * (e.g. before SUPABASE_SERVICE_ROLE_KEY is configured on the host).
 */
import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  // The project URL is not a secret, so fall back to the public one. Only the
  // service-role key is sensitive and must be set as a server-only var.
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY (or Supabase URL) environment variable.",
    );
  }

  cachedClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
}

import type { NextConfig } from "next";

// Derive the exact Supabase host from env so the image optimizer only proxies
// our project's public storage, not any *.supabase.co subdomain.
const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : undefined;
  } catch {
    return undefined;
  }
})();

// Origin (scheme + host) used to scope img/connect in the CSP to our Supabase
// project. Falls back to the wildcard host only when the env var is absent.
const supabaseOrigin = supabaseHostname
  ? `https://${supabaseHostname}`
  : "https://*.supabase.co";

const isDev = process.env.NODE_ENV !== "production";

// Content-Security-Policy.
// - 'unsafe-inline' is required for styles (the app uses many inline style={})
//   and for Next.js's inline bootstrap/runtime scripts (no nonce pipeline here).
//   This is the pragmatic posture for a Next App Router site without a custom
//   nonce middleware; tighten to nonces later if the threat model demands it.
// - 'unsafe-eval' is added in DEVELOPMENT ONLY: React's dev build uses eval()
//   for debugging features (HMR, callstack reconstruction). It is never emitted
//   in production, so the production CSP stays free of 'unsafe-eval'.
// - img/connect are scoped to self + our Supabase origin.
const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin}`,
  "upgrade-insecure-requests",
].join("; ");

// Security headers applied to every response. These are cheap, high-value
// defenses (clickjacking, MIME sniffing, referrer/permission leakage, HSTS).
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Drop the framework version banner so we don't advertise the exact Next.js
  // build to anyone fingerprinting the deployment.
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHostname ?? "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

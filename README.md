# Mejri Rent a Car

A production car‑rental platform for a Tunisian agency: a trilingual (FR / EN / AR, RTL‑aware) marketing site with an online booking flow, plus a private admin dashboard for fleet, availability, promotions and reservations.

## Tech stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **Tailwind CSS v4** — editorial design system in `src/app/globals.css`
- **Supabase** — Postgres (RLS) + Storage (car images)
- **Upstash Redis** — distributed rate limiting (with an in‑memory dev fallback)
- **Nodemailer** — reservation emails
- **Vercel Analytics**
- **Vitest** — unit tests for the pure domain logic (pricing, availability, promotions, validation)

## Features

- Hero booking search, fleet listing with filters, per‑vehicle detail + booking
- Server‑authoritative pricing with duration tiers and **promotions** (percentage / fixed)
- Atomic, race‑safe reservations (Postgres advisory lock — no overbooking)
- Pickup / return across the agency and all major Tunisian airports
- Admin dashboard: vehicles, availability, reservations, promotions
- Custom HMAC‑signed admin sessions, CSP + security headers, SEO metadata, sitemap

## Prerequisites

- **Node.js 20+** and npm
- A **Supabase** project (free tier is fine)
- Optional for production: an **Upstash Redis** database (rate limiting) and an **SMTP** account (emails)

## Getting started

```bash
git clone <repo-url>
cd Mejri-Rent-a-car
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. Every variable is documented inline there. Highlights:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Public Supabase client (browser reads of cars/promotions). |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Server‑only secret** — powers all admin mutations and the booking flow. Never prefix with `NEXT_PUBLIC`. |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` | ✅ | Admin login + session signing. Use long random values. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Prod | Without them the limiter falls back to per‑instance memory, which does **not** hold across serverless instances. |
| `EMAIL_*`, `NOTIFY_TO` | Optional | Reservation notification emails. |
| `NEXT_PUBLIC_*` (brand, phone, WhatsApp, maps, timezone, socials) | Optional | Branding + content; sensible defaults exist. |

## Database setup (Supabase)

Open the Supabase **SQL Editor** and run the migrations in `supabase/` **in this order** (each is idempotent and safe to re‑run):

1. `security-setup.sql` — RLS (public reads cars only; reservations locked), storage lock‑down, atomic booking function
2. `add-pickup-return-time.sql` — pickup/return times on reservations
3. `add-reservation-locations.sql` — pickup/return locations
4. `performance-and-integrity.sql` — indexes + CHECK constraints
5. `reservations-admin-search.sql` — trigram + indexes for the admin reservations search
6. `add-promotions.sql` — promotions table (+ RLS) and reservation price snapshot
7. `expand-locations.sql` — widen the location CHECK to all Tunisian airports

You also need a **public** Storage bucket named `car-images` (the security migration sets its size/MIME limits and locks uploads to the server).

## Admin

The dashboard lives at **`/admin`** (middleware‑gated, `noindex`). Log in at `/admin/login` with `ADMIN_USERNAME` / `ADMIN_PASSWORD`. Sessions are HMAC‑signed cookies (`httpOnly`, `secure`, `sameSite=strict`).

## Scripts

```bash
npm run dev        # start the dev server (Turbopack)
npm run build      # production build
npm run start      # serve the production build
npm run lint       # ESLint over src
npm run typecheck  # tsc --noEmit
npm run test       # Vitest (unit tests)
```

## Deployment (Vercel)

1. Import the repo into Vercel.
2. Add every variable from `.env.example` in **Project Settings → Environment Variables** (including `SUPABASE_SERVICE_ROLE_KEY`, and the Upstash vars for production rate limiting). Set `NEXT_PUBLIC_SITE_URL` to the deployed URL.
3. Run the Supabase migrations above against the production database.
4. Deploy. Images are optimized through `/_next/image`; the `car-images` Supabase host is already allow‑listed in `next.config.ts`.

## Project structure

```
src/
  app/            # App Router: pages (/, /voitures, /voitures/[id]), /admin/*, /api/*
  components/     # UI + feature components (Hero, BookingSearchCard, PromoBadge, ui/*)
  lib/            # Pure domain logic + data access (pricing, availability, promotions,
                  # validation, dates, time, constants, supabase clients, auth)
  i18n/           # fr / en / ar dictionaries + client & server helpers
supabase/         # SQL migrations (run in the order above)
```

Domain logic in `src/lib` is framework‑agnostic and unit‑tested — it is the single source of truth for pricing, availability, and promotions, shared by both the client (display) and the server (authoritative persistence).

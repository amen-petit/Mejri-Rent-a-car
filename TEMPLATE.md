# Reselling this template — per-client setup

Everything that changes between one deployment and another lives in **two places**:
the environment variables (identity + contact + credentials) and the color
palette block. You can rebrand a new client in a few minutes.

---

## 1. Brand name & contact (environment variables)

Set these in `.env.local` (local) and in your host's env settings (e.g. Vercel).
See `.env.example` for the full list.

| Variable | What it controls |
|---|---|
| `NEXT_PUBLIC_BRAND_NAME` | Full brand name (page titles, footer, admin header, emails, SEO). e.g. `"Sahara Rent a Car"` |
| `NEXT_PUBLIC_BRAND_SHORT` | Short mark used in headings and the big background watermark. e.g. `"Sahara"` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | WhatsApp / call number in international format, digits only. Drives every `wa.me/…` link and the `tel:` call button. e.g. `"21620123456"` |
| `NEXT_PUBLIC_PHONE_DISPLAY` | Human-readable phone shown in the UI. e.g. `"20 123 456"` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (canonical links, OpenGraph, sitemap). |

No brand name, phone, or WhatsApp number is hardcoded anywhere in the source —
they all flow from these variables (defined once in `src/lib/constants.ts`).

> The booking confirmation / status emails, SEO metadata, structured data, and
> the WhatsApp contact buttons all update automatically from the values above.

---

## 2. Color palette (one CSS block)

The entire visual skin is driven by **8 tokens** at the top of
`src/app/globals.css`:

```css
@theme {
  --color-primary:    #89a9f1; /* main accent (buttons, links, highlights) */
  --color-secondary:  #a66694; /* secondary accent (gradients, labels) */
  --color-navy:       #1f2430; /* dark base (dark sections, headings) */
  --color-navy-deep:  #181c27; /* darkest gradient stop */
  --color-navy-soft:  #252d41; /* lighter gradient stop */
  --color-surface:    #f7f8fc; /* light page background */
  --color-edge:       #dce5f7; /* borders / hairlines */
  --color-ink:        #2c3343; /* body text */
}
```

Change these values and the whole site re-skins — utilities (`bg-primary`,
`text-navy`, …), component classes, inline gradients, and translucent tints
(via `color-mix`) all derive from these tokens. For most rebrands you only
touch `--color-primary` and `--color-secondary`.

Notes:
- Neutral grays (`slate-*`), the success green (`emerald-*`/status dots), and
  warning amber are intentionally **not** part of the brand palette.
- Use OKLCH/hex as you like; any valid CSS color works.

---

## 3. Other per-client configuration (env)

These are required but not part of the visible brand:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  the server-only `SUPABASE_SERVICE_ROLE_KEY`. After deploying, run
  `supabase/security-setup.sql` in the new project's SQL editor to enable RLS
  and the atomic booking guard.
- **Email** (Nodemailer): `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`,
  `EMAIL_PASS`, `EMAIL_FROM`, `NOTIFY_TO`.
- **Admin auth**: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
  (use a long random value).

---

## Quick rebrand checklist

1. Copy `.env.example` → `.env.local`; fill in brand, contact, Supabase, email, admin.
2. Edit the `@theme` palette in `src/app/globals.css` (usually just the two accents).
3. Replace the favicon/OG image in `public/`.
4. `npm run dev` and review; `npm run build && npm test` before shipping.
5. Add the same env vars to your host (Vercel) and run `supabase/security-setup.sql`.

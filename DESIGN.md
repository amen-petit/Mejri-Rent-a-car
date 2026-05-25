Design tokens & system
----------------------

Brand palette (derived from existing CSS):
- Primary / Accent: #89a9f1 (emerald / light blue)
- Secondary / Accent 2: #a66694 (plum)
- Navy / Text: #1f2430
- Surface / Background: #F7F8FC
- Border / Muted: #DCE5F7

Typography
----------
- Heading: Space Grotesk (variable heading font already configured)
- Body: DM Sans (variable body font)
- Scale: H1 (clamp large headline), H2 (2rem), H3 (1.5rem), body (1rem)

Spacing & layout
-----------------
- Border radius: 1rem (rounded-2xl) for primary interactive surfaces, 1.5rem for large cards.
- Rhythm: use asymmetric vertical spacing (compact, regular, spacious) — avoid uniform padding everywhere.

Components (prioritized)
------------------------
- Navbar: clear brand, CTA to `Réserver maintenant`, phone link.
- Card-surface: rounded, subtle border, shadow-soft. Use for product tiles and admin list rows.
- Input forms: large touch targets, clear labels, inline validation feedback.
- Calendar: Monday-based week start, visually distinct unavailable days, start/end highlights.
- Admin table/list: compact rows, inline actions (confirm/cancel), bulk select, export button.

Motion
------
- Reveal-on-scroll with gentle translateY and opacity; use ease-out-quart.
- Avoid animating layout properties; use transforms for hover effects.

Accessibility
-------------
- Ensure color contrast for primary text and CTA meets WCAG AA.
- Focus styles for keyboard users; skip links where appropriate.

Implementation notes
--------------------
- Keep the design tokens centralized (globals.css already contains many tokens). When extracting, create a small `design/tokens.ts` for runtime values.
- Admin register is `product` — design for task efficiency: filters, search, bulk actions, and a detail panel with an audit trail.

Developer handoff
-----------------
Files to reference for visual consistency:
- `src/app/globals.css` (colors, utilities)
- `tailwind.config.ts` (theme mapping)
- `src/components/*` (Navbar/Footer/Card/Button)

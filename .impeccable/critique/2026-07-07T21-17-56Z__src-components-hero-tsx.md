---
target: the hero section
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-07-07T21-17-56Z
slug: src-components-hero-tsx
---
# Critique: Hero (`src/components/Hero.tsx`) — brand register

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | "Disponible" chip + booking-card inline validation; no submit/loading state on the hero itself |
| 2 | Match System / Real World | 3 | Natural French booking language ("Dès X DT/j"); decorative spine copy is noise |
| 3 | User Control and Freedom | 3 | Booking card clears/toggles cleanly; hero is navigational |
| 4 | Consistency and Standards | 2 | Dark cinematic glass/gradient world exists nowhere else on the site (editorial-monochrome light) |
| 5 | Error Prevention | 3 | Date min/max, past-pickup guard, disabled unavailable days, segmented constraints |
| 6 | Recognition Rather Than Recall | 3 | Dates, locations, CTA all visible |
| 7 | Flexibility and Efficiency | 3 | Fast search path + phone; no shortcuts (fine here) |
| 8 | Aesthetic and Minimalist Design | 1 | Grain + spotlight + parallax + grid + spine + 7 gradients + outline type + stats HUD + bounce cue |
| 9 | Error Recovery | 3 | Booking card shows plain-language inline errors |
| 10 | Help and Documentation | 2 | No contextual help on the hero; search is self-evident |
| **Total** | | **26/40** | **Acceptable (lower edge)** |

It *works* as a booking entry point. It fails as craft: the usability floor is fine, the aesthetic ceiling is the problem.

## Anti-Patterns Verdict

**Does this look AI-generated? Yes, without hesitation.**

**LLM assessment.** This is the car-rental first-order reflex: dark cinematic stage, spotlit car on a lit plate, cobalt key-light glow, "premium" chrome. Every AI "luxury car/tech" hero converges here. Worse, it's a pile-up of *effects that signal "designed"* rather than design decisions: film grain, a cursor-following spotlight, depth parallax, a hairline tech grid, mix-blend layers, an outline-stroke headline line, a gradient sweep, a vertical rotated "spine," a price count-up, a stats HUD, and a bouncing scroll cue. Any one might be a choice. Eleven at once is noise. And it contradicts the site's *own* committed identity (globals.css literally says "Ink on warm paper. One cobalt accent. No gradients. No floating orbs. No glass.") — so the hero reads as a different website glued to the top.

**Deterministic scan (manual; bundled `detect.mjs` was missing so it crashed on a real attempt).** Grep evidence against the absolute bans:
- **Em dashes ×2**, rendered and visible: `spine: "Location Premium — Tunisie — Est. 2019"`. Direct violation of the no-em-dash ban.
- **Glassmorphism ×2**: `backdrop-blur` on the info plate and the status chip.
- **Decorative gradients ×7**: radial/linear stage lighting, key-light, cursor spotlight, sweep highlight, plate fill.
- **Bounce motion ×1**: `animate-bounce` on the scroll cue (violates "no bounce").
- **mix-blend ×4**, **WebkitTextStroke ×1** (outline type), **pure-white rgba ×1**.

**Visual overlays.** Not available. The bundled detector is missing (no `detect.js` to inject), and the running dev server holds port 3000 so the preview harness could not attach a fresh tab. No user-visible overlay was produced; this verdict rests on source review + the grep scan + prior visual inspection of this exact hero.

## Overall Impression

The single biggest opportunity: **stop decorating and start committing.** The hero is doing eleven things to look expensive when the site already has a genuinely distinctive, cheaper-to-execute identity (warm paper, ink Fraunces, one cobalt mark, hairlines) sitting unused. Delete the effects, honor the system, and let one confident typographic idea plus the real car photo carry it. The booking card is the actual value; right now it's the quietest thing on a loud stage.

## What's Working

1. **The booking card as the primary action is the right instinct.** Dates + locations + search in the hero is exactly the conversion path a trust-first rental site (per PRODUCT.md) should lead with.
2. **The availability chip and price ("Dès 200 DT/j") give immediate, concrete system status** — real data, not decoration.
3. **Restraint in copy hierarchy is good underneath the noise**: kicker, headline, sub, CTA is a clean skeleton. The problem is everything layered on top of it, not the bones.

## Priority Issues

- **[P1] Category-reflex AI slop from decorative overload.** *Why it matters:* aesthetic scored 1/4; the CTA (booking card) is visually buried under grain, spotlight, parallax, grid, and glow, and the whole thing reads as generic-AI, undermining the "premium, trustworthy" goal in PRODUCT.md. *Fix:* remove grain, cursor spotlight, parallax, hairline grid, mix-blend layers, outline-stroke line, gradient sweep, stats HUD, and scroll cue. Keep headline, sub, CTA, one car image, one cobalt mark. *Command:* `/impeccable distill`.
- **[P1] Off-brand: the hero contradicts the site's living design system.** *Why it matters:* dark + glass + gradients appear nowhere else; consistency scored 2/4 and users feel they "walked into a different site" at the fold. *Fix:* rebuild on the actual tokens — warm paper, ink, cobalt accent, hairlines, tight radius — so the fold matches the rest of the page. *Command:* `/impeccable craft` (rebuild hero) or `/impeccable colorize`/`layout`.
- **[P1] Em-dash ban violated in shipped copy.** *Why it matters:* it's an absolute ban and it's rendered on screen (the vertical spine); it's also the clearest single "AI wrote this" tell. *Fix:* delete the spine element entirely (it's decoration), or rewrite without em dashes. *Command:* `/impeccable clarify`.
- **[P2] Absolute-ban effects: glassmorphism + bounce + gradient stack.** *Why it matters:* three separate banned patterns (glass ×2, `animate-bounce`, decorative gradients ×7) compound the slop verdict. *Fix:* solid surfaces with hairline borders instead of glass; remove the bounce cue; drop the decorative gradients. *Command:* `/impeccable polish`.
- **[P2] Stats HUD is the hero-metric cliché, and the scroll cue is filler.** *Why it matters:* "Fleet / Recent · Support / 24-7 · Response / <30min" plus "Défiler ↓" are template scaffolding that add height and noise without moving the user toward booking. *Fix:* cut both; if the claims matter, fold them into a dedicated trust row lower on the page. *Command:* `/impeccable distill`.

## Persona Red Flags

**Jordan (first-timer).** The visual noise makes the *first action* ambiguous: is the primary action the cobalt "Réservez maintenant" button, the "Découvrir la Tucson" link, or the booking card below? Three competing entry points at the fold. The bouncing arrow says "scroll" while the booking card says "act here" — mixed signals at the exact 5-second decision window.

**Casey (distracted mobile).** The parallax/spotlight/grain layers are pure cost on a mobile arrival (PRODUCT.md's core scenario: airport, one hand, possibly slow data) with zero benefit; pointer parallax doesn't even fire on touch. The primary booking action sits *below* a tall decorative headline + car panel, pushing the thumb-zone action further down the fold.

**Airport-arrival traveler (project-specific, from PRODUCT.md).** Someone who just landed wants "car, dates, go" in seconds. The hero foregrounds mood (cinematic stage) over utility; the actual date/location fields are the last thing revealed. Trust-first means phone + price + search *up front*, not after a count-up animation.

## Minor Observations

- Near-blacks (`#070708`, `#0d0d10`) tint toward blue-grey, not the brand hue; the system says tint neutrals toward brand. Minor, but it's why the dark feels generic-cool rather than branded.
- The outline-stroke headline line ("de la route,") reduces headline legibility for a decorative gain.
- `will-change: transform` is set on several always-on layers (glow, grid) that mostly idle — unnecessary compositor cost on mobile.
- Reduced-motion is partially honored (parallax/count-up gate on it) but the `animate-bounce` scroll cue keeps bouncing regardless.

## Questions to Consider

- What would a *confident* version look like, that trusts one idea instead of eleven effects?
- If the site's real identity is warm-paper editorial, why is its most important screen the one place that abandons it?
- Which single element, removed, would make the booking card the loudest thing on the fold?

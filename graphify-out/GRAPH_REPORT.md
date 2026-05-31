# Graph Report - .  (2026-05-31)

## Corpus Check
- 51 files · ~200,396 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 199 nodes · 375 edges · 12 communities (11 shown, 1 thin omitted)
- Extraction: 92% EXTRACTED · 7% INFERRED · 1% AMBIGUOUS · INFERRED: 26 edges (avg confidence: 0.75)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 11|Community 11]]

## God Nodes (most connected - your core abstractions)
1. `getSupabaseAdmin()` - 21 edges
2. `isAdminRequest()` - 16 edges
3. `sendReservationEmails()` - 9 edges
4. `computeQuote()` - 9 edges
5. `CarDetailPage()` - 8 edges
6. `verifyAdminSessionToken()` - 8 edges
7. `Car` - 8 edges
8. `POST()` - 7 edges
9. `isPickupInPast()` - 7 edges
10. `Reservation / Booking Flow` - 7 edges

## Surprising Connections (you probably didn't know these)
- `RootLayout Component` --implements--> `@theme Design Tokens`  [AMBIGUOUS]
  src/app/layout.tsx → DESIGN.md
- `Root Metadata Export` --references--> `Branding Constants Module`  [AMBIGUOUS]
  src/app/layout.tsx → DESIGN.md
- `Home Page Component` --conceptually_related_to--> `Reservation / Booking Flow`  [AMBIGUOUS]
  src/app/page.tsx → APP_DOCUMENTATION.md
- `Sitemap Generator` --references--> `Environment-Variable Configuration`  [AMBIGUOUS]
  src/app/sitemap.ts → DESIGN.md
- `Home Page Component` --implements--> `Car-Rental Product Concept`  [INFERRED]
  src/app/page.tsx → PRODUCT.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Reservation Booking Flow** — appdoc_booking_flow, appdoc_availability_counting, appdoc_atomic_booking, appdoc_pricing_tiers [INFERRED 0.75]
- **Security Model (RLS / Service-Role / Admin Auth)** — appdoc_rls, appdoc_service_role, appdoc_admin_auth, appdoc_atomic_booking [INFERRED 0.75]
- **Resalable Template via Branding Centralization** — template_resalable, design_palette_centralization, design_brand_constants, design_env_vars, design_theme_tokens [INFERRED 0.75]

## Communities (12 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.07
Nodes (22): navItems, BOOKING_TIME_SLOTS, CAR_CATEGORIES, DAYS_FR, FUEL_TYPES, MONTHS_FR, MONTHS_FR_SHORT, RESERVATION_STATUS_COLOR (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (20): DELETE(), Params, PATCH(), DELETE(), Params, PATCH(), GET(), Params (+12 more)

### Community 2 - "Community 2"
Cohesion: 0.13
Nodes (13): features, Home(), metadata, steps, testimonials, sitemap(), navLinks, generateMetadata() (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (16): AdminSessionPayload, constantTimeEqual(), createAdminSessionToken(), fromBase64Url(), importSecretKey(), signValue(), toBase64Url(), verifyAdminSessionToken() (+8 more)

### Community 4 - "Community 4"
Cohesion: 0.13
Nodes (22): Admin Authentication, Atomic Booking Transaction, Availability Counting, Reservation / Booking Flow, App Documentation Overview, Pricing Tiers, Row-Level Security (RLS), Service-Role Key Access (+14 more)

### Community 5 - "Community 5"
Cohesion: 0.23
Nodes (12): Props, CarDetailPage(), countReservationsForDate(), getDailyRateForDuration(), getDaysBetween(), getMatchingTierForDuration(), isDateUnavailable(), normalizePricingTiers() (+4 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (5): dmSans, metadata, spaceGrotesk, legalItems, navItems

### Community 7 - "Community 7"
Cohesion: 0.44
Nodes (9): computeQuote(), getDailyRateForDuration(), getDaysBetween(), getMatchingTierForDuration(), normalizePricingTiers(), parseDateOnly(), Quote, tiers (+1 more)

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (9): buildAdminHtml(), buildCustomerHtml(), buildEmailCopy(), createTransport(), EmailCopy, escapeHtml(), ReservationEmailPayload, ReservationEvent (+1 more)

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (6): Next.js Breaking-Changes Convention, AGENTS.md Project Guide, Read node_modules/next/dist/docs Before Coding, CLAUDE.md Project Instructions, graphify-out Knowledge Graph, Graphify Knowledge-Graph Workflow

## Ambiguous Edges - Review These
- `RootLayout Component` → `@theme Design Tokens`  [AMBIGUOUS]
  src/app/layout.tsx · relation: implements
- `Root Metadata Export` → `Branding Constants Module`  [AMBIGUOUS]
  src/app/layout.tsx · relation: references
- `Home Page Component` → `Reservation / Booking Flow`  [AMBIGUOUS]
  src/app/page.tsx · relation: conceptually_related_to
- `Sitemap Generator` → `Environment-Variable Configuration`  [AMBIGUOUS]
  src/app/sitemap.ts · relation: references

## Knowledge Gaps
- **42 isolated node(s):** `spaceGrotesk`, `dmSans`, `metadata`, `metadata`, `steps` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `RootLayout Component` and `@theme Design Tokens`?**
  _Edge tagged AMBIGUOUS (relation: implements) - confidence is low._
- **What is the exact relationship between `Root Metadata Export` and `Branding Constants Module`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Home Page Component` and `Reservation / Booking Flow`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Sitemap Generator` and `Environment-Variable Configuration`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `getSupabaseAdmin()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `isAdminRequest()` connect `Community 1` to `Community 3`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `verifyAdminSessionToken()` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
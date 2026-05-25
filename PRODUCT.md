Name: Fekra rent a car

Overview
--------
Fekra rent a car is a web application for renting vehicles in Tunisia. It provides a public-facing marketing site and vehicle catalog for customers, plus an admin panel for the business owner to manage cars, availability, and reservations.

Primary goals
-------------
- Convert site visitors into reservation requests quickly and confidently.
- Give the business owner clear, trustworthy tools to manage inventory, confirm bookings, and monitor occupancy/revenue.
- Minimize friction for customers (simple search, clear pricing, fast booking) while preventing overbooking and enabling operational follow-up.

Users
-----
- Customers: casual users booking short-term rentals. Use cases: airport pickups, city travel, business trips.
- Owner / Admin: business operator(s) who manage cars, confirm/cancel reservations, review revenue and availability.
- Support agents: staff responding to customer queries and assisting with bookings.

Register
--------
product

Tone & Brand
------------
- Tone: professional, friendly, reassuring. Clarity and trust above cleverness.
- Language: French (primary), concise copy, explicit CTAs and phone/WhatsApp hooks.

Anti-references
---------------
- Do not look like commodity SaaS dashboards with generic hero-metrics and overbearing KPI panels.
- Avoid aggressive gradient text or flashy decorative effects that undermine trust.

Strategic principles
--------------------
1. Trust-first UI — always show phone, clear pricing, and simple steps to reserve.
2. Operational clarity — make it trivial for an owner to see conflicts, capacity, and next actions.
3. Progressive complexity — customers see a streamlined flow; admins get powerful filters and bulk actions.
4. Mobile-first booking — many users will come from mobile devices arriving at airports.

Critical constraints
--------------------
- Supabase is the single source of truth for `cars` and `reservations`.
- Admin auth is cookie-based HMAC tokens and must stay compatible with middleware protections.
- Email notifications via Nodemailer; optional integrations (WhatsApp/SMS) are add-ons.

Open questions (for follow-up)
------------------------------
- Does the owner want integrated payments (pre-auth) or manual confirmation for bookings?
- Which phone/SMS provider should be used for WhatsApp/SMS notifications (Twilio, Vonage, other)?

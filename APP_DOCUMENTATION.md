# Royal Car - App Documentation

## 1. What This App Is

Royal Car is a car rental web application for Tunisia.

It has two main parts:

1. A public website where customers can browse cars, view details, and make reservations.
2. An admin dashboard where staff can manage cars and reservations.

The app is built with a premium UI style: dark navy and emerald colors, rounded cards, soft shadows, smooth hover states, and a minimalist luxury look.

## 2. Stack

- Next.js 16 with the App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Supabase for backend data storage and queries
- next/font for Google fonts

### Fonts

- Heading font: Poppins
- Body font: Open Sans

## 3. Project Purpose

The application helps users:

- Browse available rental cars
- Filter cars by category, transmission, fuel type, and price
- Open a detailed car page
- Choose reservation dates
- Submit a booking request

It also helps administrators:

- View reservations and their statuses
- Confirm or cancel reservations
- Manage the car inventory
- Toggle availability and featured status

## 4. Main Routes

### Public Routes

- `/` - Home page
- `/voitures` - Car listing page
- `/voitures/[id]` - Car detail page

### Admin Routes

- `/admin` - Admin dashboard
- `/admin/voitures` - Car management page
- `/admin/reservations` - Reservation management page

## 5. Page Overview

### Home Page

File: `src/app/page.tsx`

The home page includes:

- Hero section with a strong call to action
- Stats cards for fleet size, support, rating, and cities served
- Featured cars section
- How-it-works section
- Premium CTA section
- Contact section
- Privacy and terms sections

The page uses custom SVG icons from `public/icons` for the stats cards.

### Car Listing Page

File: `src/app/voitures/page.tsx`

This page shows the car catalog with filters:

- Category
- Transmission
- Fuel type
- Maximum price

It displays car cards with:

- Image
- Brand and model
- Category label
- Price per day
- Availability badge

### Car Detail Page

File: `src/app/voitures/[id]/page.tsx`

This page is the detailed booking view for a single car.

It includes:

- Large car hero image
- Car specs and features
- Availability calendar / date selection logic
- Reservation form
- Booking confirmation modal
- WhatsApp contact button

### Admin Dashboard

File: `src/app/admin/page.tsx`

This page gives a summary of the system.

It shows:

- Total active rentals
- Pending reservations
- Available vehicles
- Confirmed revenue
- Calendar view of reservations
- Recent reservations list

### Admin Car Management

File: `src/app/admin/voitures/page.tsx`

This page lets staff manage vehicles.

It supports:

- Adding a car
- Editing a car
- Deleting a car
- Toggling availability
- Toggling featured status
- Uploading and removing images

### Admin Reservations

File: `src/app/admin/reservations/page.tsx`

This page manages bookings.

It supports:

- Filtering reservations by status
- Viewing reservation details
- Confirming a reservation
- Cancelling a reservation
- Restoring a cancelled reservation
- Deleting a reservation
- Contacting the customer by WhatsApp

## 6. UI / Design System

The app was redesigned with a premium visual system.

### Main colors

- Navy: `#0A102E`
- Emerald: `#216844`
- Slate background and muted text tones

### Styling principles

- Rounded corners, mostly `rounded-2xl` and `rounded-3xl`
- Soft shadows instead of hard borders
- Strong spacing and hierarchy
- Smooth transitions and hover states
- Premium gradient backgrounds in key areas

### Reusable UI components

- `src/components/ui/Button.tsx`
- `src/components/ui/Card.tsx`
- `src/components/ui/Input.tsx`

### Shared layout components

- `src/components/Navbar.tsx`
- `src/components/Footer.tsx`
- `src/components/ConditionalFooter.tsx`
- `src/components/MotionProvider.tsx`

## 7. Layout Behavior

File: `src/app/layout.tsx`

The root layout:

- Loads Poppins and Open Sans
- Applies the global design system
- Wraps the app in `MotionProvider`
- Uses `ConditionalFooter` so the footer does not appear on admin pages

Admin pages use their own layout structure in `src/app/admin/layout.tsx`.

## 8. Data Layer

The app uses Supabase as its backend.

### Supabase client

File: `src/lib/supabase.ts`

Environment variables required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Data helpers

File: `src/lib/cars.ts`

Available helper functions:

- `getCars()` - fetches all cars
- `getCarById(id)` - fetches one car by ID
- `getUnavailableDates(carId)` - fetches reservation date ranges for a car

## 8.1 Email Notifications

Reservation submissions now trigger an automatic email notification through the API route:

- `src/app/api/reservations/notify/route.ts`

This route uses SMTP via Nodemailer.

Required environment variables:

- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM` - optional, falls back to `EMAIL_USER`
- `NOTIFY_TO` - optional, defaults to `EMAIL_USER`

Behavior:

- Sends an admin email every time a reservation is created successfully.
- Sends a customer confirmation email if the booking form contains an email address.
- Keeps the reservation save flow working even if the notification call fails on the client, but the server route must be configured for sending to succeed.

## 8.2 Admin Authentication

The admin panel is protected by a session cookie and an admin login page.

Auth files:

- `middleware.ts` - protects `/admin/*` routes
- `src/app/admin/login/page.tsx` - admin login screen
- `src/app/api/admin/login/route.ts` - creates the admin session cookie
- `src/app/api/admin/logout/route.ts` - clears the admin session cookie
- `src/lib/admin-auth.ts` - shared session token helpers

Required environment variables:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Behavior:

- Unauthenticated users visiting `/admin/*` are redirected to `/admin/login`.
- Authenticated users visiting `/admin/login` are redirected to `/admin`.
- Session cookies are HTTP-only and signed with `ADMIN_SESSION_SECRET`.
- The logout button in the admin sidebar clears the cookie and returns to the login page.

## 9. Data Models

File: `src/lib/types.ts`

### Car

Important fields:

- `id`
- `name`
- `brand`
- `category`
- `price_per_day`
- `transmission`
- `fuel_type`
- `seats`
- `features`
- `images`
- `is_available`
- `is_featured`
- `description`
- `created_at`

### Reservation

Important fields:

- `id`
- `car_id`
- `client_name`
- `client_phone`
- `client_email`
- `start_date`
- `end_date`
- `total_price`
- `status`
- `notes`
- `created_at`

Reservation status values:

- `pending`
- `confirmed`
- `cancelled`

## 10. Static Assets

The app uses custom SVG icons stored in `public/icons`.

Current icons:

- `public/icons/car.svg`
- `public/icons/phone.svg`
- `public/icons/star.svg`
- `public/icons/location.svg`

These are used in the home page stats section.

## 11. Motion / Reveal System

File: `src/components/MotionProvider.tsx`

The app uses an IntersectionObserver to reveal elements as they enter the viewport.

Elements can use:

- `data-reveal`
- `data-reveal="left"`
- `data-reveal="right"`

The reveal animation is defined in `src/app/globals.css`.

## 12. Important Notes For Another AI

If you are continuing development on this app, keep these rules in mind:

1. Preserve the existing routing structure.
2. Refactor in place instead of creating duplicate components.
3. Keep the premium navy/emerald visual system consistent.
4. Avoid breaking Supabase queries or table field names.
5. Respect the current client-side admin behavior and conditional footer logic.
6. Use the existing reusable UI components before adding new ones.

## 13. Short AI Handoff Summary

Royal Car is a premium Next.js + Supabase rental platform for Tunisia. It includes a public car browsing and booking experience plus an admin dashboard for managing cars and reservations. The app uses a blue and gold design system, reusable UI components, motion-based reveal animations, custom SVG stat icons, and Supabase tables for `cars` and `reservations`.

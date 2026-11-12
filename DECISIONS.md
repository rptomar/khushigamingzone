# DECISIONS.md — Architecture & Technical Choices

This document logs all key design, engineering, and architectural decisions for the **Khushi Gaming Zone** SaaS platform.

---

## 1. Multi-Tenancy & Tenant Isolation
- **Tenant Scope Enforcement:** All tenant-scoped database queries go through `lib/db/scoped.ts` (`getScopedDb(tenantId)`). The tenant ID is never trusted from the client; it is cryptographically verified from the authenticated JWT session or kiosk device token.
- **Hierarchy:** Platform (Reseller) -> Tenant (Gaming Zone) -> Outlet (Branch) -> Resource (Table/Station) -> Device (Kiosk Tablet).
- **Tenant #1 Seed:** "Khushi Gaming Zone HQ" serves as the primary tenant and default reseller.

## 2. Pluggable Providers & Mock-First Dev Architecture
- **Mock Mode by Default:** `OTP_PROVIDER=mock`, `WHATSAPP_PROVIDER=mock`, `PAYMENT_PROVIDER=mock`.
- **Zero External API Dependency:** The application can be completely booted, tested, demonstrated, and seeded without requiring live third-party keys (MSG91, Meta WhatsApp, Razorpay, Cloudinary).
- **Production Interfaces:** Clean TypeScript interfaces in `lib/providers/` (`IOtpProvider`, `IWhatsAppProvider`, `IPaymentProvider`, `IStorageProvider`) with fully functional Mock implementations and robust production stubs for Razorpay (dynamic QR, webhook signature validation), Meta/Interakt WhatsApp, MSG91 OTP, and Cloudinary signed upload.

## 3. Database & Money Storage
- **Neon Postgres + Drizzle ORM:** Schema designed with strict typing, foreign keys, and indexes on `(tenant_id, created_at)`.
- **Integer Paise Representation:** All currency amounts (`rate_paise`, `min_charge_paise`, `amount_paise`, `subtotal`, `gst`, `total`) are strictly stored as 64-bit integer paise (1 INR = 100 paise) to prevent IEEE floating-point drift.
- **Append-Only Auditing:** Financial invoices and payment records are never hard-deleted; reversals and void statuses with required audit reasons are used instead.
- **Timezone Standard:** Timestamps stored in UTC (`timestamp({ withTimezone: true })`); business day calculations and displays adhere to `Asia/Kolkata`.

## 4. Anti-Fraud & Business Logic
- **Server-Authoritative Clock:** Kiosk tablets display an elapsed timer and estimated amount derived purely from the server's `started_at` timestamp. Client system clocks are never trusted for billing.
- **Session State Machine:** Pure state machine in `lib/domain/session-machine.ts`: `idle -> active <-> paused -> stopping -> billed -> paid`. Illegal transitions throw domain errors.
- **Audit & Anomaly Triggers:** Any manual start (`started_by: staff`), pause, time override, comp, void, or cash discount creates an immutable entry in `session_events`, an `audit_log` row, and flags an `alert` if thresholds are exceeded.
- **Occupancy Anomaly Webhook:** `/api/occupancy` ready for smart power sensor integration ("table drawing power with no active session").

## 5. UI/UX & Design System
- **Luxury Esports Aesthetic:** Deep near-black background (`#07070B`), electric violet (`#8B5CF6`) to cyan (`#06B6D4`) primary accents, warm gold (`#F59E0B`) for revenue and money moments.
- **Typography:** `Space Grotesk` (headings & display), `Inter` (body & controls), `JetBrains Mono` (live timers, tabular numbers & monetary values).
- **Live Board Updates:** Real-time dashboard updates via short polling (3 seconds) centralized in the `useLive()` hook, avoiding fragile WebSockets in serverless Vercel environments.

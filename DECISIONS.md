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

## 6. PDF Invoices, Payments & Notification Delivery
- **PDF Generation via `@react-pdf/renderer`:** PDF generation runs on the Node.js runtime using `@react-pdf/renderer` (`InvoiceDocument`), streaming directly from `/api/invoices/[invoiceId]/pdf` to eliminate heavy headless browser / Puppeteer dependencies and stay well within Vercel's 50MB function bundle limit.
- **Dynamic UPI Payment Links:** Generates `upi://pay?pa=...` URIs with exact invoice number (`tr`), amount, and merchant name, encoded into high-density 2D QR codes via `qrcode`.
- **Payment Webhook Idempotency:** Razorpay webhook handler at `/api/webhooks/razorpay` verifies HMAC SHA256 signatures, checks idempotency against the invoice state, updates session and resource availability, logs audit records, and automatically triggers asynchronous WhatsApp invoice dispatch.
- **WhatsApp Notification Service:** Pluggable notification service supporting `Mock` (in-memory queue with audit logs) and `Meta/Interakt` Cloud API templates (`gaming_invoice_v1`), automatically attaching the PDF invoice URL.

## 7. Owner Telemetry & Anti-Theft Anomaly Engine
- **Live Executive Telemetry:** Executive dashboard calculates multi-period revenues, live arena occupancy, active VIP members, and 7-day revenue velocity with Recharts.
- **Smart-Plug IoT Sensor Integration (`/api/occupancy`):** Ingests power wattage telemetry from smart plugs. If unmetered power consumption (> 25W) is detected while a station is marked available or without an active session, a `critical` anti-theft anomaly is automatically logged to alert the owner of off-the-books play.
- **Vercel Cron Anomaly Scanner (`/api/cron/anomalies`):** Scans for sessions running over 4 hours, delayed stop request confirmations (> 10m), and suspicious clusters of void invoices. Secured via `CRON_SECRET`.
- **Physical Cash Drawer Reconciliation:** Dedicated audit screen compares expected cash from registered receipts against physical currency denominations counted by management, creating immutable variance logs in `audit_log` and triggering shortage alerts if theft is suspected.

## 8. Customer CRM, VIP Memberships & Prepaid Gaming Wallets
- **Tiered VIP Memberships (`/owner/memberships`):** Customers purchase hour bundles (e.g. 30-Hour VIP Gold Snooker Pass for ₹6,000, saving 33%). When starting play on the table kiosk, players can pick their active VIP Pass, and hours are automatically deducted per-minute rather than incurring hourly bills.
- **Expiring Pass Warnings:** System flags passes expiring within 7 days to trigger automated retention offers at reception.
- **Prepaid Gaming Wallets (`/owner/customers`):** Every customer profile maintains a prepaid wallet float allowing instant cashless checkout, store credit refunds, and bonus promotional balances.
- **Customer Lifetime Value (LTV) Intelligence:** Centralized player CRM tracks total historical gaming spend, visit frequencies, preferred stations, and anti-theft session histories.

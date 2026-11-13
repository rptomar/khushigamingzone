# 🎱 Ps07 Gaming Arena — Premium Multi-Tenant Gaming Zone OS

> **The Automated Gaming Zone Operating System** that turns idle tables into revenue, replaces manual notebooks, and eliminates staff cash pocketing with touch kiosks, OTP logins, dynamic UPI QR billing, and remote owner telemetrics.

Built in **ONE Next.js 15 project** (frontend + backend in the same repo, no separate server), deployable directly to Vercel and Neon Postgres.

---

## 🌟 1. Executive Summary & Value Proposition

In typical gaming lounges (snooker, pool, PS5, table tennis, arcade), owners lose between **₹45,000 and ₹1,20,000 every month** because play time is recorded manually in a paper notebook:
- Staff secretly skip recording games for friends or cash walk-ins.
- Staff pocket cash payments and write reduced play durations.
- Unbilled "ghost games" occur after hours or when the owner is away.
- Cluttered notebooks cause billing disputes and slow down table turnaround.

**Ps07 Gaming Arena OS permanently solves this:**
1. **Touchscreen Table Kiosks:** Every station has a tablet in kiosk mode. Customers log in with **Phone Number + OTP**, choose an **Hourly** or **VIP Membership Pass**, and start play.
2. **Server-Authoritative Metering:** The stopwatch bill counts up strictly using server UTC time. System clocks on tablets cannot be tampered with.
3. **Audible Reception Desk:** When the player taps "End Session", the reception live board alerts staff with an audio chime to confirm stopping.
4. **Instant Dynamic UPI QR Code:** Reception confirmation generates an exact UPI QR code (`upi://pay?pa=...`) on the table screen. Payment is detected automatically or marked by reception with full audit logging.
5. **Electronic PDF Invoices & WhatsApp Delivery:** Immediately streams a professional GST invoice PDF directly to the customer's WhatsApp.
6. **Executive Owner Telemetry:** The owner monitors live arena occupancy, table status glows, cash vs UPI collections, and automated anti-theft anomaly alerts on their mobile phone from anywhere in the world.
7. **Master Reseller Engine:** Ps07 Gaming Arena acts both as Flagship Tenant #1 and as the master SaaS reseller, capable of onboarding client gaming clubs and billing them monthly or yearly.

---

## 🏗️ 2. Tech Stack

- **Framework:** Next.js 15 (App Router, Strict TypeScript, Server Actions & Route Handlers)
- **Database & ORM:** Neon Serverless Postgres + Drizzle ORM + Drizzle Kit Migrations
- **Styling & UI:** Tailwind CSS v4, shadcn/ui primitives, Framer Motion, Lucide React, Sonner Toasts
- **Real-Time Telemetry:** Centralized `useLive()` hook with 3-second short polling (fully serverless-compatible, zero WebSocket fragility on Vercel)
- **Analytics & Visualizations:** Recharts (Area charts, Bar distributions, Donut share charts)
- **PDF Generation:** `@react-pdf/renderer` running on Node.js runtime (streams directly without Puppeteer bundle limits)
- **UPI QR Codes:** High-density 2D QR code generation via `qrcode` package with UPI deep linking
- **Authentication & RBAC:** Custom JWT session cookies via `jose` and `bcryptjs` with 7 hierarchical roles
- **Pluggable Mock-First Architecture:** Pluggable interfaces for OTP (MSG91), Payments (Razorpay), WhatsApp (Meta/Interakt), and Cloud Storage (Cloudinary) with zero external keys required for local demos.

---

## 🏛️ 3. Multi-Tenant Architecture & Roles

```mermaid
graph TD
    Platform["Platform (Super Admin)"] --> Reseller["Reseller (Ps07 HQ)"]
    Reseller --> Tenant1["Tenant #1: Ps07 Gaming Arena Flagship"]
    Reseller --> Tenant2["Tenant #2: Velocity Cue Sports"]
    Reseller --> Tenant3["Tenant #3: Apex Snooker Lounge"]
    Tenant1 --> Outlet1["Mall Outlet #1: Nexus Mall Flagship"]
    Outlet1 --> Resource1["Table 1: Riley Aristocrat Snooker"]
    Outlet1 --> Resource2["Table 3: English 8-Ball Pool"]
    Outlet1 --> Resource3["Station 6: PS5 Pro Lounge"]
    Resource1 --> Device1["Kiosk Screen (kiosk-snooker-1)"]
```

### Security & Central Scoping Layer (`lib/db/scoped.ts`)
Tenant isolation is enforced in **ONE central data-access layer** (`getScopedDb(tenantId)`). The tenant ID is never trusted from client inputs; it is cryptographically derived from the authenticated JWT session or kiosk device token.

### Role-Based Access Control Matrix (`lib/rbac.ts`)
| Capability | `super_admin` | `reseller` | `owner` | `manager` | `receptionist` | `device` |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Onboard SaaS Tenants | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configure Pricing & Peak Surge | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Resolve Anti-Theft Anomalies | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lock Daily Cash Drawer Reconciliation | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Confirm Stop & Record Payment | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Start Walk-in (Audit Flagged) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Table Kiosk Self-Service | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🚀 4. Quickstart Guide (Zero-Config Local Demo)

The application works out of the box in **Mock Mode** with **ZERO external API keys needed**.

### Step 1: Clone & Install Dependencies
```bash
git clone https://github.com/your-org/khushigamingzone.git
cd khushigamingzone
pnpm install
```

### Step 2: Environment Setup
```bash
cp .env.example .env.local
```
*(Default values in `.env.example` run in full mock mode with pre-seeded data).*

### Step 3: Run Unit Tests
```bash
pnpm test
```
*(Runs 12 unit tests verifying pricing calculations, peak surge multipliers, and state machine transitions).*

### Step 4: Launch Development Server
```bash
pnpm dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🗺️ 5. Application Route Directory

| Route | View | Description |
| :--- | :--- | :--- |
| **`/`** | **Marketing Landing Page** | Startup-grade site with interactive live table demo, leakage ROI calculator, and pricing. |
| **`/login`** | **Staff & Owner Auth** | Split-screen login with 1-click demo accounts for Owner, Manager, and Receptionist. |
| **`/kiosk/[deviceToken]`** | **Table Kiosk Screen** | Touch-first tablet UI: Phone + OTP, Plan picker, Live stopwatch ring, Stop request, and UPI QR bill. *(Example: `/kiosk/kiosk-snooker-1`)* |
| **`/reception`** | **Reception Live Desk** | Staff board with real-time table status cards, audible stop chime, walk-in start modal, and payment logger. |
| **`/owner`** | **Executive Telemetry** | Owner dashboard with multi-period revenue KPI cards, live occupancy %, Recharts analytics, and floor map. |
| **`/owner/sessions`** | **Sessions Audit Ledger** | Full tamper-proof session history with phone search, status filters, and **CSV Export**. |
| **`/owner/alerts`** | **Anti-Theft Shield** | Real-time anomaly center (power draws, long sessions, manual start spikes) with simulator controls. |
| **`/owner/reconciliation`**| **Cash Drawer Audit** | Compares expected cash against physically counted denominations (₹500, ₹200, ₹100, etc.) with lock sign-off. |
| **`/owner/customers`** | **Customer CRM & Wallets** | Lifetime value (LTV), visit frequencies, preferred games, and instant prepaid wallet top-up modal. |
| **`/owner/memberships`** | **VIP Passes & Hours** | Issue recurring packages (e.g. VIP Gold 30 Hours), remaining hours progress bars, and expiring pass alerts. |
| **`/owner/settings`** | **Lounge Configuration** | Table & station editor, Kiosk QR pairing download, pricing plans & peak surge hour builder, UPI VPA & GSTIN. |
| **`/platform`** | **Reseller & Fleet Portal**| Multi-tenant manager: onboard client clubs, manage MRR/ARR SaaS revenue, and remote table inspection. |
| **`/api/invoices/[id]/pdf`**| **Dynamic PDF Invoices**| Streams formatted GST invoices via `@react-pdf/renderer`. |
| **`/api/occupancy`** | **IoT Sensor Webhook** | Ingests smart-plug wattage. Flags theft if table draws power without an active session. |
| **`/api/webhooks/razorpay`**| **Razorpay Webhook** | HMAC-verified idempotent webhook auto-marking invoices paid and dispatching WhatsApp invoices. |
| **`/api/cron/anomalies`** | **Vercel Cron Scanner** | Automated background fraud scanner secured via `CRON_SECRET`. |

---

## 🎬 6. Step-by-Step Demonstration Script (Live QA)

Follow this 5-minute flow to demonstrate the full end-to-end OS:

1. **Visit Landing Page (`/`):**
   - Scroll to the **Interactive Demo** on the homepage.
   - Click "Tap to Start Session", observe the running timer and bill calculation, then click "Request End of Session" to generate a live UPI QR code.
   - Adjust the **ROI Leakage Calculator** to show how much money is lost without automated kiosks.

2. **Open Table Kiosk Screen (`/kiosk/kiosk-snooker-1`):**
   - Click "Tap to Start".
   - Enter mobile number `9820012345` using the on-screen numeric touch keypad.
   - Enter the displayed Dev OTP `428951` in the 6 auto-advancing boxes.
   - Pick the **Hourly Standard Plan (₹300/hr)** and tap "Confirm & Start Game".
   - Watch the huge animated timer ring begin ticking with the real-time bill counting up.

3. **Open Reception Live Desk in a Split Tab (`/reception`):**
   - Notice **Table 1** instantly reflects the active status with player phone number and elapsed counter.
   - On the Kiosk tab, click "End Session" -> "Yes, End Game".
   - Notice the Reception desk immediately receives an **audible synthesizer chime** and an alert banner: *"Table 1 is waiting for stop confirmation"*.
   - Click **Confirm Stop & Generate Bill** on the reception card.

4. **Dynamic UPI Payment & Celebration (`/kiosk/kiosk-snooker-1`):**
   - Return to the Kiosk tab: the invoice breakdown and dynamic UPI QR code are now visible with a live payment countdown.
   - Click the dev helper button **"Simulate Instant UPI Payment (Dev)"**.
   - Watch the kiosk trigger a full-screen **canvas confetti celebration** and "Thank You for Gaming" screen!
   - In server logs, observe the WhatsApp dispatch sending the generated invoice PDF link to the customer.

5. **Inspect Executive Owner Hub (`/owner`):**
   - Log in as Owner (`owner@ps07gaming.com` / `Ps07Admin@2026`).
   - View Today's revenue updated with the completed session and cash/UPI split.
   - Check the **Interactive Floor Map** and 7-day revenue trend chart.

6. **Test Anti-Theft Anomaly Detection (`/owner/alerts`):**
   - Click **"Simulate Smart-Plug Anomaly"**.
   - An instant `CRITICAL` anti-theft alert appears: *"Table 1 is drawing 165W of power, but NO active kiosk session is registered! Staff or customer suspected of playing unmetered."*
   - Click **Audit & Resolve** to review and clear the alert.

7. **Perform Shift-End Cash Reconciliation (`/owner/reconciliation`):**
   - View expected system cash collected today (e.g. ₹4,200).
   - Enter counted currency notes (e.g. 8x ₹500, 2x ₹100).
   - Verify the green **"Drawer Perfectly Balanced"** badge and click **"Lock Daily Cash Audit"**.

8. **Explore Reseller Platform (`/platform`):**
   - View the multi-tenant fleet of 5 gaming zones across 35 tables.
   - Click **"Onboard New Gaming Lounge"**, enter a client lounge name and slug, and watch the reseller MRR increase immediately.

---

## 🚢 7. Production Deployment to Vercel & Neon Postgres

### 1. Database Provisioning
1. Create a free serverless PostgreSQL database at [Neon.tech](https://neon.tech).
2. Copy your connection string: `postgresql://user:password@ep-xyz.neon.tech/neondb?sslmode=require`.

### 2. Push Migrations & Seed Data
```bash
# Push Drizzle schema to Neon Postgres
DATABASE_URL="your-neon-connection-string" pnpm db:push

# Run Master Seed script
DATABASE_URL="your-neon-connection-string" pnpm db:seed
```

### 3. Deploy to Vercel
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Add the environment variables from `.env.example`:
   - `DATABASE_URL`: Your Neon Postgres connection string
   - `JWT_SECRET`: A secure 32+ character string
   - `CRON_SECRET`: A secret string for Vercel Cron jobs
   - `APP_URL`: Your Vercel production URL (e.g. `https://ps07gaming.vercel.app`)
   - `OTP_PROVIDER`: `mock` (or `msg91` in production)
   - `PAYMENT_PROVIDER`: `mock` (or `razorpay` in production)
   - `WHATSAPP_PROVIDER`: `mock` (or `meta` in production)
3. Deploy! Vercel automatically detects Next.js 15 and configures `vercel.json` cron jobs.

---

## 🔒 8. Security & Anti-Fraud Architecture

- **Server-Side Authorization:** Every server action and API route checks user roles and permissions via `lib/rbac.ts`.
- **JWT in httpOnly Secure Cookies:** Authentication tokens are stored with `httpOnly: true`, `sameSite: "lax"`, and `secure: true`.
- **Kiosk Device Tokens:** Every tablet kiosk uses a cryptographically hashed device token bound exclusively to one resource ID. Revoking a token in settings immediately disables that kiosk tablet.
- **HMAC SHA-256 Webhooks:** Real Razorpay webhooks are verified with timing-safe HMAC SHA-256 signatures before processing.
- **Strict Integer Currency Arithmetic:** Floating-point currency values are strictly forbidden throughout the entire codebase. All monetary values are processed and stored as 64-bit integer paise (1 INR = 100 paise) with zero roundoff errors.

---

## 📜 9. License & Credits

Built with precision for **Ps07 Gaming Arena** — Flagship Lounge & Smart Gaming Zone Operating System.
Designed and engineered for world-class speed, anti-fraud reliability, and seamless multi-tenant scalability.

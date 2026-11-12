import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ==========================================
// 1. Resellers (Platform & White-label Partners)
// ==========================================
export const resellers = pgTable("resellers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  commissionRate: integer("commission_rate").default(0), // percentage
  status: varchar("status", { length: 32 }).default("active").notNull(), // active, suspended
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. Tenants (Gaming Zone Businesses)
// ==========================================
export const tenants = pgTable("tenants", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  resellerId: varchar("reseller_id", { length: 36 }).references(() => resellers.id),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  logoUrl: text("logo_url"),
  brandColor: varchar("brand_color", { length: 32 }).default("#8B5CF6"),
  status: varchar("status", { length: 32 }).default("active").notNull(), // active, suspended, trial
  planId: varchar("plan_id", { length: 36 }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  upiVpa: varchar("upi_vpa", { length: 128 }).default("khushigaming@upi"),
  gstin: varchar("gstin", { length: 32 }),
  gstRate: integer("gst_rate").default(18).notNull(), // 18% default GST
  invoicePrefix: varchar("invoice_prefix", { length: 16 }).default("KGZ").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("tenants_slug_idx").on(t.slug),
  index("tenants_reseller_idx").on(t.resellerId),
]);

// ==========================================
// 3. Outlets (Branches / Mall Locations)
// ==========================================
export const outlets = pgTable("outlets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("outlets_tenant_idx").on(t.tenantId),
]);

// ==========================================
// 4. Users (Staff, Managers, Owners, Admins)
// ==========================================
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).references(() => tenants.id),
  role: varchar("role", { length: 32 }).notNull(), // super_admin, reseller, owner, manager, receptionist
  outletIds: jsonb("outlet_ids").$type<string[]>().default([]),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  passwordHash: text("password_hash").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("users_tenant_role_idx").on(t.tenantId, t.role),
  index("users_email_idx").on(t.email),
]);

// ==========================================
// 5. Resource Types (Snooker, Pool, PS5, etc.)
// ==========================================
export const resourceTypes = pgTable("resource_types", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  code: varchar("code", { length: 64 }).notNull(), // snooker, pool, ps5, table_tennis, carrom, arcade, other
  name: varchar("name", { length: 128 }).notNull(),
  icon: varchar("icon", { length: 64 }).default("Gamepad2").notNull(),
  color: varchar("color", { length: 32 }).default("#8B5CF6").notNull(),
  active: boolean("active").default(true).notNull(),
}, (t) => [
  index("resource_types_tenant_idx").on(t.tenantId),
]);

// ==========================================
// 6. Resources (Tables, Stations, Booths)
// ==========================================
export const resources = pgTable("resources", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  outletId: varchar("outlet_id", { length: 36 }).notNull().references(() => outlets.id),
  typeId: varchar("type_id", { length: 36 }).notNull().references(() => resourceTypes.id),
  name: varchar("name", { length: 128 }).notNull(), // e.g., "Snooker Table 1", "PS5 Station 3"
  status: varchar("status", { length: 32 }).default("available").notNull(), // available, running, stopping, awaiting_payment, maintenance
  hourlyRatePaise: integer("hourly_rate_paise").notNull().default(30000), // ₹300/hr = 30000 paise
  currentSessionId: varchar("current_session_id", { length: 36 }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("resources_tenant_idx").on(t.tenantId),
  index("resources_outlet_status_idx").on(t.outletId, t.status),
]);

// ==========================================
// 7. Devices (Screen / Tablet Kiosk Hardware)
// ==========================================
export const devices = pgTable("devices", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  resourceId: varchar("resource_id", { length: 36 }).notNull().references(() => resources.id).unique(),
  tokenHash: varchar("token_hash", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 128 }).notNull(), // e.g. "Tablet - Table 1"
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("devices_tenant_idx").on(t.tenantId),
  index("devices_resource_idx").on(t.resourceId),
]);

// ==========================================
// 8. Customers
// ==========================================
export const customers = pgTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  phone: varchar("phone", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).default("Guest Gamer").notNull(),
  email: varchar("email", { length: 255 }),
  totalSpentPaise: integer("total_spent_paise").default(0).notNull(),
  visits: integer("visits").default(0).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("customers_tenant_phone_idx").on(t.tenantId, t.phone),
  index("customers_tenant_spent_idx").on(t.tenantId, t.totalSpentPaise),
]);

// ==========================================
// 9. Pricing Plans
// ==========================================
export const pricingPlans = pgTable("pricing_plans", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  resourceTypeId: varchar("resource_type_id", { length: 36 }).references(() => resourceTypes.id),
  name: varchar("name", { length: 128 }).notNull(),
  type: varchar("type", { length: 32 }).default("hourly").notNull(), // hourly, per_minute, per_frame, package, membership
  ratePaise: integer("rate_paise").notNull(), // e.g. 30000 = ₹300
  minChargePaise: integer("min_charge_paise").default(5000).notNull(), // e.g. ₹50 min charge
  billingIncrementMin: integer("billing_increment_min").default(15).notNull(), // round to nearest 15 mins
  rounding: varchar("rounding", { length: 16 }).default("nearest").notNull(), // up, nearest, none
  graceMin: integer("grace_min").default(3).notNull(), // 3 mins grace before billing next block
  peakRules: jsonb("peak_rules").$type<{
    enabled: boolean;
    peakMultiplier: number;
    startHour: number; // e.g. 18 (6 PM)
    endHour: number;   // e.g. 23 (11 PM)
    days: number[];    // 0=Sun, 6=Sat
  }>().default({ enabled: false, peakMultiplier: 1.25, startHour: 18, endHour: 23, days: [5, 6, 0] }),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("pricing_plans_tenant_idx").on(t.tenantId),
]);

// ==========================================
// 10. Memberships (Subscriptions / Pre-bought Hours)
// ==========================================
export const memberships = pgTable("memberships", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  customerId: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  planId: varchar("plan_id", { length: 36 }).notNull().references(() => pricingPlans.id),
  name: varchar("name", { length: 128 }).notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).defaultNow().notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  includedMinutes: integer("included_minutes").default(1200).notNull(), // 20 hours = 1200 min
  usedMinutes: integer("used_minutes").default(0).notNull(),
  status: varchar("status", { length: 32 }).default("active").notNull(), // active, expired, cancelled
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("memberships_tenant_customer_idx").on(t.tenantId, t.customerId),
  index("memberships_status_idx").on(t.status),
]);

// ==========================================
// 11. Wallets & Transactions (Prepaid balance)
// ==========================================
export const wallets = pgTable("wallets", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  customerId: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id).unique(),
  balancePaise: integer("balance_paise").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("wallets_tenant_customer_idx").on(t.tenantId, t.customerId),
]);

export const walletTransactions = pgTable("wallet_transactions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  walletId: varchar("wallet_id", { length: 36 }).notNull().references(() => wallets.id),
  amountPaise: integer("amount_paise").notNull(),
  type: varchar("type", { length: 16 }).notNull(), // credit, debit
  description: text("description"),
  referenceId: varchar("reference_id", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("wallet_tx_wallet_idx").on(t.walletId),
]);

// ==========================================
// 12. Sessions (Play Sessions at Tables)
// ==========================================
export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  outletId: varchar("outlet_id", { length: 36 }).notNull().references(() => outlets.id),
  resourceId: varchar("resource_id", { length: 36 }).notNull().references(() => resources.id),
  customerId: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  planId: varchar("plan_id", { length: 36 }).references(() => pricingPlans.id),
  status: varchar("status", { length: 32 }).default("active").notNull(), // active, paused, stopping, billed, paid
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  pausedTotalSec: integer("paused_total_sec").default(0).notNull(),
  lastPausedAt: timestamp("last_paused_at", { withTimezone: true }),
  startedBy: varchar("started_by", { length: 32 }).default("customer").notNull(), // customer, staff
  staffUserId: varchar("staff_user_id", { length: 36 }).references(() => users.id),
  amountPaise: integer("amount_paise").default(0).notNull(),
  stopRequestedAt: timestamp("stop_requested_at", { withTimezone: true }),
  stopConfirmedAt: timestamp("stop_confirmed_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("sessions_tenant_created_idx").on(t.tenantId, t.createdAt),
  index("sessions_resource_status_idx").on(t.resourceId, t.status),
  index("sessions_outlet_idx").on(t.outletId),
]);

// ==========================================
// 13. Session Events (Append-only Audit Trail)
// ==========================================
export const sessionEvents = pgTable("session_events", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => sessions.id),
  eventType: varchar("event_type", { length: 32 }).notNull(), // start, pause, resume, stop_requested, stop_confirmed, override, comp, void
  actorRole: varchar("actor_role", { length: 32 }).notNull(), // customer, receptionist, manager, owner, system
  actorId: varchar("actor_id", { length: 64 }),
  actorName: varchar("actor_name", { length: 128 }),
  reason: text("reason"),
  deviceId: varchar("device_id", { length: 36 }),
  ipAddress: varchar("ip_address", { length: 64 }),
  payload: jsonb("payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("session_events_session_idx").on(t.sessionId),
  index("session_events_tenant_created_idx").on(t.tenantId, t.createdAt),
]);

// ==========================================
// 14. Invoices (Sequential, No Hard Deletes)
// ==========================================
export const invoices = pgTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  outletId: varchar("outlet_id", { length: 36 }).notNull().references(() => outlets.id),
  sessionId: varchar("session_id", { length: 36 }).references(() => sessions.id),
  customerId: varchar("customer_id", { length: 36 }).notNull().references(() => customers.id),
  invoiceNo: varchar("invoice_no", { length: 64 }).notNull(), // e.g. KGZ-2026-0001
  subtotalPaise: integer("subtotal_paise").notNull(),
  gstRate: integer("gst_rate").default(18).notNull(),
  gstPaise: integer("gst_paise").default(0).notNull(),
  discountPaise: integer("discount_paise").default(0).notNull(),
  totalPaise: integer("total_paise").notNull(),
  status: varchar("status", { length: 32 }).default("issued").notNull(), // draft, issued, paid, void
  voidReason: text("void_reason"),
  pdfUrl: text("pdf_url"),
  issuedAt: timestamp("issued_at", { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("invoices_tenant_no_idx").on(t.tenantId, t.invoiceNo),
  index("invoices_tenant_created_idx").on(t.tenantId, t.createdAt),
  index("invoices_session_idx").on(t.sessionId),
]);

// ==========================================
// 15. Payments
// ==========================================
export const payments = pgTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull().references(() => invoices.id),
  method: varchar("method", { length: 32 }).notNull(), // upi, cash, card, membership, wallet
  amountPaise: integer("amount_paise").notNull(),
  status: varchar("status", { length: 32 }).default("completed").notNull(), // pending, completed, failed, refunded
  providerRef: varchar("provider_ref", { length: 128 }),
  receivedBy: varchar("received_by", { length: 64 }), // staff name or "razorpay_webhook"
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("payments_invoice_idx").on(t.invoiceId),
  index("payments_tenant_created_idx").on(t.tenantId, t.createdAt),
]);

// ==========================================
// 16. OTPs (Rate-limited, Hashed Storage)
// ==========================================
export const otps = pgTable("otps", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  phone: varchar("phone", { length: 20 }).notNull(),
  codeHash: varchar("code_hash", { length: 128 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  verified: boolean("verified").default(false).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("otps_phone_created_idx").on(t.phone, t.createdAt),
]);

// ==========================================
// 17. Notifications (WhatsApp Queue)
// ==========================================
export const notifications = pgTable("notifications", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  channel: varchar("channel", { length: 32 }).default("whatsapp").notNull(), // whatsapp, sms, email
  recipient: varchar("recipient", { length: 128 }).notNull(),
  template: varchar("template", { length: 64 }).notNull(),
  payload: jsonb("payload").$type<Record<string, unknown>>().default({}),
  status: varchar("status", { length: 32 }).default("queued").notNull(), // queued, sent, failed
  attempts: integer("attempts").default(0).notNull(),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("notifications_tenant_status_idx").on(t.tenantId, t.status),
]);

// ==========================================
// 18. Alerts & Anomalies (Anti-Theft Engine)
// ==========================================
export const alerts = pgTable("alerts", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id),
  outletId: varchar("outlet_id", { length: 36 }).references(() => outlets.id),
  resourceId: varchar("resource_id", { length: 36 }).references(() => resources.id),
  sessionId: varchar("session_id", { length: 36 }).references(() => sessions.id),
  type: varchar("type", { length: 64 }).notNull(), // long_running, unmetered_power, excessive_voids, manual_start_spike, discount_abuse, stuck_stopping
  severity: varchar("severity", { length: 32 }).default("warning").notNull(), // info, warning, critical
  message: text("message").notNull(),
  payload: jsonb("payload"),
  resolved: boolean("resolved").default(false).notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedBy: varchar("resolved_by", { length: 64 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("alerts_tenant_resolved_idx").on(t.tenantId, t.resolved),
  index("alerts_created_idx").on(t.createdAt),
]);

// ==========================================
// 19. Audit Log (Append-only)
// ==========================================
export const auditLog = pgTable("audit_log", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).references(() => tenants.id),
  actorId: varchar("actor_id", { length: 64 }).notNull(),
  actorName: varchar("actor_name", { length: 128 }).notNull(),
  actorRole: varchar("actor_role", { length: 32 }).notNull(),
  action: varchar("action", { length: 64 }).notNull(), // create, update, delete, void, override, login, mark_paid
  entity: varchar("entity", { length: 64 }).notNull(), // session, invoice, payment, user, resource, pricing
  entityId: varchar("entity_id", { length: 64 }),
  beforeState: jsonb("before_state"),
  afterState: jsonb("after_state"),
  reason: text("reason"),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("audit_log_tenant_idx").on(t.tenantId),
  index("audit_log_created_idx").on(t.createdAt),
]);

// ==========================================
// 20. SaaS Plans & Subscriptions (Platform Billing)
// ==========================================
export const saasPlans = pgTable("saas_plans", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  pricePaise: integer("price_paise").notNull(),
  billingCycle: varchar("billing_cycle", { length: 16 }).default("monthly").notNull(),
  maxOutlets: integer("max_outlets").default(1).notNull(),
  maxTables: integer("max_tables").default(10).notNull(),
  features: jsonb("features").$type<string[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const saasSubscriptions = pgTable("saas_subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: varchar("tenant_id", { length: 36 }).notNull().references(() => tenants.id).unique(),
  planId: varchar("plan_id", { length: 36 }).notNull().references(() => saasPlans.id),
  status: varchar("status", { length: 32 }).default("active").notNull(), // active, trialing, past_due, canceled
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).defaultNow().notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  razorpaySubscriptionId: varchar("razorpay_subscription_id", { length: 128 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

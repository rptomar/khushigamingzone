// In-Memory Fallback & Demo Store for Zero-Config Mock Operation

export interface MockResource {
  id: string;
  tenantId: string;
  outletId: string;
  typeId: string;
  typeCode: string;
  name: string;
  status: "available" | "running" | "stopping" | "awaiting_payment" | "maintenance";
  hourlyRatePaise: number;
  currentSessionId?: string | null;
  active: boolean;
  deviceToken: string;
}

export interface MockSession {
  id: string;
  tenantId: string;
  outletId: string;
  resourceId: string;
  customerId: string;
  customerPhone: string;
  customerName: string;
  planId?: string;
  planName?: string;
  status: "active" | "paused" | "stopping" | "billed" | "paid";
  startedAt: string; // ISO string
  endedAt?: string | null;
  pausedTotalSec: number;
  lastPausedAt?: string | null;
  startedBy: "customer" | "staff";
  staffUserId?: string | null;
  amountPaise: number;
  stopRequestedAt?: string | null;
  stopConfirmedAt?: string | null;
  notes?: string;
  createdAt: string;
}

export interface MockInvoice {
  id: string;
  tenantId: string;
  outletId: string;
  sessionId?: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  invoiceNo: string;
  subtotalPaise: number;
  gstRate: number;
  gstPaise: number;
  discountPaise: number;
  totalPaise: number;
  status: "draft" | "issued" | "paid" | "void";
  voidReason?: string;
  pdfUrl?: string;
  issuedAt: string;
  paidAt?: string;
  createdAt: string;
}

export interface MockPayment {
  id: string;
  tenantId: string;
  invoiceId: string;
  method: "upi" | "cash" | "card" | "membership" | "wallet";
  amountPaise: number;
  status: "pending" | "completed" | "failed" | "refunded";
  providerRef?: string;
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface MockAlert {
  id: string;
  tenantId: string;
  outletId?: string;
  resourceId?: string;
  sessionId?: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  payload?: any;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

export interface MockAuditEntry {
  id: string;
  tenantId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  entity: string;
  entityId?: string;
  beforeState?: any;
  afterState?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface MockCustomer {
  id: string;
  tenantId: string;
  phone: string;
  name: string;
  email?: string;
  totalSpentPaise: number;
  walletBalancePaise?: number;
  visits: number;
  notes?: string;
  createdAt: string;
}

export interface MockMembership {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  planId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  includedMinutes: number;
  usedMinutes: number;
  status: "active" | "expired" | "cancelled";
  createdAt: string;
}

export interface MockTenant {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "trial";
  planName: string;
  monthlyFeePaise: number;
  outletsCount: number;
  tablesCount: number;
  ownerEmail: string;
  ownerPhone: string;
  city: string;
  joinedAt: string;
}

export const DEFAULT_TENANT_ID = "tenant-kgz-001";
export const DEFAULT_OUTLET_ID = "outlet-kgz-mall-001";

class MemoryStore {
  public initialized = false;
  public resources: MockResource[] = [];
  public sessions: MockSession[] = [];
  public invoices: MockInvoice[] = [];
  public payments: MockPayment[] = [];
  public alerts: MockAlert[] = [];
  public auditLogs: MockAuditEntry[] = [];
  public customers: MockCustomer[] = [];
  public memberships: MockMembership[] = [];
  public tenants: MockTenant[] = [];
  public sessionEvents: { id: string; sessionId: string; eventType: string; actorRole: string; actorId: string; note?: string; createdAt: string }[] = [];
  public otps: { id: string; tenantId: string; phone: string; code: string; expiresAt: number; attempts: number }[] = [];

  constructor() {
    this.seed();
  }

  public seed() {
    if (this.initialized) return;

    // 1. Initial Resources
    this.resources = [
      {
        id: "res-snooker-1",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-snooker",
        typeCode: "snooker",
        name: "Snooker Table 1 (Championship)",
        status: "available",
        hourlyRatePaise: 30000, // ₹300/hr
        active: true,
        deviceToken: "kiosk-snooker-1",
      },
      {
        id: "res-snooker-2",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-snooker",
        typeCode: "snooker",
        name: "Snooker Table 2 (Standard)",
        status: "available",
        hourlyRatePaise: 30000,
        active: true,
        deviceToken: "kiosk-snooker-2",
      },
      {
        id: "res-pool-1",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-pool",
        typeCode: "pool",
        name: "English 8-Ball Pool 1",
        status: "available",
        hourlyRatePaise: 20000, // ₹200/hr
        active: true,
        deviceToken: "kiosk-pool-1",
      },
      {
        id: "res-pool-2",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-pool",
        typeCode: "pool",
        name: "English 8-Ball Pool 2",
        status: "available",
        hourlyRatePaise: 20000,
        active: true,
        deviceToken: "kiosk-pool-2",
      },
      {
        id: "res-ps5-1",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-ps5",
        typeCode: "ps5",
        name: "PS5 Pro Lounge Station 1",
        status: "available",
        hourlyRatePaise: 15000, // ₹150/hr
        active: true,
        deviceToken: "kiosk-ps5-1",
      },
      {
        id: "res-ps5-2",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-ps5",
        typeCode: "ps5",
        name: "PS5 Pro Lounge Station 2",
        status: "available",
        hourlyRatePaise: 15000,
        active: true,
        deviceToken: "kiosk-ps5-2",
      },
      {
        id: "res-ps5-3",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-ps5",
        typeCode: "ps5",
        name: "PS5 Pro Lounge Station 3",
        status: "available",
        hourlyRatePaise: 15000,
        active: true,
        deviceToken: "kiosk-ps5-3",
      },
      {
        id: "res-tt-1",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-tt",
        typeCode: "table_tennis",
        name: "Stag Olympic Table Tennis",
        status: "available",
        hourlyRatePaise: 12000, // ₹120/hr
        active: true,
        deviceToken: "kiosk-tt-1",
      },
      {
        id: "res-carrom-1",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        typeId: "type-carrom",
        typeCode: "carrom",
        name: "Tournament Carrom Board",
        status: "available",
        hourlyRatePaise: 8000, // ₹80/hr
        active: true,
        deviceToken: "kiosk-carrom-1",
      },
    ];

    // 2. Realistic Customers
    const sampleNames = [
      "Aarav Sharma", "Aditya Verma", "Rohan Mehta", "Vikram Rathore", "Kunal Singhania",
      "Neha Patel", "Pooja Malhotra", "Ananya Deshmukh", "Rahul Joshi", "Siddharth Nair",
      "Ishaan Roy", "Tanmay Sen", "Kabir Bedi", "Rhea Kapoor", "Meera Bhatt",
      "Akash Agarwal", "Varun Dhawan", "Devendra Singh", "Yash Chopra", "Deepak Gupta"
    ];

    this.customers = sampleNames.map((name, i) => {
      const phone = `98200${(10000 + i * 137).toString().slice(0, 5)}`;
      const visits = 3 + (i * 3) % 18;
      const totalSpentPaise = visits * (25000 + (i * 1500) % 30000);
      return {
        id: `cust-${i + 1}`,
        tenantId: DEFAULT_TENANT_ID,
        phone,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        totalSpentPaise,
        visits,
        createdAt: new Date(Date.now() - (35 - i) * 86400000).toISOString(),
      };
    });

    // 3. Memberships
    this.memberships = [
      {
        id: "mem-1",
        tenantId: DEFAULT_TENANT_ID,
        customerId: "cust-1",
        customerName: "Aarav Sharma",
        customerPhone: "9820010000",
        planId: "plan-monthly-vip",
        name: "Elite VIP Club (20 Hours)",
        startsAt: new Date(Date.now() - 10 * 86400000).toISOString(),
        endsAt: new Date(Date.now() + 20 * 86400000).toISOString(),
        includedMinutes: 1200,
        usedMinutes: 345,
        status: "active",
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
      },
      {
        id: "mem-2",
        tenantId: DEFAULT_TENANT_ID,
        customerId: "cust-3",
        customerName: "Rohan Mehta",
        customerPhone: "9820010274",
        planId: "plan-monthly-vip",
        name: "Elite VIP Club (20 Hours)",
        startsAt: new Date(Date.now() - 5 * 86400000).toISOString(),
        endsAt: new Date(Date.now() + 25 * 86400000).toISOString(),
        includedMinutes: 1200,
        usedMinutes: 180,
        status: "active",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      },
    ];

    // 4. Generate ~30 days of realistic sessions and invoices
    let invoiceCounter = 1001;
    const now = Date.now();

    for (let day = 30; day >= 0; day--) {
      const dayTimestamp = now - day * 86400000;
      // 3 to 6 sessions per day
      const sessionsCount = 3 + (day % 4);

      for (let s = 0; s < sessionsCount; s++) {
        const res = this.resources[s % this.resources.length];
        const cust = this.customers[(day + s) % this.customers.length];
        const durationMinutes = 45 + ((day * 7 + s * 13) % 90);
        const startMillis = dayTimestamp + (11 + s * 2) * 3600000;
        const endMillis = startMillis + durationMinutes * 60000;
        const amountPaise = Math.round((durationMinutes / 60) * res.hourlyRatePaise);

        const sessionId = `sess-${day}-${s}`;
        const invoiceId = `inv-${day}-${s}`;
        const invoiceNo = `KGZ-${invoiceCounter++}`;

        // Don't mark today's active sessions as ended
        const isCurrentActive = day === 0 && s === 0;

        if (isCurrentActive) {
          // Set Snooker Table 1 as active running session for live demo
          res.status = "running";
          res.currentSessionId = sessionId;
          this.sessions.push({
            id: sessionId,
            tenantId: DEFAULT_TENANT_ID,
            outletId: DEFAULT_OUTLET_ID,
            resourceId: res.id,
            customerId: cust.id,
            customerPhone: cust.phone,
            customerName: cust.name,
            status: "active",
            startedAt: new Date(now - 38 * 60000).toISOString(), // 38 mins elapsed
            endedAt: null,
            pausedTotalSec: 0,
            startedBy: "customer",
            amountPaise: Math.round((38 / 60) * res.hourlyRatePaise),
            createdAt: new Date(now - 38 * 60000).toISOString(),
          });
        } else {
          this.sessions.push({
            id: sessionId,
            tenantId: DEFAULT_TENANT_ID,
            outletId: DEFAULT_OUTLET_ID,
            resourceId: res.id,
            customerId: cust.id,
            customerPhone: cust.phone,
            customerName: cust.name,
            status: "paid",
            startedAt: new Date(startMillis).toISOString(),
            endedAt: new Date(endMillis).toISOString(),
            pausedTotalSec: 0,
            startedBy: s % 3 === 0 ? "staff" : "customer",
            amountPaise,
            createdAt: new Date(startMillis).toISOString(),
          });

          // Invoices & Payments for completed sessions
          const gstPaise = Math.round(amountPaise * 0.18);
          const totalPaise = amountPaise + gstPaise;
          const isUpi = s % 2 === 0;

          this.invoices.push({
            id: invoiceId,
            tenantId: DEFAULT_TENANT_ID,
            outletId: DEFAULT_OUTLET_ID,
            sessionId,
            customerId: cust.id,
            customerName: cust.name,
            customerPhone: cust.phone,
            invoiceNo,
            subtotalPaise: amountPaise,
            gstRate: 18,
            gstPaise,
            discountPaise: 0,
            totalPaise,
            status: "paid",
            pdfUrl: `/api/invoices/${invoiceId}/pdf`,
            issuedAt: new Date(endMillis).toISOString(),
            paidAt: new Date(endMillis + 60000).toISOString(),
            createdAt: new Date(endMillis).toISOString(),
          });

          this.payments.push({
            id: `pay-${day}-${s}`,
            tenantId: DEFAULT_TENANT_ID,
            invoiceId,
            method: isUpi ? "upi" : "cash",
            amountPaise: totalPaise,
            status: "completed",
            providerRef: isUpi ? `UPI-REF-${100000 + invoiceCounter}` : "CASH-REGISTER-01",
            receivedBy: isUpi ? "razorpay_webhook" : "Ramesh Staff",
            createdAt: new Date(endMillis + 60000).toISOString(),
          });
        }
      }
    }

    // 5. Initial Anti-Theft Alerts
    this.alerts = [
      {
        id: "alert-1",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        resourceId: "res-snooker-2",
        type: "long_running",
        severity: "warning",
        message: "Snooker Table 2 session running continuously past 3.5 hours",
        resolved: false,
        createdAt: new Date(now - 45 * 60000).toISOString(),
      },
      {
        id: "alert-2",
        tenantId: DEFAULT_TENANT_ID,
        outletId: DEFAULT_OUTLET_ID,
        resourceId: "res-ps5-2",
        type: "unmetered_power",
        severity: "critical",
        message: "Smart sensor detected 210W power draw with NO active session logged!",
        payload: { watts: 210, station: "PS5 Pro Lounge Station 2" },
        resolved: false,
        createdAt: new Date(now - 15 * 60000).toISOString(),
      },
    ];

    // 6. Initial Audit Log
    this.auditLogs = [
      {
        id: "audit-1",
        tenantId: DEFAULT_TENANT_ID,
        actorId: "usr-staff-1",
        actorName: "Ramesh Staff",
        actorRole: "receptionist",
        action: "start_session_manual",
        entity: "session",
        entityId: "sess-0-1",
        reason: "Customer phone dead, requested manual walk-in start",
        createdAt: new Date(now - 60 * 60000).toISOString(),
      },
    ];

    // 7. Reseller Tenants Network
    this.tenants = [
      {
        id: DEFAULT_TENANT_ID,
        name: "Ps07 Gaming Arena (Flagship Arena)",
        slug: "ps07-gaming-arena",
        status: "active",
        planName: "Reseller HQ / Enterprise",
        monthlyFeePaise: 0,
        outletsCount: 2,
        tablesCount: 8,
        ownerEmail: "owner@ps07gaming.com",
        ownerPhone: "9876543210",
        city: "Delhi NCR",
        joinedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      },
      {
        id: "tenant-velocity-002",
        name: "Velocity Cue Sports Club",
        slug: "velocity-cue-sports",
        status: "active",
        planName: "Professional (₹4,999/mo)",
        monthlyFeePaise: 499900,
        outletsCount: 1,
        tablesCount: 6,
        ownerEmail: "manager@velocitycues.com",
        ownerPhone: "9811099231",
        city: "Connaught Place, New Delhi",
        joinedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
      },
      {
        id: "tenant-apex-003",
        name: "Apex Snooker & Pool Lounge",
        slug: "apex-snooker-lounge",
        status: "active",
        planName: "Enterprise Arena (₹8,999/mo)",
        monthlyFeePaise: 899900,
        outletsCount: 2,
        tablesCount: 12,
        ownerEmail: "vikram@apexsnooker.com",
        ownerPhone: "9899012345",
        city: "CyberCity, Gurugram",
        joinedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      },
      {
        id: "tenant-cyberzone-004",
        name: "CyberZone Esports & Arcade",
        slug: "cyberzone-esports",
        status: "active",
        planName: "Starter Arena (₹2,999/mo)",
        monthlyFeePaise: 299900,
        outletsCount: 1,
        tablesCount: 5,
        ownerEmail: "support@cyberzone.in",
        ownerPhone: "9871144220",
        city: "Sector 18, Noida",
        joinedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: "tenant-striker-005",
        name: "Striker Billiards Academy",
        slug: "striker-billiards",
        status: "trial",
        planName: "14-Day Free Trial",
        monthlyFeePaise: 0,
        outletsCount: 1,
        tablesCount: 4,
        ownerEmail: "striker.academy@gmail.com",
        ownerPhone: "9810155331",
        city: "South Extension, New Delhi",
        joinedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      },
    ];

    this.initialized = true;
  }
}

// Global persistent singleton in development/production
const globalForMemory = globalThis as unknown as { mockStore?: MemoryStore };
export const mockStore = globalForMemory.mockStore || new MemoryStore();
if (process.env.NODE_ENV !== "production") globalForMemory.mockStore = mockStore;

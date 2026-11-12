import { mockStore, DEFAULT_TENANT_ID, MockResource, MockSession, MockInvoice, MockPayment, MockAlert, MockAuditEntry } from "./mock-store";
import { formatPaise } from "@/lib/utils";
import { getWhatsAppProvider } from "@/lib/providers/whatsapp";

/**
 * Central Scoped Data-Access Layer.
 * Guarantees that EVERY query strictly enforces tenant_id scoping.
 */
export function getScopedDb(tenantId: string = DEFAULT_TENANT_ID) {
  return {
    tenantId,

    // 1. Resources (Tables / Consoles)
    async getResources(outletId?: string): Promise<MockResource[]> {
      return mockStore.resources.filter(
        (r) => r.tenantId === tenantId && (!outletId || r.outletId === outletId)
      );
    },

    async getResourceById(resourceId: string): Promise<MockResource | null> {
      return (
        mockStore.resources.find(
          (r) => r.tenantId === tenantId && r.id === resourceId
        ) || null
      );
    },

    async getResourceByDeviceToken(deviceToken: string): Promise<MockResource | null> {
      return (
        mockStore.resources.find(
          (r) => r.tenantId === tenantId && r.deviceToken === deviceToken
        ) || null
      );
    },

    // 2. Sessions
    async getSessions(options?: { status?: string; limit?: number }): Promise<MockSession[]> {
      let list = mockStore.sessions.filter((s) => s.tenantId === tenantId);
      if (options?.status) {
        list = list.filter((s) => s.status === options.status);
      }
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (options?.limit) {
        list = list.slice(0, options.limit);
      }
      return list;
    },

    async getSessionById(sessionId: string): Promise<MockSession | null> {
      return (
        mockStore.sessions.find(
          (s) => s.tenantId === tenantId && s.id === sessionId
        ) || null
      );
    },

    async getActiveSessionForResource(resourceId: string): Promise<MockSession | null> {
      return (
        mockStore.sessions.find(
          (s) =>
            s.tenantId === tenantId &&
            s.resourceId === resourceId &&
            (s.status === "active" || s.status === "paused" || s.status === "stopping" || s.status === "billed")
        ) || null
      );
    },

    // Start Session (Customer or Staff)
    async startSession(params: {
      resourceId: string;
      customerPhone: string;
      customerName?: string;
      planId?: string;
      planName?: string;
      startedBy: "customer" | "staff";
      staffUserId?: string;
      notes?: string;
    }): Promise<MockSession> {
      const resource = await this.getResourceById(params.resourceId);
      if (!resource) throw new Error("Resource not found");
      if (resource.status !== "available") {
        throw new Error(`Resource is currently ${resource.status}`);
      }

      // Upsert customer
      let customer = mockStore.customers.find(
        (c) => c.tenantId === tenantId && c.phone === params.customerPhone
      );
      if (!customer) {
        customer = {
          id: `cust-${Date.now()}`,
          tenantId,
          phone: params.customerPhone,
          name: params.customerName || `Gamer ${params.customerPhone.slice(-4)}`,
          totalSpentPaise: 0,
          visits: 1,
          createdAt: new Date().toISOString(),
        };
        mockStore.customers.push(customer);
      } else {
        customer.visits += 1;
        if (params.customerName && params.customerName !== customer.name) {
          customer.name = params.customerName;
        }
      }

      const sessionId = `sess-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newSession: MockSession = {
        id: sessionId,
        tenantId,
        outletId: resource.outletId,
        resourceId: resource.id,
        customerId: customer.id,
        customerPhone: customer.phone,
        customerName: customer.name,
        planId: params.planId,
        planName: params.planName || "Standard Hourly",
        status: "active",
        startedAt: nowIso,
        endedAt: null,
        pausedTotalSec: 0,
        startedBy: params.startedBy,
        staffUserId: params.staffUserId,
        amountPaise: 0,
        notes: params.notes,
        createdAt: nowIso,
      };

      mockStore.sessions.unshift(newSession);
      resource.status = "running";
      resource.currentSessionId = sessionId;

      // Anti-fraud audit log
      mockStore.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        tenantId,
        actorId: params.staffUserId || customer.id,
        actorName: params.startedBy === "staff" ? "Staff Member" : customer.name,
        actorRole: params.startedBy === "staff" ? "receptionist" : "customer",
        action: "start_session",
        entity: "session",
        entityId: sessionId,
        reason: params.startedBy === "staff" ? `Manual start: ${params.notes || "Walk-in"}` : "Customer Kiosk start via OTP",
        createdAt: nowIso,
      });

      // If staff manually started, trigger an alert if required
      if (params.startedBy === "staff") {
        mockStore.alerts.unshift({
          id: `alert-manual-${Date.now()}`,
          tenantId,
          outletId: resource.outletId,
          resourceId: resource.id,
          sessionId,
          type: "manual_start_spike",
          severity: "info",
          message: `Manual staff start on ${resource.name} for ${customer.phone}`,
          resolved: false,
          createdAt: nowIso,
        });
      }

      return newSession;
    },

    // Stop requested from table kiosk
    async requestStopSession(sessionId: string, reason?: string): Promise<MockSession> {
      const session = await this.getSessionById(sessionId);
      if (!session) throw new Error("Session not found");
      if (session.status !== "active" && session.status !== "paused") {
        throw new Error(`Cannot request stop from status ${session.status}`);
      }

      session.status = "stopping";
      session.stopRequestedAt = new Date().toISOString();

      const resource = await this.getResourceById(session.resourceId);
      if (resource) {
        resource.status = "stopping";
      }

      mockStore.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        tenantId,
        actorId: session.customerId,
        actorName: session.customerName,
        actorRole: "customer",
        action: "request_stop",
        entity: "session",
        entityId: sessionId,
        reason: reason || "Customer pressed End Session on Kiosk",
        createdAt: new Date().toISOString(),
      });

      return session;
    },

    // Reception confirms stop and generates bill
    async confirmStopSession(sessionId: string, actor: { id: string; name: string; role: string }): Promise<{ session: MockSession; invoice: MockInvoice }> {
      const session = await this.getSessionById(sessionId);
      if (!session) throw new Error("Session not found");

      const resource = await this.getResourceById(session.resourceId);
      if (!resource) throw new Error("Resource not found");

      const now = new Date();
      session.status = "billed";
      session.endedAt = now.toISOString();
      session.stopConfirmedAt = now.toISOString();

      // Compute total elapsed seconds
      const elapsedSec = Math.max(
        60,
        Math.floor((now.getTime() - new Date(session.startedAt).getTime()) / 1000) - session.pausedTotalSec
      );
      const hours = elapsedSec / 3600;
      const subtotalPaise = Math.max(5000, Math.round(hours * resource.hourlyRatePaise)); // ₹50 min charge
      const gstRate = 18;
      const gstPaise = Math.round(subtotalPaise * (gstRate / 100));
      const totalPaise = subtotalPaise + gstPaise;

      session.amountPaise = subtotalPaise;

      const invoiceId = `inv-${Date.now()}`;
      const invoiceNo = `KGZ-${Math.floor(100000 + Math.random() * 900000)}`;

      const invoice: MockInvoice = {
        id: invoiceId,
        tenantId,
        outletId: session.outletId,
        sessionId: session.id,
        customerId: session.customerId,
        customerName: session.customerName,
        customerPhone: session.customerPhone,
        invoiceNo,
        subtotalPaise,
        gstRate,
        gstPaise,
        discountPaise: 0,
        totalPaise,
        status: "issued",
        pdfUrl: `/api/invoices/${invoiceId}/pdf`,
        issuedAt: now.toISOString(),
        createdAt: now.toISOString(),
      };

      mockStore.invoices.unshift(invoice);
      resource.status = "awaiting_payment";

      mockStore.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        tenantId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "confirm_stop_and_bill",
        entity: "invoice",
        entityId: invoiceId,
        reason: `Reception confirmed stop. Amount: ${formatPaise(totalPaise)}`,
        createdAt: now.toISOString(),
      });

      return { session, invoice };
    },

    // Reception or Webhook marks payment completed
    async markPaymentReceived(params: {
      invoiceId: string;
      method: "upi" | "cash" | "card" | "membership" | "wallet";
      receivedBy: string;
      providerRef?: string;
      notes?: string;
    }): Promise<{ invoice: MockInvoice; payment: MockPayment }> {
      const invoice = mockStore.invoices.find(
        (inv) => inv.tenantId === tenantId && inv.id === params.invoiceId
      );
      if (!invoice) throw new Error("Invoice not found");
      if (invoice.status === "paid") {
        throw new Error("Invoice is already paid");
      }

      const nowIso = new Date().toISOString();
      invoice.status = "paid";
      invoice.paidAt = nowIso;

      const payment: MockPayment = {
        id: `pay-${Date.now()}`,
        tenantId,
        invoiceId: invoice.id,
        method: params.method,
        amountPaise: invoice.totalPaise,
        status: "completed",
        providerRef: params.providerRef || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
        receivedBy: params.receivedBy,
        notes: params.notes,
        createdAt: nowIso,
      };
      mockStore.payments.unshift(payment);

      // Free the resource and update session
      if (invoice.sessionId) {
        const session = await this.getSessionById(invoice.sessionId);
        if (session) {
          session.status = "paid";
          const res = await this.getResourceById(session.resourceId);
          if (res) {
            res.status = "available";
            res.currentSessionId = null;
          }
        }
      }

      // Update customer stats
      const customer = mockStore.customers.find((c) => c.id === invoice.customerId);
      if (customer) {
        customer.totalSpentPaise += invoice.totalPaise;
      }

      // Auto-dispatch WhatsApp invoice to customer
      if (invoice.customerPhone) {
        try {
          const whatsapp = getWhatsAppProvider();
          whatsapp.sendInvoice({
            tenantId,
            phone: invoice.customerPhone,
            customerName: invoice.customerName,
            invoiceNo: invoice.invoiceNo,
            amountPaise: invoice.totalPaise,
            pdfUrl: invoice.pdfUrl || `/api/invoices/${invoice.id}/pdf`,
            sessionMinutes: 60,
          }).catch((e) => console.error("WhatsApp auto-dispatch error:", e));
        } catch (e) {
          console.error("WhatsApp provider error:", e);
        }
      }

      mockStore.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        tenantId,
        actorId: params.receivedBy,
        actorName: params.receivedBy,
        actorRole: params.receivedBy === "razorpay_webhook" ? "system" : "receptionist",
        action: "payment_received",
        entity: "payment",
        entityId: payment.id,
        reason: `Payment of ${formatPaise(invoice.totalPaise)} received via ${params.method}. Notes: ${params.notes || "None"}`,
        createdAt: nowIso,
      });

      return { invoice, payment };
    },

    // 3. Invoices
    async getInvoices(limit = 50): Promise<MockInvoice[]> {
      return mockStore.invoices
        .filter((inv) => inv.tenantId === tenantId)
        .slice(0, limit);
    },

    async getInvoiceById(invoiceId: string): Promise<MockInvoice | null> {
      return (
        mockStore.invoices.find(
          (inv) => inv.tenantId === tenantId && inv.id === invoiceId
        ) || null
      );
    },

    // 4. Alerts
    async getAlerts(resolved?: boolean): Promise<MockAlert[]> {
      return mockStore.alerts.filter(
        (a) => a.tenantId === tenantId && (resolved === undefined || a.resolved === resolved)
      );
    },

    async resolveAlert(alertId: string, resolvedBy: string): Promise<MockAlert | null> {
      const alert = mockStore.alerts.find(
        (a) => a.tenantId === tenantId && a.id === alertId
      );
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        alert.resolvedBy = resolvedBy;
      }
      return alert || null;
    },

    // 5. Audit Log
    async getAuditLogs(limit = 100): Promise<MockAuditEntry[]> {
      return mockStore.auditLogs
        .filter((l) => l.tenantId === tenantId)
        .slice(0, limit);
    },

    // 6. Customers & Memberships
    async getCustomers(): Promise<typeof mockStore.customers> {
      return mockStore.customers.filter((c) => c.tenantId === tenantId);
    },

    async getMemberships(): Promise<typeof mockStore.memberships> {
      return mockStore.memberships.filter((m) => m.tenantId === tenantId);
    },
  };
}

import { NextRequest, NextResponse } from "next/server";
import { mockStore, DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { formatPaise } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const cashPayments = mockStore.payments.filter((p) => {
      if (p.tenantId !== DEFAULT_TENANT_ID || p.method !== "cash" || p.status !== "completed") {
        return false;
      }
      return new Date(p.createdAt).getTime() >= todayStart;
    });

    // If no cash payments yet today, provide realistic baseline
    let expectedCashPaise = cashPayments.reduce((acc, p) => acc + p.amountPaise, 0);
    if (expectedCashPaise === 0) {
      expectedCashPaise = 420000; // ₹4,200
    }

    const items = cashPayments.map((p) => {
      const invoice = mockStore.invoices.find((i) => i.id === p.invoiceId);
      const session = invoice ? mockStore.sessions.find((s) => s.id === invoice.sessionId) : null;
      const resource = session ? mockStore.resources.find((r) => r.id === session.resourceId) : null;

      return {
        id: p.id,
        invoiceNo: invoice?.invoiceNo || "N/A",
        tableName: resource?.name || "Table Station",
        amountPaise: p.amountPaise,
        receivedBy: p.receivedBy || "Receptionist",
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      expectedCashPaise,
      cashTransactionsCount: items.length || 6,
      transactions: items.length > 0 ? items : [
        {
          id: "pay-seed-1",
          invoiceNo: "KGZ-839102",
          tableName: "Table 1 - Snooker",
          amountPaise: 70000,
          receivedBy: "Mohit (Reception)",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "pay-seed-2",
          invoiceNo: "KGZ-839145",
          tableName: "Table 3 - Pool",
          amountPaise: 50000,
          receivedBy: "Mohit (Reception)",
          createdAt: new Date(Date.now() - 5400000).toISOString(),
        },
        {
          id: "pay-seed-3",
          invoiceNo: "KGZ-839210",
          tableName: "Station 5 - PS5",
          amountPaise: 120000,
          receivedBy: "Mohit (Reception)",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "pay-seed-4",
          invoiceNo: "KGZ-839280",
          tableName: "Table 2 - Snooker",
          amountPaise: 180000,
          receivedBy: "Mohit (Reception)",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { expectedPaise, countedPaise, variancePaise, notes, auditedBy } = body;

    mockStore.auditLogs.unshift({
      id: `audit-reconcile-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      actorId: auditedBy || "owner_admin",
      actorName: auditedBy || "Owner Manager",
      actorRole: "owner",
      action: "cash_reconciliation_signed",
      entity: "cash_drawer",
      reason: `Cash reconciliation completed. Expected: ${formatPaise(expectedPaise)}, Counted: ${formatPaise(countedPaise)}, Variance: ${formatPaise(variancePaise)}. Notes: ${notes || "None"}`,
      createdAt: new Date().toISOString(),
    });

    if (variancePaise < 0) {
      mockStore.alerts.unshift({
        id: `alert-cash-short-${Date.now()}`,
        tenantId: DEFAULT_TENANT_ID,
        type: "cash_drawer_shortage",
        severity: "critical",
        message: `CASH SHORTAGE DETECTED: Physical drawer short by ${formatPaise(Math.abs(variancePaise))}. Expected ${formatPaise(expectedPaise)} but counted ${formatPaise(countedPaise)}. Audited by ${auditedBy}.`,
        resolved: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true, message: "Cash drawer audit locked successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

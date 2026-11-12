import { NextRequest, NextResponse } from "next/server";
import { mockStore, DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { env } from "@/lib/validation/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get("secret") || authHeader?.replace("Bearer ", "");

    if (secret !== env.CRON_SECRET && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
    }

    const now = Date.now();
    let anomaliesCount = 0;

    // Check 1: Long-running sessions (> 4 hours)
    for (const session of mockStore.sessions) {
      if (session.status === "active") {
        const start = new Date(session.startedAt).getTime();
        const durationHours = (now - start) / 3600000;
        if (durationHours > 4) {
          const alertId = `alert-long-${session.id}`;
          const existing = mockStore.alerts.find((a) => a.id === alertId);
          if (!existing) {
            mockStore.alerts.unshift({
              id: alertId,
              tenantId: session.tenantId,
              sessionId: session.id,
              resourceId: session.resourceId,
              type: "long_running_session",
              severity: "warning",
              message: `Session ${session.id.slice(-6)} on table has been running for ${durationHours.toFixed(1)} hours without pause or end. Please verify with floor staff.`,
              resolved: false,
              createdAt: new Date().toISOString(),
            });
            anomaliesCount++;
          }
        }
      }
    }

    // Check 2: Unattended stop requests (> 10 minutes)
    for (const session of mockStore.sessions) {
      if (session.status === "stopping" && session.stopRequestedAt) {
        const waitingMins = (now - new Date(session.stopRequestedAt).getTime()) / 60000;
        if (waitingMins > 10) {
          const alertId = `alert-wait-${session.id}`;
          const existing = mockStore.alerts.find((a) => a.id === alertId);
          if (!existing) {
            mockStore.alerts.unshift({
              id: alertId,
              tenantId: session.tenantId,
              sessionId: session.id,
              resourceId: session.resourceId,
              type: "unattended_stop_request",
              severity: "warning",
              message: `Customer requested stop ${Math.round(waitingMins)} mins ago, but reception has not confirmed the bill.`,
              resolved: false,
              createdAt: new Date().toISOString(),
            });
            anomaliesCount++;
          }
        }
      }
    }

    // Check 3: Excessive void invoices
    const voidInvoices = mockStore.invoices.filter(
      (inv) => inv.tenantId === DEFAULT_TENANT_ID && inv.status === "void"
    );
    if (voidInvoices.length >= 3) {
      const alertId = `alert-void-spike-${new Date().toDateString()}`;
      const existing = mockStore.alerts.find((a) => a.id === alertId);
      if (!existing) {
        mockStore.alerts.unshift({
          id: alertId,
          tenantId: DEFAULT_TENANT_ID,
          type: "excessive_voids",
          severity: "critical",
          message: `Elevated void activity: ${voidInvoices.length} invoices voided today. High potential for cash theft or unrecorded play.`,
          resolved: false,
          createdAt: new Date().toISOString(),
        });
        anomaliesCount++;
      }
    }

    return NextResponse.json({
      status: "success",
      timestamp: new Date().toISOString(),
      checkedSessions: mockStore.sessions.length,
      anomaliesFound: anomaliesCount,
      activeAlertsCount: mockStore.alerts.filter((a) => !a.resolved).length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID, mockStore } from "@/lib/db/mock-store";
import { computeCharge, DEFAULT_PRICING_PLANS } from "@/lib/domain/pricing";

export async function GET() {
  try {
    const db = getScopedDb(DEFAULT_TENANT_ID);
    const resources = await db.getResources();
    const now = new Date();

    // Map resources with live calculated stats
    const tableCards = await Promise.all(
      resources.map(async (r) => {
        let session: any = null;
        let elapsedSeconds = 0;
        let runningAmountPaise = 0;
        let invoice: any = null;

        if (r.currentSessionId) {
          session = await db.getSessionById(r.currentSessionId);
          if (session) {
            const startedAt = new Date(session.startedAt);
            elapsedSeconds = Math.max(
              0,
              Math.floor((now.getTime() - startedAt.getTime()) / 1000) - session.pausedTotalSec
            );

            const plan =
              DEFAULT_PRICING_PLANS.find((p) => p.resourceTypeCode === r.typeCode) ||
              DEFAULT_PRICING_PLANS[0];

            const chargeResult = computeCharge({
              plan,
              startedAt: session.startedAt,
              now,
              pausedSec: session.pausedTotalSec,
            });

            runningAmountPaise = chargeResult.subtotalPaise;

            if (session.status === "billed" || r.status === "awaiting_payment") {
              invoice = mockStore.invoices.find((inv) => inv.sessionId === session.id) || null;
            }
          }
        }

        return {
          ...r,
          session,
          elapsedSeconds,
          runningAmountPaise,
          invoice,
        };
      })
    );

    // Today's collection summary
    const today = new Date().toISOString().split("T")[0];
    const todayPayments = mockStore.payments.filter((p) =>
      p.createdAt.startsWith(today)
    );

    const todayCashPaise = todayPayments
      .filter((p) => p.method === "cash")
      .reduce((sum, p) => sum + p.amountPaise, 0);

    const todayUpiPaise = todayPayments
      .filter((p) => p.method === "upi")
      .reduce((sum, p) => sum + p.amountPaise, 0);

    const todayTotalPaise = todayCashPaise + todayUpiPaise;

    const activeTablesCount = tableCards.filter(
      (c) => c.status === "running" || c.status === "stopping"
    ).length;

    const stoppingRequestsCount = tableCards.filter(
      (c) => c.status === "stopping"
    ).length;

    return NextResponse.json({
      tables: tableCards,
      summary: {
        todayTotalPaise,
        todayCashPaise,
        todayUpiPaise,
        activeTablesCount,
        totalTablesCount: tableCards.length,
        stoppingRequestsCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to load reception board" },
      { status: 500 }
    );
  }
}

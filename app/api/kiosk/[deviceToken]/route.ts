import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID, mockStore } from "@/lib/db/mock-store";
import { computeCharge, DEFAULT_PRICING_PLANS } from "@/lib/domain/pricing";
import QRCode from "qrcode";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ deviceToken: string }> }
) {
  try {
    const { deviceToken } = await params;
    const db = getScopedDb(DEFAULT_TENANT_ID);
    const resource = await db.getResourceByDeviceToken(deviceToken);

    if (!resource) {
      return NextResponse.json({ error: "Device token not recognized" }, { status: 404 });
    }

    const activeSession = await db.getActiveSessionForResource(resource.id);

    let runningAmountPaise = 0;
    let elapsedSeconds = 0;
    let upiQrDataUrl: string | null = null;
    let invoiceData: any = null;

    if (activeSession) {
      const now = new Date();
      const startedAt = new Date(activeSession.startedAt);
      elapsedSeconds = Math.max(
        0,
        Math.floor((now.getTime() - startedAt.getTime()) / 1000) - (activeSession.pausedTotalSec || 0)
      );

      // Find pricing plan
      const plan =
        DEFAULT_PRICING_PLANS.find((p) => p.resourceTypeCode === resource.typeCode) ||
        DEFAULT_PRICING_PLANS[0];

      const chargeResult = computeCharge({
        plan: {
          ...plan,
          rounding: "up",
        },
        startedAt: activeSession.startedAt,
        now,
        pausedSec: activeSession.pausedTotalSec,
      });

      runningAmountPaise = chargeResult.subtotalPaise;

      // If session is billed, fetch or generate invoice & UPI QR deep link
      if (activeSession.status === "billed" || resource.status === "awaiting_payment") {
        const invoice = mockStore.invoices.find((inv) => inv.sessionId === activeSession.id);
        if (invoice) {
          invoiceData = invoice;
          const upiDeepLink = `upi://pay?pa=khushigaming@upi&pn=Khushi%20Gaming%20Zone&am=${(
            invoice.totalPaise / 100
          ).toFixed(2)}&tn=Session%20${resource.name}&tr=${invoice.invoiceNo}`;

          upiQrDataUrl = await QRCode.toDataURL(upiDeepLink, {
            margin: 2,
            width: 280,
            color: { dark: "#0F172A", light: "#FFFFFF" },
          });
        }
      }
    }

    return NextResponse.json({
      resource,
      session: activeSession,
      elapsedSeconds,
      runningAmountPaise,
      invoice: invoiceData,
      upiQrDataUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch kiosk state" }, { status: 500 });
  }
}

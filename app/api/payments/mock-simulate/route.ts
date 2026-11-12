import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { z } from "zod";

const simulateSchema = z.object({
  invoiceId: z.string(),
  method: z.enum(["upi", "cash", "card", "membership", "wallet"]).default("upi"),
  providerRef: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = simulateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment simulation parameters" }, { status: 400 });
    }

    const db = getScopedDb(DEFAULT_TENANT_ID);
    const result = await db.markPaymentReceived({
      invoiceId: parsed.data.invoiceId,
      method: parsed.data.method,
      receivedBy: parsed.data.method === "upi" ? "razorpay_webhook" : "Receptionist Staff",
      providerRef: parsed.data.providerRef || `SIM-PAY-${Date.now()}`,
      notes: "Simulated dev payment verification",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to simulate payment" }, { status: 500 });
  }
}

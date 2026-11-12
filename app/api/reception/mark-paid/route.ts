import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { z } from "zod";

const markPaidSchema = z.object({
  invoiceId: z.string(),
  method: z.enum(["cash", "upi", "card", "membership", "wallet"]),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = markPaidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payment parameters" }, { status: 400 });
    }

    const db = getScopedDb(DEFAULT_TENANT_ID);
    const result = await db.markPaymentReceived({
      invoiceId: parsed.data.invoiceId,
      method: parsed.data.method,
      receivedBy: "Ramesh Receptionist",
      notes: parsed.data.reason || `Marked paid via ${parsed.data.method} at reception desk`,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to mark invoice paid" },
      { status: 500 }
    );
  }
}

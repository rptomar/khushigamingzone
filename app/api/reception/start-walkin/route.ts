import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { z } from "zod";

const startWalkinSchema = z.object({
  resourceId: z.string(),
  phone: z.string().min(10).max(15),
  customerName: z.string().optional(),
  reason: z.string().min(3, "Staff must provide a reason for manual walk-in start"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = startWalkinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters. Reason is mandatory for staff manual start." },
        { status: 400 }
      );
    }

    const db = getScopedDb(DEFAULT_TENANT_ID);
    const session = await db.startSession({
      resourceId: parsed.data.resourceId,
      customerPhone: parsed.data.phone,
      customerName: parsed.data.customerName,
      startedBy: "staff",
      staffUserId: "usr-staff-1",
      notes: parsed.data.reason,
    });

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to start walk-in session" },
      { status: 500 }
    );
  }
}

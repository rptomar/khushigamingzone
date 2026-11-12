import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { z } from "zod";

const startSessionSchema = z.object({
  phone: z.string().min(10).max(15),
  customerName: z.string().optional(),
  planId: z.string().optional(),
  planName: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deviceToken: string }> }
) {
  try {
    const { deviceToken } = await params;
    const body = await req.json();
    const parsed = startSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid start parameters" }, { status: 400 });
    }

    const db = getScopedDb(DEFAULT_TENANT_ID);
    const resource = await db.getResourceByDeviceToken(deviceToken);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found for device token" }, { status: 404 });
    }

    const session = await db.startSession({
      resourceId: resource.id,
      customerPhone: parsed.data.phone,
      customerName: parsed.data.customerName,
      planId: parsed.data.planId,
      planName: parsed.data.planName,
      startedBy: "customer",
    });

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to start session" }, { status: 500 });
  }
}


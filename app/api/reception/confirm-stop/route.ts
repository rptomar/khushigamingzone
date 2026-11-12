import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { z } from "zod";

const confirmStopSchema = z.object({
  sessionId: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = confirmStopSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid session id" }, { status: 400 });
    }

    const db = getScopedDb(DEFAULT_TENANT_ID);
    const result = await db.confirmStopSession(parsed.data.sessionId, {
      id: "usr-staff-1",
      name: "Ramesh Receptionist",
      role: "receptionist",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to confirm stop" },
      { status: 500 }
    );
  }
}


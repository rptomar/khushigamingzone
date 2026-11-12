import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID } from "@/lib/db/mock-store";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ deviceToken: string }> }
) {
  try {
    const { deviceToken } = await params;
    const db = getScopedDb(DEFAULT_TENANT_ID);
    const resource = await db.getResourceByDeviceToken(deviceToken);

    if (!resource || !resource.currentSessionId) {
      return NextResponse.json({ error: "No active session on this device" }, { status: 400 });
    }

    const session = await db.requestStopSession(
      resource.currentSessionId,
      "Customer pressed End Session on tablet kiosk"
    );

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to request session stop" }, { status: 500 });
  }
}


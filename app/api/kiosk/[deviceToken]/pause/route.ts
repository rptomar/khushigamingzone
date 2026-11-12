import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { DEFAULT_TENANT_ID, mockStore } from "@/lib/db/mock-store";

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

    const session = await db.getSessionById(resource.currentSessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const now = new Date();
    if (session.status === "active") {
      session.status = "paused";
      session.lastPausedAt = now.toISOString();
    } else if (session.status === "paused") {
      session.status = "active";
      if (session.lastPausedAt) {
        const pauseDelta = Math.floor(
          (now.getTime() - new Date(session.lastPausedAt).getTime()) / 1000
        );
        session.pausedTotalSec += pauseDelta;
        session.lastPausedAt = null;
      }
    }

    mockStore.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      actorId: session.customerId,
      actorName: session.customerName,
      actorRole: "customer",
      action: session.status === "paused" ? "pause_session" : "resume_session",
      entity: "session",
      entityId: session.id,
      reason: "Kiosk toggle pause button",
      createdAt: now.toISOString(),
    });

    return NextResponse.json({ success: true, session });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to toggle pause" }, { status: 500 });
  }
}

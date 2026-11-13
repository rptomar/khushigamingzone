import { NextRequest, NextResponse } from "next/server";
import { mockStore, DEFAULT_TENANT_ID } from "@/lib/db/mock-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const alerts = mockStore.alerts
      .filter((a) => a.tenantId === DEFAULT_TENANT_ID)
      .sort((a, b) => {
        if (a.resolved !== b.resolved) return a.resolved ? 1 : -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    return NextResponse.json({ alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { alertId, resolved, notes } = body;

    const alert = mockStore.alerts.find(
      (a) => a.tenantId === DEFAULT_TENANT_ID && a.id === alertId
    );

    if (!alert) {
      return NextResponse.json({ error: "Alert not found" }, { status: 404 });
    }

    alert.resolved = resolved !== undefined ? resolved : true;
    alert.resolvedAt = alert.resolved ? new Date().toISOString() : undefined;
    alert.resolvedBy = "Owner Admin";

    // Add audit log
    mockStore.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      actorId: "owner_admin",
      actorName: "Ps07 Owner",
      actorRole: "owner",
      action: "resolve_alert",
      entity: "alert",
      entityId: alert.id,
      reason: notes || `Owner marked alert '${alert.type}' as resolved`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


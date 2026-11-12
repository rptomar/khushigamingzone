import { NextResponse } from "next/server";
import { mockStore, DEFAULT_TENANT_ID } from "@/lib/db/mock-store";

export async function GET() {
  const devices = mockStore.resources.map((r) => ({
    resourceId: r.id,
    resourceName: r.name,
    typeCode: r.typeCode,
    status: r.status,
    deviceToken: r.deviceToken,
    kioskUrl: `/kiosk/${r.deviceToken}`,
    lastSeenAt: new Date().toISOString(),
    active: r.active,
  }));

  return NextResponse.json({ devices });
}

export async function POST(req: Request) {
  try {
    const { resourceId } = await req.json();
    const resource = mockStore.resources.find((r) => r.id === resourceId);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Regenerate device token (revoking previous)
    const newToken = `kiosk-${resource.typeCode}-${Math.floor(100000 + Math.random() * 900000)}`;
    resource.deviceToken = newToken;

    mockStore.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      actorId: "usr-owner-1",
      actorName: "Owner",
      actorRole: "owner",
      action: "regenerate_device_token",
      entity: "device",
      entityId: resource.id,
      reason: `Rotated kiosk device token for ${resource.name}`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      resourceId: resource.id,
      deviceToken: newToken,
      kioskUrl: `/kiosk/${newToken}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update device token" }, { status: 500 });
  }
}


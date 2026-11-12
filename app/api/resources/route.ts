import { NextResponse } from "next/server";
import { getScopedDb } from "@/lib/db/scoped";
import { mockStore, DEFAULT_TENANT_ID, DEFAULT_OUTLET_ID } from "@/lib/db/mock-store";
import { z } from "zod";

const createResourceSchema = z.object({
  name: z.string().min(2),
  typeCode: z.enum(["snooker", "pool", "ps5", "table_tennis", "carrom", "arcade", "other"]),
  hourlyRatePaise: z.number().int().positive(),
  outletId: z.string().default(DEFAULT_OUTLET_ID),
  deviceToken: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId") || DEFAULT_TENANT_ID;
  const db = getScopedDb(tenantId);
  const resources = await db.getResources();

  return NextResponse.json({ resources });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createResourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid resource parameters", details: parsed.error.format() }, { status: 400 });
    }

    const { name, typeCode, hourlyRatePaise, outletId } = parsed.data;
    const resourceId = `res-${typeCode}-${Date.now()}`;
    const deviceToken = parsed.data.deviceToken || `kiosk-${typeCode}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newResource = {
      id: resourceId,
      tenantId: DEFAULT_TENANT_ID,
      outletId,
      typeId: `type-${typeCode}`,
      typeCode,
      name,
      status: "available" as const,
      hourlyRatePaise,
      currentSessionId: null,
      active: true,
      deviceToken,
    };

    mockStore.resources.push(newResource);

    mockStore.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      actorId: "usr-owner-1",
      actorName: "Owner",
      actorRole: "owner",
      action: "create_resource",
      entity: "resource",
      entityId: resourceId,
      reason: `Added new table/station: ${name} (${typeCode}) at ${hourlyRatePaise / 100}/hr`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, resource: newResource });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create resource" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, name, hourlyRatePaise, status } = body;

    const resource = mockStore.resources.find((r) => r.id === id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (name) resource.name = name;
    if (hourlyRatePaise !== undefined) resource.hourlyRatePaise = hourlyRatePaise;
    if (status) resource.status = status;

    return NextResponse.json({ success: true, resource });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update resource" }, { status: 500 });
  }
}


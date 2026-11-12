import { NextRequest, NextResponse } from "next/server";
import { mockStore, DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { z } from "zod";

export const runtime = "nodejs";

const occupancySchema = z.object({
  resourceId: z.string().optional(),
  tableName: z.string().optional(),
  powerWatts: z.number().min(0),
  deviceIp: z.string().optional(),
  plugId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = occupancySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid sensor payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { resourceId, tableName, powerWatts } = parsed.data;

    // Lookup resource
    const resource = mockStore.resources.find(
      (r) =>
        r.tenantId === DEFAULT_TENANT_ID &&
        (r.id === resourceId || (tableName && r.name.toLowerCase().includes(tableName.toLowerCase())))
    );

    if (!resource) {
      return NextResponse.json(
        { error: "Target gaming resource not found for sensor" },
        { status: 404 }
      );
    }

    // Anti-theft rule: Table drawing power (> 25 Watts) while status is AVAILABLE
    const isDrawingPower = powerWatts > 25;
    const hasNoSession = resource.status === "available" || !resource.currentSessionId;

    if (isDrawingPower && hasNoSession) {
      const alertId = `alert-power-${Date.now()}`;
      const alertMessage = `CRITICAL ANOMALY: ${resource.name} is drawing ${powerWatts.toFixed(0)}W of power, but NO active kiosk session is registered! Staff or customer suspected of playing unmetered.`;

      // Check if duplicate alert within last 10 mins
      const existing = mockStore.alerts.find(
        (a) =>
          a.resourceId === resource.id &&
          a.type === "unmetered_power_draw" &&
          !a.resolved &&
          Date.now() - new Date(a.createdAt).getTime() < 600000
      );

      if (!existing) {
        mockStore.alerts.unshift({
          id: alertId,
          tenantId: DEFAULT_TENANT_ID,
          outletId: resource.outletId,
          resourceId: resource.id,
          type: "unmetered_power_draw",
          severity: "critical",
          message: alertMessage,
          payload: { powerWatts, resourceName: resource.name },
          resolved: false,
          createdAt: new Date().toISOString(),
        });

        // Audit log
        mockStore.auditLogs.unshift({
          id: `audit-${Date.now()}`,
          tenantId: DEFAULT_TENANT_ID,
          actorId: "smart_plug_sensor",
          actorName: "IoT Power Sensor",
          actorRole: "system",
          action: "power_anomaly_detected",
          entity: "resource",
          entityId: resource.id,
          reason: alertMessage,
          createdAt: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        status: "anomaly_flagged",
        alertCreated: !existing,
        resourceId: resource.id,
        powerWatts,
        warning: "Unmetered power consumption logged",
      });
    }

    return NextResponse.json({
      status: "normal",
      resourceId: resource.id,
      powerWatts,
      tableStatus: resource.status,
    });
  } catch (error: any) {
    console.error("Occupancy sensor error:", error);
    return NextResponse.json(
      { error: "Occupancy sensor processing error", details: error.message },
      { status: 500 }
    );
  }
}


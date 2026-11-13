import { NextRequest, NextResponse } from "next/server";
import { mockStore, MockTenant } from "@/lib/db/mock-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    const tenants = mockStore.tenants;

    const totalTenants = tenants.length;
    const activeTenants = tenants.filter((t) => t.status === "active").length;
    const totalOutlets = tenants.reduce((acc, t) => acc + t.outletsCount, 0);
    const totalTables = tenants.reduce((acc, t) => acc + t.tablesCount, 0);
    const mrrPaise = tenants.reduce((acc, t) => acc + (t.status === "active" ? t.monthlyFeePaise : 0), 0);
    const arrPaise = mrrPaise * 12;

    return NextResponse.json({
      tenants,
      metrics: {
        totalTenants,
        activeTenants,
        totalOutlets,
        totalTables,
        mrrPaise,
        arrPaise,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      slug,
      outletsCount,
      tablesCount,
      planName,
      monthlyFeeRupees,
      ownerEmail,
      ownerPhone,
      city,
    } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Tenant name and slug are required" }, { status: 400 });
    }

    const tenantId = `tenant-${slug.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;

    const newTenant: MockTenant = {
      id: tenantId,
      name,
      slug,
      status: "active",
      planName: planName || "Professional (₹4,999/mo)",
      monthlyFeePaise: (monthlyFeeRupees || 4999) * 100,
      outletsCount: parseInt(outletsCount) || 1,
      tablesCount: parseInt(tablesCount) || 6,
      ownerEmail: ownerEmail || "owner@example.com",
      ownerPhone: ownerPhone || "9876543210",
      city: city || "Delhi NCR",
      joinedAt: new Date().toISOString(),
    };

    mockStore.tenants.push(newTenant);

    // Audit log
    mockStore.auditLogs.unshift({
      id: `audit-tenant-${Date.now()}`,
      tenantId: "tenant-kgz-001",
      actorId: "reseller_super_admin",
      actorName: "Ps07 HQ Reseller",
      actorRole: "reseller",
      action: "onboard_tenant",
      entity: "tenant",
      entityId: newTenant.id,
      reason: `Onboarded new gaming zone tenant '${name}' on ${newTenant.planName}`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, tenant: newTenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, status } = body;

    const tenant = mockStore.tenants.find((t) => t.id === tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    tenant.status = status;

    mockStore.auditLogs.unshift({
      id: `audit-tenant-status-${Date.now()}`,
      tenantId: "tenant-kgz-001",
      actorId: "reseller_super_admin",
      actorName: "Ps07 HQ Reseller",
      actorRole: "reseller",
      action: "update_tenant_status",
      entity: "tenant",
      entityId: tenant.id,
      reason: `Tenant '${tenant.name}' status changed to '${status}'`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, tenant });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


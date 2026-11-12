import { NextRequest, NextResponse } from "next/server";
import { mockStore, DEFAULT_TENANT_ID, MockMembership } from "@/lib/db/mock-store";
import { formatPaise } from "@/lib/utils";

export const runtime = "nodejs";

const AVAILABLE_PLANS = [
  {
    id: "plan-vip-gold-30",
    name: "VIP Gold Snooker Pass (30 Hours)",
    includedHours: 30,
    pricePaise: 600000, // ₹6,000 (saves 33%)
    validityDays: 60,
    gameType: "snooker",
  },
  {
    id: "plan-pool-pro-20",
    name: "8-Ball Pool Master Pass (20 Hours)",
    includedHours: 20,
    pricePaise: 350000, // ₹3,500
    validityDays: 45,
    gameType: "pool",
  },
  {
    id: "plan-ps5-weekend-15",
    name: "PS5 Lounge Gamer Pass (15 Hours)",
    includedHours: 15,
    pricePaise: 250000, // ₹2,500
    validityDays: 30,
    gameType: "ps5",
  },
  {
    id: "plan-starter-pack-10",
    name: "All-Rounder Starter Pack (10 Hours)",
    includedHours: 10,
    pricePaise: 180000, // ₹1,800
    validityDays: 30,
    gameType: "all",
  },
];

export async function GET() {
  try {
    const memberships = mockStore.memberships.filter((m) => m.tenantId === DEFAULT_TENANT_ID);

    const now = Date.now();
    const enriched = memberships.map((m) => {
      const remainingMinutes = Math.max(0, m.includedMinutes - m.usedMinutes);
      const remainingHours = (remainingMinutes / 60).toFixed(1);
      const totalHours = (m.includedMinutes / 60).toFixed(1);
      const usagePercent = Math.min(100, Math.round((m.usedMinutes / (m.includedMinutes || 1)) * 100));

      const endsTime = new Date(m.endsAt).getTime();
      const daysRemaining = Math.max(0, Math.ceil((endsTime - now) / 86400000));
      const isExpiringSoon = m.status === "active" && daysRemaining <= 7;

      return {
        ...m,
        remainingMinutes,
        remainingHours,
        totalHours,
        usagePercent,
        daysRemaining,
        isExpiringSoon,
      };
    });

    enriched.sort((a, b) => {
      if (a.status !== b.status) return a.status === "active" ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      memberships: enriched,
      availablePlans: AVAILABLE_PLANS,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerPhone, customerName, planId } = body;

    if (!customerPhone) {
      return NextResponse.json({ error: "Customer phone is required" }, { status: 400 });
    }

    const selectedPlan = AVAILABLE_PLANS.find((p) => p.id === planId) || AVAILABLE_PLANS[0];

    // Find or create customer
    let customer = mockStore.customers.find(
      (c) => c.tenantId === DEFAULT_TENANT_ID && c.phone === customerPhone
    );

    if (!customer) {
      customer = {
        id: `cust-${Date.now()}`,
        tenantId: DEFAULT_TENANT_ID,
        phone: customerPhone,
        name: customerName || "VIP Gamer",
        totalSpentPaise: selectedPlan.pricePaise,
        visits: 1,
        createdAt: new Date().toISOString(),
      };
      mockStore.customers.push(customer);
    } else {
      customer.totalSpentPaise += selectedPlan.pricePaise;
      if (customerName && customer.name === "VIP Gamer") {
        customer.name = customerName;
      }
    }

    const now = new Date();
    const endsAt = new Date(now.getTime() + selectedPlan.validityDays * 86400000);

    const newMembership: MockMembership = {
      id: `mem-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      planId: selectedPlan.id,
      name: selectedPlan.name,
      startsAt: now.toISOString(),
      endsAt: endsAt.toISOString(),
      includedMinutes: selectedPlan.includedHours * 60,
      usedMinutes: 0,
      status: "active",
      createdAt: now.toISOString(),
    };

    mockStore.memberships.unshift(newMembership);

    // Record audit log
    mockStore.auditLogs.unshift({
      id: `audit-mem-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      actorId: "owner_admin",
      actorName: "Khushi Owner",
      actorRole: "owner",
      action: "issue_membership_pass",
      entity: "membership",
      entityId: newMembership.id,
      reason: `Issued ${selectedPlan.name} to ${customer.phone} for ${formatPaise(selectedPlan.pricePaise)}`,
      createdAt: now.toISOString(),
    });

    return NextResponse.json({ success: true, membership: newMembership });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { mockStore, DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { formatPaise } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase();

    let customers = mockStore.customers.filter((c) => c.tenantId === DEFAULT_TENANT_ID);

    if (query) {
      customers = customers.filter(
        (c) =>
          c.phone.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          (c.email && c.email.toLowerCase().includes(query))
      );
    }

    // Enrich with membership and wallet info
    const enriched = customers.map((c, idx) => {
      const membership = mockStore.memberships.find(
        (m) => m.customerId === c.id && m.status === "active"
      );

      const walletBalancePaise =
        c.walletBalancePaise !== undefined
          ? c.walletBalancePaise
          : Math.round(((c.visits * 13500) % 250000) / 1000) * 1000;

      const isVip = !!membership || c.totalSpentPaise > 300000;

      const preferredGames = ["Snooker", "8-Ball Pool", "PS5 Lounge", "Arcade"];
      const preferredGame = preferredGames[idx % preferredGames.length];

      return {
        ...c,
        walletBalancePaise,
        isVip,
        preferredGame,
        membership: membership
          ? {
              id: membership.id,
              name: membership.name,
              remainingMinutes: Math.max(0, membership.includedMinutes - membership.usedMinutes),
              endsAt: membership.endsAt,
            }
          : null,
      };
    });

    // Sort by LTV descending
    enriched.sort((a, b) => b.totalSpentPaise - a.totalSpentPaise);

    return NextResponse.json({ customers: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, topUpPaise, notes } = body;

    const customer = mockStore.customers.find(
      (c) => c.tenantId === DEFAULT_TENANT_ID && c.id === customerId
    );

    if (!customer) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    customer.walletBalancePaise = (customer.walletBalancePaise || 0) + (topUpPaise || 0);

    mockStore.auditLogs.unshift({
      id: `audit-topup-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      actorId: "owner_admin",
      actorName: "Owner Admin",
      actorRole: "owner",
      action: "wallet_topup",
      entity: "customer",
      entityId: customer.id,
      reason: `Prepaid wallet topped up with ${formatPaise(topUpPaise)}. Notes: ${notes || "Counter Cash Topup"}`,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, customer });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


import { NextResponse } from "next/server";
import { DEFAULT_TENANT_ID } from "@/lib/db/mock-store";
import { DEFAULT_PRICING_PLANS } from "@/lib/domain/pricing";

const storedPlans = [...DEFAULT_PRICING_PLANS];

export async function GET() {
  return NextResponse.json({ plans: storedPlans });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newPlan = {
      id: `plan-${Date.now()}`,
      tenantId: DEFAULT_TENANT_ID,
      ...body,
      active: true,
    };
    storedPlans.push(newPlan);
    return NextResponse.json({ success: true, plan: newPlan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create plan" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const idx = storedPlans.findIndex((p) => p.id === body.id);
    if (idx >= 0) {
      storedPlans[idx] = { ...storedPlans[idx], ...body };
      return NextResponse.json({ success: true, plan: storedPlans[idx] });
    }
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update plan" }, { status: 500 });
  }
}

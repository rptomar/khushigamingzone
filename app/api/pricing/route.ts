import { NextResponse } from "next/server";
import { DEFAULT_TENANT_ID } from "@/lib/db/mock-store";

// In-memory initial plans
const defaultPricingPlans = [
  {
    id: "plan-snooker-standard",
    tenantId: DEFAULT_TENANT_ID,
    resourceTypeCode: "snooker",
    name: "Snooker Hourly Standard",
    type: "hourly",
    ratePaise: 30000, // ₹300/hr
    minChargePaise: 5000, // ₹50 min charge
    billingIncrementMin: 15,
    rounding: "up",
    graceMin: 3,
    peakRules: {
      enabled: true,
      peakMultiplier: 1.25,
      startHour: 18,
      endHour: 23,
      days: [5, 6, 0], // Fri, Sat, Sun
    },
    active: true,
  },
  {
    id: "plan-pool-standard",
    tenantId: DEFAULT_TENANT_ID,
    resourceTypeCode: "pool",
    name: "English Pool Hourly",
    type: "hourly",
    ratePaise: 20000, // ₹200/hr
    minChargePaise: 4000,
    billingIncrementMin: 15,
    rounding: "up",
    graceMin: 3,
    peakRules: {
      enabled: false,
      peakMultiplier: 1.2,
      startHour: 18,
      endHour: 23,
      days: [5, 6, 0],
    },
    active: true,
  },
  {
    id: "plan-ps5-standard",
    tenantId: DEFAULT_TENANT_ID,
    resourceTypeCode: "ps5",
    name: "PS5 Pro Lounge Gaming",
    type: "hourly",
    ratePaise: 15000, // ₹150/hr
    minChargePaise: 3000,
    billingIncrementMin: 15,
    rounding: "up",
    graceMin: 3,
    peakRules: {
      enabled: true,
      peakMultiplier: 1.2,
      startHour: 17,
      endHour: 22,
      days: [5, 6, 0],
    },
    active: true,
  },
  {
    id: "plan-tt-standard",
    tenantId: DEFAULT_TENANT_ID,
    resourceTypeCode: "table_tennis",
    name: "Table Tennis Olympic",
    type: "hourly",
    ratePaise: 12000, // ₹120/hr
    minChargePaise: 3000,
    billingIncrementMin: 15,
    rounding: "up",
    graceMin: 3,
    peakRules: { enabled: false, peakMultiplier: 1.0, startHour: 0, endHour: 0, days: [] },
    active: true,
  },
  {
    id: "plan-carrom-standard",
    tenantId: DEFAULT_TENANT_ID,
    resourceTypeCode: "carrom",
    name: "Carrom Board Standard",
    type: "hourly",
    ratePaise: 8000, // ₹80/hr
    minChargePaise: 2000,
    billingIncrementMin: 15,
    rounding: "up",
    graceMin: 3,
    peakRules: { enabled: false, peakMultiplier: 1.0, startHour: 0, endHour: 0, days: [] },
    active: true,
  },
];

const storedPlans = [...defaultPricingPlans];

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

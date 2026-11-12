export interface PricingPlanConfig {
  type: "hourly" | "per_minute" | "per_frame" | "package" | "membership";
  ratePaise: number; // For hourly, paise per hour. For per_minute, paise per min.
  minChargePaise: number;
  billingIncrementMin: number; // e.g., 15 mins
  rounding: "up" | "nearest" | "none";
  graceMin: number; // e.g., 3 mins grace before entering next increment
  peakRules?: {
    enabled: boolean;
    peakMultiplier: number; // e.g., 1.25 for 25% peak surge
    startHour: number; // 0-23
    endHour: number; // 0-23
    days: number[]; // 0=Sunday, 6=Saturday
  };
}

export interface ComputeChargeInput {
  plan: PricingPlanConfig;
  startedAt: Date | string;
  endedAt?: Date | string | null;
  pausedSec?: number;
  now?: Date;
  membershipMinutesAvailable?: number;
}

export interface ComputeChargeResult {
  totalElapsedSeconds: number;
  rawMinutes: number;
  billableMinutes: number;
  membershipDeductedMinutes: number;
  billableMinutesAfterMembership: number;
  baseChargePaise: number;
  isPeak: boolean;
  peakMultiplier: number;
  subtotalPaise: number;
  minChargeApplied: boolean;
}

export function computeCharge(input: ComputeChargeInput): ComputeChargeResult {
  const { plan, startedAt, endedAt, pausedSec = 0, now = new Date(), membershipMinutesAvailable = 0 } = input;

  const start = new Date(startedAt);
  const end = endedAt ? new Date(endedAt) : now;

  const rawSeconds = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000) - pausedSec);
  const rawMinutes = rawSeconds / 60;

  if (rawSeconds <= 0) {
    return {
      totalElapsedSeconds: 0,
      rawMinutes: 0,
      billableMinutes: 0,
      membershipDeductedMinutes: 0,
      billableMinutesAfterMembership: 0,
      baseChargePaise: 0,
      isPeak: false,
      peakMultiplier: 1,
      subtotalPaise: 0,
      minChargeApplied: false,
    };
  }

  // 1. Calculate billable minutes according to billing increment & rounding mode
  let billableMinutes = 0;
  const inc = Math.max(1, plan.billingIncrementMin || 1);

  if (plan.rounding === "none") {
    billableMinutes = rawMinutes;
  } else if (plan.rounding === "nearest") {
    billableMinutes = Math.round(rawMinutes / inc) * inc;
  } else {
    // "up" (default enterprise billing) with grace period
    const fullIncrements = Math.floor(rawMinutes / inc);
    const remainder = rawMinutes % inc;

    if (remainder <= plan.graceMin) {
      // Under grace threshold, do not bill next increment
      billableMinutes = Math.max(inc, fullIncrements * inc);
    } else {
      billableMinutes = (fullIncrements + 1) * inc;
    }
  }

  // Ensure at least 1 increment
  billableMinutes = Math.max(inc, billableMinutes);

  // 2. Membership Deduction
  const membershipDeductedMinutes = Math.min(billableMinutes, membershipMinutesAvailable);
  const billableMinutesAfterMembership = Math.max(0, billableMinutes - membershipDeductedMinutes);

  // 3. Peak Hour Detection
  let isPeak = false;
  let peakMultiplier = 1;

  if (plan.peakRules && plan.peakRules.enabled) {
    const dayOfWeek = end.getDay();
    const hour = end.getHours();
    const isPeakDay = plan.peakRules.days.includes(dayOfWeek);
    const isPeakHour = hour >= plan.peakRules.startHour && hour < plan.peakRules.endHour;

    if (isPeakDay && isPeakHour) {
      isPeak = true;
      peakMultiplier = plan.peakRules.peakMultiplier || 1.25;
    }
  }

  // 4. Rate computation
  let perMinuteRatePaise = 0;
  if (plan.type === "hourly") {
    perMinuteRatePaise = plan.ratePaise / 60;
  } else if (plan.type === "per_minute") {
    perMinuteRatePaise = plan.ratePaise;
  } else {
    // per_frame or package fixed rate
    perMinuteRatePaise = plan.ratePaise / 60;
  }

  const baseChargePaise = Math.round(billableMinutesAfterMembership * perMinuteRatePaise);
  let subtotalPaise = Math.round(baseChargePaise * peakMultiplier);
  let minChargeApplied = false;

  // If session was played and not 100% covered by membership, apply min charge
  if (billableMinutesAfterMembership > 0 && subtotalPaise < plan.minChargePaise) {
    subtotalPaise = plan.minChargePaise;
    minChargeApplied = true;
  } else if (billableMinutesAfterMembership === 0 && membershipDeductedMinutes > 0) {
    // Completely covered by membership
    subtotalPaise = 0;
    minChargeApplied = false;
  }

  return {
    totalElapsedSeconds: rawSeconds,
    rawMinutes,
    billableMinutes,
    membershipDeductedMinutes,
    billableMinutesAfterMembership,
    baseChargePaise,
    isPeak,
    peakMultiplier,
    subtotalPaise,
    minChargeApplied,
  };
}

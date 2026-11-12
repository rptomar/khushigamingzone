import { describe, it, expect } from "vitest";
import { paiseToRupees, rupeesToPaise, computeGst, applyDiscount } from "../lib/domain/money";
import { computeCharge, PricingPlanConfig } from "../lib/domain/pricing";
import {
  validateSessionTransition,
  canTransition,
  SessionDomainError,
  computeElapsedFromEvents,
  SessionTimelineEvent,
} from "../lib/domain/session-machine";

describe("Money Utilities", () => {
  it("converts between rupees and paise accurately", () => {
    expect(paiseToRupees(30000)).toBe(300);
    expect(rupeesToPaise(199.5)).toBe(19950);
  });

  it("calculates 18% GST correctly on paise", () => {
    const { subtotalPaise, gstPaise, totalPaise } = computeGst(10000, 18);
    expect(subtotalPaise).toBe(10000);
    expect(gstPaise).toBe(1800);
    expect(totalPaise).toBe(11800);
  });

  it("applies discounts without dropping below zero", () => {
    expect(applyDiscount(5000, 2000)).toBe(3000);
    expect(applyDiscount(5000, 7000)).toBe(0);
  });
});

describe("Pricing Engine", () => {
  const standardHourlyPlan: PricingPlanConfig = {
    type: "hourly",
    ratePaise: 30000, // ₹300/hr
    minChargePaise: 5000, // ₹50 min charge
    billingIncrementMin: 15,
    rounding: "up",
    graceMin: 3,
  };

  it("bills exactly 1 hour at 30000 paise (₹300)", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T11:00:00Z");

    const result = computeCharge({
      plan: standardHourlyPlan,
      startedAt: start,
      endedAt: end,
    });

    expect(result.rawMinutes).toBe(60);
    expect(result.billableMinutes).toBe(60);
    expect(result.subtotalPaise).toBe(30000);
    expect(result.minChargeApplied).toBe(false);
  });

  it("respects grace minutes (17 mins with 15 min increment and 3 min grace bills 15 min)", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T10:17:00Z"); // 17 mins elapsed = 15m + 2m (<= 3m grace)

    const result = computeCharge({
      plan: standardHourlyPlan,
      startedAt: start,
      endedAt: end,
    });

    expect(result.rawMinutes).toBe(17);
    expect(result.billableMinutes).toBe(15);
    expect(result.subtotalPaise).toBe(7500); // 15 mins of ₹300 = ₹75
  });

  it("applies minimum charge if computed charge is lower", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T10:05:00Z"); // 5 mins

    const result = computeCharge({
      plan: standardHourlyPlan,
      startedAt: start,
      endedAt: end,
    });

    // 15 min base would be ₹75, but let's test a plan with higher min charge
    const highMinPlan: PricingPlanConfig = {
      ...standardHourlyPlan,
      minChargePaise: 10000, // ₹100 min charge
    };

    const minResult = computeCharge({
      plan: highMinPlan,
      startedAt: start,
      endedAt: end,
    });

    expect(minResult.minChargeApplied).toBe(true);
    expect(minResult.subtotalPaise).toBe(10000);
  });

  it("deducts membership minutes completely when sufficient balance exists", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T11:00:00Z"); // 60 mins

    const result = computeCharge({
      plan: standardHourlyPlan,
      startedAt: start,
      endedAt: end,
      membershipMinutesAvailable: 120,
    });

    expect(result.billableMinutes).toBe(60);
    expect(result.membershipDeductedMinutes).toBe(60);
    expect(result.billableMinutesAfterMembership).toBe(0);
    expect(result.subtotalPaise).toBe(0);
  });

  it("handles partial membership deduction", () => {
    const start = new Date("2026-01-01T10:00:00Z");
    const end = new Date("2026-01-01T11:30:00Z"); // 90 mins

    const result = computeCharge({
      plan: standardHourlyPlan,
      startedAt: start,
      endedAt: end,
      membershipMinutesAvailable: 60,
    });

    expect(result.billableMinutes).toBe(90);
    expect(result.membershipDeductedMinutes).toBe(60);
    expect(result.billableMinutesAfterMembership).toBe(30);
    expect(result.subtotalPaise).toBe(15000); // 30 mins = ₹150
  });

  it("applies peak hour surge multiplier when rules match", () => {
    // Friday (day 5) at 19:00 (7 PM)
    const start = new Date("2026-01-02T19:00:00+05:30");
    const end = new Date("2026-01-02T20:00:00+05:30");

    const peakPlan: PricingPlanConfig = {
      ...standardHourlyPlan,
      peakRules: {
        enabled: true,
        peakMultiplier: 1.2, // 20% surge
        startHour: 18,
        endHour: 23,
        days: [5, 6, 0],
      },
    };

    const result = computeCharge({
      plan: peakPlan,
      startedAt: start,
      endedAt: end,
    });

    expect(result.isPeak).toBe(true);
    expect(result.peakMultiplier).toBe(1.2);
    expect(result.subtotalPaise).toBe(36000); // ₹300 * 1.2 = ₹360 = 36000 paise
  });
});

describe("Session State Machine", () => {
  it("allows legal forward transitions", () => {
    expect(canTransition("idle", "active")).toBe(true);
    expect(canTransition("active", "paused")).toBe(true);
    expect(canTransition("paused", "active")).toBe(true);
    expect(canTransition("active", "stopping")).toBe(true);
    expect(canTransition("stopping", "billed")).toBe(true);
    expect(canTransition("billed", "paid")).toBe(true);
  });

  it("throws on illegal transitions", () => {
    expect(() => validateSessionTransition("idle", "paid")).toThrow(SessionDomainError);
    expect(() => validateSessionTransition("paid", "active")).toThrow(SessionDomainError);
    expect(() => validateSessionTransition("idle", "paused")).toThrow(SessionDomainError);
  });

  it("computes exact elapsed active vs paused seconds from event sequence", () => {
    const t0 = new Date("2026-01-01T10:00:00Z");
    const t1 = new Date("2026-01-01T10:30:00Z"); // paused after 30 mins
    const t2 = new Date("2026-01-01T10:40:00Z"); // resumed after 10 mins pause
    const t3 = new Date("2026-01-01T11:00:00Z"); // stop requested after another 20 mins

    const events: SessionTimelineEvent[] = [
      { eventType: "start", serverTimestamp: t0, actorRole: "customer" },
      { eventType: "pause", serverTimestamp: t1, actorRole: "customer" },
      { eventType: "resume", serverTimestamp: t2, actorRole: "customer" },
      { eventType: "stop_requested", serverTimestamp: t3, actorRole: "customer" },
    ];

    const result = computeElapsedFromEvents(events, t3);
    expect(result.activeSeconds).toBe(50 * 60); // 30m + 20m = 50m active
    expect(result.pausedSeconds).toBe(10 * 60); // 10m paused
    expect(result.currentState).toBe("stopping");
  });
});


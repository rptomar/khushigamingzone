/**
 * Money utilities: All calculations strictly in integer paise (1 INR = 100 paise).
 * Zero floating-point roundoff errors.
 */

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function paiseToRupeesFormatted(paise: number): string {
  const rupees = paise / 100;
  return rupees.toLocaleString("en-IN", {
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function computeGst(
  subtotalPaise: number,
  gstRatePercent: number = 18
): { subtotalPaise: number; gstPaise: number; totalPaise: number } {
  if (subtotalPaise <= 0) {
    return { subtotalPaise: 0, gstPaise: 0, totalPaise: 0 };
  }
  const gstPaise = Math.round(subtotalPaise * (gstRatePercent / 100));
  const totalPaise = subtotalPaise + gstPaise;
  return {
    subtotalPaise,
    gstPaise,
    totalPaise,
  };
}

export function applyDiscount(amountPaise: number, discountPaise: number): number {
  return Math.max(0, amountPaise - discountPaise);
}

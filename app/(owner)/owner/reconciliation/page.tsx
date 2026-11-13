"use client";

import React, { useState } from "react";
import { useLive } from "@/lib/hooks/useLive";
import { formatPaise } from "@/lib/utils";
import {
  Banknote,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Calculator,
  RefreshCw,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CashReconciliationPage() {
  const { data, isLoading, mutate } = useLive<any>("/api/owner/reconciliation", {
    refreshInterval: 5000,
  });

  const [notes500, setNotes500] = useState<number>(0);
  const [notes200, setNotes200] = useState<number>(0);
  const [notes100, setNotes100] = useState<number>(0);
  const [notes50, setNotes50] = useState<number>(0);
  const [notes20, setNotes20] = useState<number>(0);
  const [coins10, setCoins10] = useState<number>(0);

  const [auditedBy, setAuditedBy] = useState("Ps07 Owner (Admin)");
  const [auditNotes, setAuditNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const expectedPaise = data?.expectedCashPaise || 420000;

  // Calculate physical total in rupees and paise
  const countedRupees =
    notes500 * 500 +
    notes200 * 200 +
    notes100 * 100 +
    notes50 * 50 +
    notes20 * 20 +
    coins10 * 10;

  const countedPaise = countedRupees * 100;
  const variancePaise = countedPaise - expectedPaise;

  const handleLockAudit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/owner/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedPaise,
          countedPaise,
          variancePaise,
          notes: auditNotes || "End of day drawer balance check",
          auditedBy,
        }),
      });

      if (!res.ok) throw new Error("Failed to save cash reconciliation");

      toast.success("Cash drawer audit locked successfully!", {
        description: `Verified ${formatPaise(countedPaise)} against expected ${formatPaise(expectedPaise)}.`,
      });
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit cash audit");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick preset: fill exact expected notes
  const fillExactPreset = () => {
    const totalRs = expectedPaise / 100;
    const n500 = Math.floor(totalRs / 500);
    const rem500 = totalRs % 500;
    const n100 = Math.floor(rem500 / 100);
    const rem100 = rem500 % 100;
    const n50 = Math.floor(rem100 / 50);

    setNotes500(n500);
    setNotes200(0);
    setNotes100(n100);
    setNotes50(n50);
    setNotes20(0);
    setCoins10(0);
    toast.info("Auto-filled physical counts to match expected total");
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Banknote className="w-6 h-6 text-amber-400" />
            Daily Cash Drawer Reconciliation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare physically counted drawer cash against system-recorded walk-ins to eliminate pocketing.
          </p>
        </div>

        <Button
          onClick={fillExactPreset}
          variant="outline"
          size="sm"
          className="gap-2 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Quick Match Expected (Demo)</span>
        </Button>
      </div>

      {/* KPI Variance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Expected System Cash */}
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Expected System Cash</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {formatPaise(expectedPaise)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Sum of all cash bills issued at reception today
          </p>
        </div>

        {/* Counted Cash */}
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Physical Cash Counted</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
            {formatPaise(countedPaise)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Total calculated from currency denomination grid
          </p>
        </div>

        {/* Variance Indicator */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            variancePaise === 0
              ? "bg-emerald-950/20 border-emerald-500/40"
              : variancePaise < 0
              ? "bg-rose-950/20 border-rose-500/40"
              : "bg-amber-950/20 border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Variance / Discrepancy</span>
            {variancePaise === 0 ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : variancePaise < 0 ? (
              <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <Coins className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div
            className={`text-2xl sm:text-3xl font-black font-mono ${
              variancePaise === 0
                ? "text-emerald-400"
                : variancePaise < 0
                ? "text-rose-400"
                : "text-amber-400"
            }`}
          >
            {variancePaise > 0 ? `+${formatPaise(variancePaise)}` : formatPaise(variancePaise)}
          </div>
          <p className="text-[11px] mt-2 font-medium">
            {variancePaise === 0 ? (
              <span className="text-emerald-400">Drawer Perfectly Balanced</span>
            ) : variancePaise < 0 ? (
              <span className="text-rose-400">Cash shortage! Audit alert flagged.</span>
            ) : (
              <span className="text-amber-400">Excess cash recorded in register.</span>
            )}
          </p>
        </div>
      </div>

      {/* Main Grid: Denomination Calculator & Sign-off Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Physical Currency Denominations Grid */}
        <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-cyan-400" />
            Physical Currency Denominations
          </h2>
          <p className="text-xs text-slate-400">
            Enter the quantity of each banknote and coin counted in the physical cash drawer.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <label className="text-slate-400 font-bold">₹500 Notes</label>
              <Input
                type="number"
                min="0"
                value={notes500 || ""}
                onChange={(e) => setNotes500(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/60 border-white/10 text-white font-mono h-8"
              />
              <div className="text-[11px] text-slate-500 font-mono text-right">
                = ₹{(notes500 * 500).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <label className="text-slate-400 font-bold">₹200 Notes</label>
              <Input
                type="number"
                min="0"
                value={notes200 || ""}
                onChange={(e) => setNotes200(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/60 border-white/10 text-white font-mono h-8"
              />
              <div className="text-[11px] text-slate-500 font-mono text-right">
                = ₹{(notes200 * 200).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <label className="text-slate-400 font-bold">₹100 Notes</label>
              <Input
                type="number"
                min="0"
                value={notes100 || ""}
                onChange={(e) => setNotes100(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/60 border-white/10 text-white font-mono h-8"
              />
              <div className="text-[11px] text-slate-500 font-mono text-right">
                = ₹{(notes100 * 100).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <label className="text-slate-400 font-bold">₹50 Notes</label>
              <Input
                type="number"
                min="0"
                value={notes50 || ""}
                onChange={(e) => setNotes50(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/60 border-white/10 text-white font-mono h-8"
              />
              <div className="text-[11px] text-slate-500 font-mono text-right">
                = ₹{(notes50 * 50).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <label className="text-slate-400 font-bold">₹20 Notes</label>
              <Input
                type="number"
                min="0"
                value={notes20 || ""}
                onChange={(e) => setNotes20(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/60 border-white/10 text-white font-mono h-8"
              />
              <div className="text-[11px] text-slate-500 font-mono text-right">
                = ₹{(notes20 * 20).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <label className="text-slate-400 font-bold">₹10 Coins / Notes</label>
              <Input
                type="number"
                min="0"
                value={coins10 || ""}
                onChange={(e) => setCoins10(parseInt(e.target.value) || 0)}
                placeholder="0"
                className="bg-black/60 border-white/10 text-white font-mono h-8"
              />
              <div className="text-[11px] text-slate-500 font-mono text-right">
                = ₹{(coins10 * 10).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* Manager Sign-Off Card */}
        <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] flex flex-col justify-between space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4 text-amber-400" />
              Audit Sign-Off & Lock
            </h2>
            <p className="text-xs text-slate-400">
              Submit daily balance to create an immutable entry in the anti-theft audit log.
            </p>

            <div className="space-y-3 mt-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Audited By (Name & Role)</label>
                <Input
                  value={auditedBy}
                  onChange={(e) => setAuditedBy(e.target.value)}
                  className="bg-black/40 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Manager Audit Notes / Variance Justification
                </label>
                <textarea
                  rows={4}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder="e.g., Drawer verified at shift end. All bills reconciled cleanly."
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          <Button
            onClick={handleLockAudit}
            disabled={isSubmitting}
            className="w-full gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs h-10 mt-4 shadow-lg shadow-amber-950/40"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Lock Daily Cash Audit</span>
          </Button>
        </div>
      </div>

      {/* Today's Cash Transactions Table */}
      <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-400" />
          Today&apos;s System Cash Payments
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt / Invoice</th>
                <th className="py-3 px-4">Station / Table</th>
                <th className="py-3 px-4">Collected By</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {(data?.transactions || []).map((t: any) => (
                <tr key={t.id} className="hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-mono font-semibold text-cyan-300">
                    #{t.invoiceNo}
                  </td>
                  <td className="py-3 px-4 text-slate-200 font-medium">
                    {t.tableName}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {t.receivedBy}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(t.createdAt).toLocaleTimeString("en-IN")}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                    {formatPaise(t.amountPaise)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


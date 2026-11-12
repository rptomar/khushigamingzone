"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/hooks/useLive";
import { formatPaise } from "@/lib/utils";
import {
  Crown,
  Clock,
  Calendar,
  AlertTriangle,
  Plus,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Phone,
  Tag,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MembershipsPage() {
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("plan-vip-gold-30");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, mutate } = useLive<any>("/api/owner/memberships", {
    refreshInterval: 5000,
  });

  const memberships = data?.memberships || [];
  const availablePlans = data?.availablePlans || [];

  const activeCount = memberships.filter((m: any) => m.status === "active").length;
  const expiringSoon = memberships.filter((m: any) => m.isExpiringSoon);

  const handleIssuePass = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/owner/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone: customerPhone.replace(/\D/g, "").slice(-10),
          customerName: customerName || "VIP Gamer",
          planId: selectedPlanId,
        }),
      });

      if (!res.ok) throw new Error("Failed to issue membership pass");

      toast.success("VIP Membership Pass Issued!", {
        description: `Successfully activated for +91 ${customerPhone}.`,
      });
      setIssueModalOpen(false);
      setCustomerPhone("");
      setCustomerName("");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to issue pass");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Crown className="w-6 h-6 text-amber-400" />
            Memberships & VIP Passes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pre-purchased gaming packages, recurring VIP subscriptions, and automated hour deductions.
          </p>
        </div>

        <Button
          onClick={() => setIssueModalOpen(true)}
          size="sm"
          className="gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New VIP Pass</span>
        </Button>
      </div>

      {/* Expiring Soon Banner */}
      {expiringSoon.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-amber-300 text-xs">
                {expiringSoon.length} Passes Expiring Within 7 Days
              </div>
              <p className="text-[11px] text-slate-400">
                Staff can remind customers at reception to renew for loyalty discounts.
              </p>
            </div>
          </div>
          <Link href="/reception" target="_blank">
            <Button variant="outline" size="sm" className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/10">
              Reception View
            </Button>
          </Link>
        </div>
      )}

      {/* Available Plans Catalog Cards */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Tag className="w-4 h-4 text-violet-400" />
          VIP Package Tiers
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {availablePlans.map((plan: any) => (
            <div
              key={plan.id}
              className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08] hover:border-violet-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                  {plan.gameType}
                </span>
                <h3 className="font-bold text-white text-sm mt-1">{plan.name}</h3>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-3">
                  {formatPaise(plan.pricePaise)}
                </div>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{plan.includedHours} Hours Included</span>
                </div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>{plan.validityDays} Days Validity</span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setIssueModalOpen(true);
                }}
                className="w-full mt-5 text-xs border-white/10 hover:bg-violet-600/20 text-violet-300"
              >
                <span>Issue This Pass</span>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Active Passes Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            Active Customer Passes ({activeCount})
          </h2>
          <span className="text-xs text-slate-400">Auto-deducted at Kiosk</span>
        </div>

        {isLoading && !data ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading memberships...</p>
          </div>
        ) : memberships.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0E0E18] border border-white/[0.08] text-center text-slate-400 text-xs">
            No VIP memberships issued yet. Click &apos;Issue New VIP Pass&apos; to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memberships.map((m: any) => {
              const isActive = m.status === "active";
              const isExpiring = m.isExpiringSoon;

              return (
                <div
                  key={m.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isExpiring
                      ? "bg-amber-950/20 border-amber-500/40"
                      : isActive
                      ? "bg-[#0E0E18] border-white/[0.08] hover:border-cyan-500/30"
                      : "bg-white/[0.01] border-white/[0.05] opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="font-bold text-white text-sm block">
                        {m.customerName}
                      </span>
                      <span className="font-mono text-slate-400 text-xs">
                        +91 {m.customerPhone}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isExpiring
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : isActive
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/[0.05] text-slate-400"
                      }`}
                    >
                      {isExpiring ? "Expiring Soon" : m.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] space-y-2">
                    <div className="text-xs font-semibold text-slate-300 truncate">
                      {m.name}
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Hours Balance</span>
                        <span className="font-mono text-cyan-300 font-bold">
                          {m.remainingHours} / {m.totalHours} hrs left
                        </span>
                      </div>
                      <div className="w-full bg-white/[0.08] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-cyan-400 to-violet-500 h-full rounded-full"
                          style={{
                            width: `${Math.max(5, 100 - m.usagePercent)}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>Expires in {m.daysRemaining} days</span>
                      <span>
                        {new Date(m.endsAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Issue VIP Pass Modal */}
      <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
        <DialogContent className="bg-[#0E0E18] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              Issue VIP Membership Pass
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Customer Mobile Number (10 digits)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs">
                  +91
                </span>
                <Input
                  type="tel"
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="pl-12 bg-black/40 border-white/10 text-white font-mono h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Customer Full Name
              </label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="bg-black/40 border-white/10 text-white h-9"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Select Package Tier
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white text-xs rounded-xl p-2.5 h-10 focus:outline-none focus:border-amber-500"
              >
                {availablePlans.map((p: any) => (
                  <option key={p.id} value={p.id} className="bg-[#0E0E18]">
                    {p.name} — {formatPaise(p.pricePaise)} ({p.includedHours} hrs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIssueModalOpen(false)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleIssuePass}
              disabled={isSubmitting || customerPhone.length < 10}
              className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirm & Issue Pass</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


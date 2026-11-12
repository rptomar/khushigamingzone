"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/hooks/useLive";
import { formatPaise } from "@/lib/utils";
import {
  Users,
  Search,
  Crown,
  Wallet,
  TrendingUp,
  CreditCard,
  Plus,
  RefreshCw,
  Phone,
  Gamepad2,
  Calendar,
  Sparkles,
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

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [topUpAmountRupees, setTopUpAmountRupees] = useState<number>(1000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading, mutate } = useLive<{ customers: any[] }>(
    `/api/owner/customers?q=${encodeURIComponent(search)}`,
    { refreshInterval: 5000 }
  );

  const customers = data?.customers || [];
  const vipCount = customers.filter((c) => c.isVip).length;
  const totalLtvPaise = customers.reduce((sum, c) => sum + c.totalSpentPaise, 0);
  const totalWalletPaise = customers.reduce((sum, c) => sum + (c.walletBalancePaise || 0), 0);

  const handleOpenTopUp = (customer: any) => {
    setSelectedCustomer(customer);
    setTopUpAmountRupees(1000);
    setTopUpModalOpen(true);
  };

  const handleConfirmTopUp = async () => {
    if (!selectedCustomer) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/owner/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          topUpPaise: topUpAmountRupees * 100,
          notes: "Counter prepaid recharge",
        }),
      });

      if (!res.ok) throw new Error("Top up failed");

      toast.success("Wallet recharged successfully!", {
        description: `Added ₹${topUpAmountRupees.toLocaleString("en-IN")} to +91 ${selectedCustomer.phone}.`,
      });
      setTopUpModalOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to top up wallet");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-violet-400" />
            Customer Directory & CRM
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track customer visit frequency, lifetime spend (LTV), prepaid gaming wallets, and VIP privileges.
          </p>
        </div>

        <Link href="/owner/memberships">
          <Button size="sm" className="gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-xs text-white">
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Manage VIP Passes</span>
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Total Registered Gamers</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {customers.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Verified via mobile OTP</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">VIP & Pass Holders</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
            {vipCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Active package subscribers</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Customer LTV (Total Spend)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {formatPaise(totalLtvPaise)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Combined player gross value</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Prepaid Wallet Float</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
            {formatPaise(totalWalletPaise)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Held in player store credit</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative bg-[#0E0E18] p-3 rounded-2xl border border-white/[0.08]">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer phone (+91), name, or email..."
          className="pl-10 bg-black/40 border-white/10 text-xs h-9 text-white placeholder:text-slate-500 rounded-xl"
        />
      </div>

      {/* Customers List Table */}
      <div className="rounded-2xl bg-[#0E0E18] border border-white/[0.08] overflow-hidden">
        {isLoading && !data ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading customer CRM...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No customers match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Privilege Tier</th>
                  <th className="py-3.5 px-4">Visits</th>
                  <th className="py-3.5 px-4">Preferred Game</th>
                  <th className="py-3.5 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3.5 px-4 text-right">Wallet Balance</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {c.name}
                        {c.isVip && (
                          <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        )}
                      </div>
                      <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                        +91 {c.phone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {c.membership ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-3 h-3" /> VIP Member
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {Math.round(c.membership.remainingMinutes / 60)}h remaining
                          </div>
                        </div>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.08]">
                          Regular Player
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                      {c.visits} visits
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-300">
                        <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
                        {c.preferredGame}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatPaise(c.totalSpentPaise)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-300">
                      {formatPaise(c.walletBalancePaise || 0)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenTopUp(c)}
                        className="gap-1 text-[11px] h-7 border-white/10 hover:bg-violet-600/20 text-violet-300"
                      >
                        <Wallet className="w-3 h-3" />
                        <span>Top Up</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Up Wallet Modal */}
      <Dialog open={topUpModalOpen} onOpenChange={setTopUpModalOpen}>
        <DialogContent className="bg-[#0E0E18] border border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-violet-400" />
              Recharge Player Wallet
            </DialogTitle>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-sm">{selectedCustomer.name}</div>
                  <div className="font-mono text-slate-400">+91 {selectedCustomer.phone}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 uppercase">Current Balance</div>
                  <div className="font-mono font-bold text-cyan-400 text-sm">
                    {formatPaise(selectedCustomer.walletBalancePaise || 0)}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Recharge Amount (INR)
                </label>
                <Input
                  type="number"
                  min="100"
                  step="100"
                  value={topUpAmountRupees}
                  onChange={(e) => setTopUpAmountRupees(parseInt(e.target.value) || 0)}
                  className="bg-black/40 border-white/10 text-white font-mono text-base font-bold h-10"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setTopUpAmountRupees(amt)}
                    className={`flex-1 text-xs border-white/10 ${
                      topUpAmountRupees === amt ? "bg-violet-600/30 text-violet-300 border-violet-500" : ""
                    }`}
                  >
                    +₹{amt}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTopUpModalOpen(false)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmTopUp}
              disabled={isSubmitting || topUpAmountRupees <= 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Confirm & Add ₹{topUpAmountRupees}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

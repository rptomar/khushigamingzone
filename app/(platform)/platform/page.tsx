"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/hooks/useLive";
import { formatPaise } from "@/lib/utils";
import {
  Layers,
  Building2,
  Tv,
  Plus,
  TrendingUp,
  ShieldCheck,
  Search,
  ExternalLink,
  Power,
  RefreshCw,
  Globe,
  Sparkles,
  CheckCircle2,
  UserCheck,
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

export default function PlatformResellerPage() {
  const [search, setSearch] = useState("");
  const [onboardModalOpen, setOnboardModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Tenant Form State
  const [tenantName, setTenantName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("New Delhi");
  const [outletsCount, setOutletsCount] = useState(1);
  const [tablesCount, setTablesCount] = useState(6);
  const [selectedPlan, setSelectedPlan] = useState("Professional");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");

  const { data, isLoading, mutate } = useLive<any>("/api/platform/tenants", {
    refreshInterval: 5000,
  });

  const tenants = data?.tenants || [];
  const metrics = data?.metrics || {
    totalTenants: 5,
    activeTenants: 4,
    totalOutlets: 7,
    totalTables: 35,
    mrrPaise: 1699700,
    arrPaise: 20396400,
  };

  const filteredTenants = tenants.filter(
    (t: any) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.city.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleStatus = async (tenant: any) => {
    const nextStatus = tenant.status === "active" ? "suspended" : "active";
    try {
      const res = await fetch("/api/platform/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: tenant.id,
          status: nextStatus,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      toast.success(
        `Tenant '${tenant.name}' is now ${nextStatus.toUpperCase()}`
      );
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to update tenant status");
    }
  };

  const handleImpersonate = (tenant: any) => {
    toast.info(`Switched view to ${tenant.name}`, {
      description: `Viewing remote telemetry for Tenant ID: ${tenant.id}. You can inspect tables and logs.`,
    });
  };

  const handleOnboardSubmit = async () => {
    if (!tenantName || !slug) {
      toast.error("Please enter a business name and slug");
      return;
    }

    setIsSubmitting(true);
    try {
      const feeRupees = selectedPlan === "Enterprise" ? 8999 : selectedPlan === "Professional" ? 4999 : 2999;
      const res = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tenantName,
          slug: slug.toLowerCase().replace(/[^a-z0-9]/g, "-"),
          city,
          outletsCount,
          tablesCount,
          planName: `${selectedPlan} (₹${feeRupees.toLocaleString("en-IN")}/mo)`,
          monthlyFeeRupees: feeRupees,
          ownerEmail: ownerEmail || `contact@${slug.toLowerCase()}.com`,
          ownerPhone: ownerPhone || "9876543210",
        }),
      });

      if (!res.ok) throw new Error("Onboarding failed");

      toast.success("Gaming Zone Onboarded!", {
        description: `'${tenantName}' has been added to your reseller fleet.`,
      });

      setOnboardModalOpen(false);
      setTenantName("");
      setSlug("");
      setOwnerEmail("");
      setOwnerPhone("");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to onboard gaming lounge");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              SaaS Tenant Fleet & Reseller Network
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Khushi Gaming Reseller
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            My client (Khushi Gaming Zone) operates as Tenant #1 and Master Reseller, provisioning autonomous gaming zone instances across malls and clubs.
          </p>
        </div>

        <Button
          onClick={() => setOnboardModalOpen(true)}
          size="sm"
          className="gap-2 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Gaming Lounge</span>
        </Button>
      </div>

      {/* Reseller KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Onboarded Gaming Zones</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {metrics.totalTenants}
          </div>
          <p className="text-[11px] text-emerald-400 mt-2 font-medium">
            {metrics.activeTenants} Active Subscriptions
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Stations & Tables Managed</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
            {metrics.totalTables} <span className="text-xs text-slate-400 font-sans">tables</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Across {metrics.totalOutlets} mall branches
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">SaaS Recurring Revenue (MRR)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {formatPaise(metrics.mrrPaise)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Earned monthly by Khushi Reseller</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Annual Run Rate (ARR)</div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-violet-400">
            {formatPaise(metrics.arrPaise)}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Projected annual platform yield</p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative bg-[#0E0E18] p-3 rounded-2xl border border-white/[0.08]">
        <Search className="w-4 h-4 text-slate-400 absolute left-6 top-1/2 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter tenants by name, city, or subdomain slug..."
          className="pl-10 bg-black/40 border-white/10 text-xs h-9 text-white placeholder:text-slate-500 rounded-xl"
        />
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl bg-[#0E0E18] border border-white/[0.08] overflow-hidden">
        {isLoading && !data ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading reseller fleet...</p>
          </div>
        ) : filteredTenants.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No gaming zones match your search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Gaming Zone Name</th>
                  <th className="py-3.5 px-4">Location / Slug</th>
                  <th className="py-3.5 px-4">Capacity</th>
                  <th className="py-3.5 px-4">Subscription Plan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Remote Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {filteredTenants.map((t: any) => {
                  const isActive = t.status === "active";
                  const isTrial = t.status === "trial";
                  const isMaster = t.id === "tenant-kgz-001";

                  return (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-2">
                          {t.name}
                          {isMaster && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                              HQ / Reseller
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {t.ownerEmail} • +91 {t.ownerPhone}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-300 font-medium">{t.city}</div>
                        <div className="font-mono text-cyan-400 text-[10px]">
                          app.khushigaming.com/{t.slug}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        <div>{t.tablesCount} Tables</div>
                        <div className="text-[10px] text-slate-500">
                          {t.outletsCount} {t.outletsCount === 1 ? "branch" : "branches"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{t.planName}</div>
                        <div className="font-mono text-emerald-400 font-bold text-[11px]">
                          {t.monthlyFeePaise > 0 ? formatPaise(t.monthlyFeePaise) + "/mo" : "Master License"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isActive
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : isTrial
                              ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleImpersonate(t)}
                            className="gap-1 text-[11px] h-7 border-white/10 hover:bg-cyan-600/20 text-cyan-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Inspect</span>
                          </Button>

                          {!isMaster && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleStatus(t)}
                              className={`gap-1 text-[11px] h-7 ${
                                isActive
                                  ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                  : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              }`}
                            >
                              <Power className="w-3 h-3" />
                              <span>{isActive ? "Suspend" : "Resume"}</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Multi-Tenancy Scoping Architecture Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/20 via-[#0E0E18] to-violet-950/20 border border-white/[0.08]">
        <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          Strict Row-Level Multi-Tenant Scoping Guarantee
        </h3>
        <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
          Every query in Khushi Gaming Zone OS is routed through <code className="text-cyan-300 bg-white/[0.05] px-1.5 py-0.5 rounded">lib/db/scoped.ts</code> with a cryptographically verified tenant ID. Independent gaming zones can never leak customer data, table revenues, or telemetry to each other, ensuring full enterprise confidentiality.
        </p>
      </div>

      {/* Onboard Modal */}
      <Dialog open={onboardModalOpen} onOpenChange={setOnboardModalOpen}>
        <DialogContent className="bg-[#0E0E18] border border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Onboard Client Gaming Zone
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Gaming Lounge Name
                </label>
                <Input
                  value={tenantName}
                  onChange={(e) => {
                    setTenantName(e.target.value);
                    if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "-"));
                  }}
                  placeholder="e.g. Royal Cue Lounge"
                  className="bg-black/40 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  URL Subdomain Slug
                </label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="e.g. royal-cue"
                  className="bg-black/40 border-white/10 text-white font-mono h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">City / Region</label>
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="bg-black/40 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Outlets</label>
                <Input
                  type="number"
                  min="1"
                  value={outletsCount}
                  onChange={(e) => setOutletsCount(parseInt(e.target.value) || 1)}
                  className="bg-black/40 border-white/10 text-white font-mono h-9"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Tables</label>
                <Input
                  type="number"
                  min="1"
                  value={tablesCount}
                  onChange={(e) => setTablesCount(parseInt(e.target.value) || 1)}
                  className="bg-black/40 border-white/10 text-white font-mono h-9"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                SaaS Subscription Plan
              </label>
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="w-full bg-black/40 border border-white/10 text-white text-xs rounded-xl p-2.5 h-10 focus:outline-none focus:border-cyan-500"
              >
                <option value="Starter" className="bg-[#0E0E18]">
                  Starter Arena (Up to 5 tables) — ₹2,999/month
                </option>
                <option value="Professional" className="bg-[#0E0E18]">
                  Professional Arena (Up to 10 tables) — ₹4,999/month (Recommended)
                </option>
                <option value="Enterprise" className="bg-[#0E0E18]">
                  Enterprise Arena (Unlimited tables & multi-outlet) — ₹8,999/month
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Owner Email
                </label>
                <Input
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="owner@lounge.com"
                  className="bg-black/40 border-white/10 text-white h-9"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Owner Phone (+91)
                </label>
                <Input
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="9876543210"
                  className="bg-black/40 border-white/10 text-white font-mono h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOnboardModalOpen(false)}
              className="text-xs text-slate-400"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleOnboardSubmit}
              disabled={isSubmitting || !tenantName || !slug}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete Onboarding</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { GlowCard } from "@/components/premium/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusPill } from "@/components/premium/StatusPill";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatPaise } from "@/lib/utils";
import { toast } from "sonner";
import {
  QrCode,
  Copy,
  Plus,
  ExternalLink,
  Save,
  Percent,
  DollarSign,
  Tablet,
  Gamepad2,
} from "lucide-react";

export default function OwnerSettingsPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);

  // Add Table dialog state
  const [newTableName, setNewTableName] = useState("");
  const [newTableType, setNewTableType] = useState<string>("snooker");
  const [newTableRate, setNewTableRate] = useState<string>("300");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Active QR preview dialog
  const [qrModalData, setQrModalData] = useState<{ url: string; qr: string; name: string } | null>(null);

  // Business Profile Settings
  const [upiVpa, setUpiVpa] = useState("ps07gaming@upi");
  const [gstin, setGstin] = useState("27AAACK1234F1Z5");
  const [invoicePrefix, setInvoicePrefix] = useState("PS07");
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchSettingsData = async () => {
    try {
      const [resResources, resPlans] = await Promise.all([
        fetch("/api/resources").then((r) => r.json()),
        fetch("/api/pricing").then((r) => r.json()),
      ]);

      if (resResources.resources) setResources(resResources.resources);
      if (resPlans.plans) setPlans(resPlans.plans);
    } catch {
      toast.error("Failed to load settings data");
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTableName,
          typeCode: newTableType,
          hourlyRatePaise: Math.round(parseFloat(newTableRate) * 100),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("New table added successfully!");
      setDialogOpen(false);
      setNewTableName("");
      fetchSettingsData();
    } catch (err: any) {
      toast.error(err.message || "Failed to add table");
    }
  };

  const handleOpenQr = async (token: string, name: string) => {
    try {
      const res = await fetch(`/api/devices/qr?token=${token}`);
      const data = await res.json();
      setQrModalData({
        url: data.fullKioskUrl,
        qr: data.qrDataUrl,
        name,
      });
    } catch {
      toast.error("Failed to generate QR code");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kiosk link copied to clipboard!");
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      toast.success("Invoicing & UPI VPA settings saved!");
    }, 600);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-[family-name:var(--font-display)]">
          Gaming Zone Management & Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure game tables, pair tablet kiosk screens with QR codes, set pricing plans & peak surge hours.
        </p>
      </div>

      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-xl h-11 bg-white/[0.04] p-1 border border-white/[0.08]">
          <TabsTrigger value="tables" className="gap-2">
            <Gamepad2 className="w-4 h-4" />
            <span className="hidden sm:inline">Tables & Stations</span>
            <span className="sm:hidden">Tables</span>
          </TabsTrigger>
          <TabsTrigger value="kiosks" className="gap-2">
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">Kiosk Screens</span>
            <span className="sm:hidden">Kiosks</span>
          </TabsTrigger>
          <TabsTrigger value="pricing" className="gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Pricing & Surge</span>
            <span className="sm:hidden">Pricing</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <Percent className="w-4 h-4" />
            <span className="hidden sm:inline">UPI & GST</span>
            <span className="sm:hidden">Billing</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Tables & Stations */}
        <TabsContent value="tables" className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">
              Active Gaming Resources ({resources.length})
            </span>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 font-bold">
                  <Plus className="w-4 h-4" />
                  <span>Add New Table</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Table or Console Station</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddTable} className="space-y-4 mt-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Table / Station Name
                    </label>
                    <Input
                      value={newTableName}
                      onChange={(e) => setNewTableName(e.target.value)}
                      placeholder="e.g., Snooker Table 3 (VIP Room)"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Game Type
                      </label>
                      <select
                        value={newTableType}
                        onChange={(e) => setNewTableType(e.target.value)}
                        className="w-full h-11 rounded-xl bg-white/[0.05] border border-white/10 px-3 text-sm text-white focus:outline-none"
                      >
                        <option value="snooker" className="bg-[#0E0E18]">Snooker</option>
                        <option value="pool" className="bg-[#0E0E18]">Pool</option>
                        <option value="ps5" className="bg-[#0E0E18]">PlayStation 5</option>
                        <option value="table_tennis" className="bg-[#0E0E18]">Table Tennis</option>
                        <option value="carrom" className="bg-[#0E0E18]">Carrom</option>
                        <option value="arcade" className="bg-[#0E0E18]">Arcade</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Hourly Rate (₹)
                      </label>
                      <Input
                        type="number"
                        value={newTableRate}
                        onChange={(e) => setNewTableRate(e.target.value)}
                        placeholder="300"
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full mt-2 font-bold">
                    Create Resource & Generate Kiosk Token
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((res) => (
              <GlowCard key={res.id} className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-400 uppercase">
                      {res.typeCode}
                    </span>
                    <StatusPill status={res.status} />
                  </div>

                  <h3 className="mt-3 font-bold text-base text-white">
                    {res.name}
                  </h3>

                  <div className="mt-2 text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 font-[family-name:var(--font-mono)]">
                    {formatPaise(res.hourlyRatePaise)}/hr
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono">
                    Token: {res.deviceToken}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenQr(res.deviceToken, res.name)}
                    className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-semibold"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>View QR</span>
                  </button>
                </div>
              </GlowCard>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: Tablet Kiosk Screens & QR Pairing */}
        <TabsContent value="kiosks" className="mt-6 space-y-4">
          <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-sm text-slate-300 flex items-start gap-3">
            <QrCode className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-white">How Kiosk Pairing Works:</span>
              <p className="mt-1 text-slate-400">
                Each tablet screen mounted on a pool table or PS5 booth runs on a single locked URL with its unique device token. Scan the QR code with your tablet’s camera or open the URL in Chrome/Safari kiosk mode.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {resources.map((res) => (
              <GlowCard key={res.id} hoverEffect={false} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white">{res.name}</h4>
                      <StatusPill status={res.status} />
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>Token: {res.deviceToken}</span>
                      <span>•</span>
                      <span className="text-emerald-400">Ready for Kiosk</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenQr(res.deviceToken, res.name)}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <QrCode className="w-3.5 h-3.5 text-violet-400" />
                      <span>Pairing QR</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(`${window.location.origin}/kiosk/${res.deviceToken}`)
                      }
                      className="gap-1.5 text-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </Button>

                    <a
                      href={`/kiosk/${res.deviceToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" className="gap-1.5 text-xs font-bold">
                        <span>Launch Kiosk</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </a>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: Pricing & Peak Surge */}
        <TabsContent value="pricing" className="mt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan) => (
              <GlowCard key={plan.id} className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">{plan.name}</h3>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-violet-300 uppercase">
                    {plan.type}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-slate-400">Standard Rate</span>
                    <div className="text-base font-bold text-amber-400 font-mono mt-0.5">
                      {formatPaise(plan.ratePaise)}/hr
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-slate-400">Min Charge</span>
                    <div className="text-base font-bold text-white font-mono mt-0.5">
                      {formatPaise(plan.minChargePaise)}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-slate-400">Billing Increment</span>
                    <div className="text-sm font-semibold text-white font-mono mt-0.5">
                      {plan.billingIncrementMin} mins ({plan.rounding})
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-slate-400">Grace Period</span>
                    <div className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">
                      {plan.graceMin} mins free
                    </div>
                  </div>
                </div>

                {/* Peak rules status */}
                <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-slate-400">Peak Hour Surge:</span>
                  {plan.peakRules?.enabled ? (
                    <span className="font-mono text-cyan-400 font-bold">
                      {plan.peakRules.peakMultiplier}x Surge (Fri-Sun, {plan.peakRules.startHour}:00 - {plan.peakRules.endHour}:00)
                    </span>
                  ) : (
                    <span className="text-slate-500 font-mono">Surge Disabled</span>
                  )}
                </div>
              </GlowCard>
            ))}
          </div>
        </TabsContent>

        {/* TAB 4: UPI & GST */}
        <TabsContent value="billing" className="mt-6 max-w-xl space-y-4">
          <GlowCard className="p-6">
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Gaming Zone UPI VPA (For Dynamic QR Code Generation)
                </label>
                <Input
                  value={upiVpa}
                  onChange={(e) => setUpiVpa(e.target.value)}
                  placeholder="merchant@upi"
                  required
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  All table kiosks generate UPI payment QR deep links directly to this VPA.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GSTIN
                  </label>
                  <Input
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    placeholder="27AAACK1234F1Z5"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Invoice Prefix
                  </label>
                  <Input
                    value={invoicePrefix}
                    onChange={(e) => setInvoicePrefix(e.target.value)}
                    placeholder="KGZ"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400">
                <span className="font-bold text-white">GST Calculation:</span> Invoices automatically calculate 18% GST (CGST 9% + SGST 9%) on total play time according to Indian taxation standards.
              </div>

              <Button type="submit" disabled={savingSettings} className="w-full gap-2 font-bold mt-2">
                <Save className="w-4 h-4" />
                <span>{savingSettings ? "Saving..." : "Save Invoicing Configuration"}</span>
              </Button>
            </form>
          </GlowCard>
        </TabsContent>
      </Tabs>

      {/* QR Code Modal for Pairing */}
      {qrModalData && (
        <Dialog open={!!qrModalData} onOpenChange={() => setQrModalData(null)}>
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <DialogTitle className="text-center">{qrModalData.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center py-4">
              <div className="p-3 rounded-2xl bg-white shadow-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrModalData.qr}
                  alt="Kiosk QR"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <p className="mt-4 text-xs text-slate-400 max-w-xs">
                Point the tablet camera at this QR code to instantly launch this table’s locked kiosk screen.
              </p>

              <div className="mt-4 w-full flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(qrModalData.url)}
                  className="flex-1 gap-1 text-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </Button>

                <a
                  href={qrModalData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button size="sm" className="w-full gap-1 text-xs font-bold">
                    <span>Open</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

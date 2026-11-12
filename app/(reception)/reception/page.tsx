"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLive } from "@/lib/hooks/useLive";
import { KhushiLogo } from "@/components/premium/KhushiLogo";
import { StatusPill } from "@/components/premium/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatDuration, formatPaise } from "@/lib/utils";
import { playAlertChime } from "@/lib/audio/chime";
import { toast } from "sonner";
import {
  Bell,
  BellOff,
  Plus,
  Tv,
  ShieldAlert,
  User,
} from "lucide-react";

export default function ReceptionBoardPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const previousStoppingCount = useRef<number>(0);

  // Live short-polling (3s) for the real-time reception board
  const { data, mutate, isReconnecting } = useLive<{
    tables: any[];
    summary: {
      todayTotalPaise: number;
      todayCashPaise: number;
      todayUpiPaise: number;
      activeTablesCount: number;
      totalTablesCount: number;
      stoppingRequestsCount: number;
    };
  }>("/api/reception", { refreshInterval: 3000 });

  const tables = data?.tables || [];
  const summary = data?.summary || {
    todayTotalPaise: 0,
    todayCashPaise: 0,
    todayUpiPaise: 0,
    activeTablesCount: 0,
    totalTablesCount: 0,
    stoppingRequestsCount: 0,
  };

  // Sound cue on new stop request
  useEffect(() => {
    if (summary.stoppingRequestsCount > previousStoppingCount.current) {
      if (soundEnabled) {
        playAlertChime();
        toast.warning("Stop request arrived! Please confirm bill.", {
          duration: 5000,
        });
      }
    }
    previousStoppingCount.current = summary.stoppingRequestsCount;
  }, [summary.stoppingRequestsCount, soundEnabled]);

  // Modal States
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<string>("");
  const [walkinPhone, setWalkinPhone] = useState("");
  const [walkinName, setWalkinName] = useState("");
  const [walkinReason, setWalkinReason] = useState("");
  const [walkinSubmitting, setWalkinSubmitting] = useState(false);

  // Payment Confirmation Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("upi");
  const [paymentReason, setPaymentReason] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  // View Bill Modal
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [activeBillTable, setActiveBillTable] = useState<any>(null);

  // Confirm Stop Action
  const handleConfirmStop = async (sessionId: string, tableName: string) => {
    try {
      const res = await fetch("/api/reception/confirm-stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to confirm stop");

      toast.success(`Stop confirmed for ${tableName}. Bill generated!`);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm stop");
    }
  };

  // Walk-in Start Handler
  const handleStartWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId || !walkinPhone) {
      toast.error("Please select a table and enter customer phone");
      return;
    }
    if (!walkinReason) {
      toast.error("Audit reason is required for manual staff start");
      return;
    }

    setWalkinSubmitting(true);
    try {
      const res = await fetch("/api/reception/start-walkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: selectedResourceId,
          phone: walkinPhone,
          customerName: walkinName,
          reason: walkinReason,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to start walk-in");

      toast.success("Walk-in session started! Flagged in audit log.");
      setWalkinModalOpen(false);
      setWalkinPhone("");
      setWalkinName("");
      setWalkinReason("");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to start walk-in");
    } finally {
      setWalkinSubmitting(false);
    }
  };

  // Mark Paid Handler
  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentInvoice?.id) return;

    setPaymentSubmitting(true);
    try {
      const res = await fetch("/api/reception/mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: activePaymentInvoice.id,
          method: paymentMethod,
          reason: paymentReason,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to mark paid");

      toast.success(`Payment recorded via ${paymentMethod.toUpperCase()}!`);
      setPaymentModalOpen(false);
      setPaymentReason("");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to mark payment");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const filteredTables = tables.filter((t) => {
    if (filterType === "all") return true;
    return t.typeCode === filterType;
  });

  return (
    <div className="min-h-screen bg-[#07070B] text-slate-100 flex flex-col font-[family-name:var(--font-sans)] select-none">
      {/* Top Reception Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0E0E18]/90 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <KhushiLogo size="md" href="/reception" />
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300 font-mono">
            <Tv className="w-3.5 h-3.5" />
            <span>Reception Desk Console</span>
          </div>
        </div>

        {/* Live Metrics: Today's Collection & Cash vs UPI */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">
                Today’s Collection
              </span>
              <span className="text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 font-mono">
                {formatPaise(summary.todayTotalPaise)}
              </span>
            </div>

            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono">
              <span className="text-emerald-400">
                UPI: {formatPaise(summary.todayUpiPaise)}
              </span>
              <span className="text-cyan-400">
                Cash: {formatPaise(summary.todayCashPaise)}
              </span>
            </div>
          </div>

          {/* Sound Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              toast.info(soundEnabled ? "Alert chime muted" : "Alert chime enabled");
            }}
            className="h-10 px-3 text-xs gap-1.5"
            title="Toggle Stop Request Audio Alert"
          >
            {soundEnabled ? (
              <>
                <Bell className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Chime On</span>
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">Muted</span>
              </>
            )}
          </Button>

          {/* Start Walkin Button */}
          <Button
            size="sm"
            onClick={() => {
              const available = tables.find((t) => t.status === "available");
              if (available) setSelectedResourceId(available.id);
              setWalkinModalOpen(true);
            }}
            className="h-10 px-4 text-xs font-bold gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Start Walk-in</span>
          </Button>

          {/* Owner Dashboard Shortcut */}
          <Link href="/owner">
            <Button variant="ghost" size="sm" className="h-10 text-xs text-slate-400 hover:text-white">
              <span>Owner Portal &rarr;</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* STOPPING ALERT BANNER */}
      {summary.stoppingRequestsCount > 0 && (
        <div className="w-full bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-slate-950 font-bold px-6 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
            <span className="text-sm">
              {summary.stoppingRequestsCount} table session(s) requested stop! Confirm play time to generate customer QR bill.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {tables
              .filter((t) => t.status === "stopping")
              .map((t) => (
                <Button
                  key={t.id}
                  size="sm"
                  onClick={() => handleConfirmStop(t.currentSessionId, t.name)}
                  className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-md"
                >
                  <span>Confirm {t.name}</span>
                </Button>
              ))}
          </div>
        </div>
      )}

      {/* Main Board Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Game Filter Bar & Table Counts */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {["all", "snooker", "pool", "ps5", "table_tennis", "carrom"].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterType(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                  filterType === cat
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30"
                    : "bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>
              Occupancy:{" "}
              <strong className="text-emerald-400">
                {summary.activeTablesCount} / {summary.totalTablesCount}
              </strong>{" "}
              Tables Active
            </span>
          </div>
        </div>

        {/* Live Table Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTables.map((table) => {
            const isRunning = table.status === "running";
            const isStopping = table.status === "stopping";
            const isAwaitingPay = table.status === "awaiting_payment";
            const isAvailable = table.status === "available";

            const cardBorder = isStopping
              ? "border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.2)]"
              : isRunning
              ? "border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.12)]"
              : isAwaitingPay
              ? "border-yellow-500/40 shadow-[0_0_20px_rgba(234,179,8,0.15)]"
              : "border-white/[0.08]";

            return (
              <div
                key={table.id}
                className={`rounded-2xl bg-[#0E0E18]/80 backdrop-blur-xl border p-5 flex flex-col justify-between transition-all duration-300 relative ${cardBorder}`}
              >
                <div>
                  {/* Top table header */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 font-bold">
                      {table.typeCode.replace("_", " ")}
                    </span>
                    <StatusPill status={table.status} />
                  </div>

                  <h3 className="mt-3 text-lg font-extrabold text-white tracking-tight">
                    {table.name}
                  </h3>

                  {/* Customer & Session Info */}
                  {table.session ? (
                    <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-violet-400" />
                          <span>{table.session.customerName}</span>
                        </span>
                        <span className="text-slate-400 font-mono">
                          {table.session.customerPhone}
                        </span>
                      </div>

                      {table.session.startedBy === "staff" && (
                        <span className="inline-block text-[10px] text-amber-300 font-mono">
                          Flag: Staff Manual Walk-in
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-slate-500">
                      Table currently vacant. Tap Start to assign.
                    </div>
                  )}

                  {/* Live Elapsed Stopwatch & Running Bill */}
                  <div className="mt-4 pt-3 border-t border-white/[0.06] grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                        Play Time
                      </span>
                      <span className="text-xl font-extrabold text-white font-mono mt-0.5 block">
                        {formatDuration(table.elapsedSeconds)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                        Bill Amount
                      </span>
                      <span className="text-xl font-extrabold text-amber-400 font-mono mt-0.5 block">
                        {formatPaise(table.runningAmountPaise)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contextual Action Buttons */}
                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center gap-2">
                  {isAvailable && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedResourceId(table.id);
                        setWalkinModalOpen(true);
                      }}
                      className="w-full text-xs font-bold gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Start Walk-in</span>
                    </Button>
                  )}

                  {isRunning && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleConfirmStop(table.currentSessionId, table.name)
                      }
                      className="w-full text-xs font-bold text-amber-300 hover:text-amber-200 border-amber-500/30 hover:bg-amber-500/10"
                    >
                      <span>Stop & Bill Table</span>
                    </Button>
                  )}

                  {isStopping && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleConfirmStop(table.currentSessionId, table.name)
                      }
                      className="w-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/25 animate-pulse"
                    >
                      <span>Confirm Stop & Generate QR</span>
                    </Button>
                  )}

                  {isAwaitingPay && (
                    <div className="w-full flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setActivePaymentInvoice(table.invoice);
                          setPaymentMethod("upi");
                          setPaymentModalOpen(true);
                        }}
                        className="flex-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500"
                      >
                        <span>Paid UPI</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setActivePaymentInvoice(table.invoice);
                          setPaymentMethod("cash");
                          setPaymentModalOpen(true);
                        }}
                        className="flex-1 text-xs font-bold"
                      >
                        <span>Paid Cash</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* MODAL 1: Start Walk-in */}
      <Dialog open={walkinModalOpen} onOpenChange={setWalkinModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Manual Walk-in Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleStartWalkin} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Table / Station
              </label>
              <select
                value={selectedResourceId}
                onChange={(e) => setSelectedResourceId(e.target.value)}
                className="w-full h-11 rounded-xl bg-white/[0.05] border border-white/10 px-3 text-sm text-white focus:outline-none"
                required
              >
                {tables
                  .filter((t) => t.status === "available" || t.id === selectedResourceId)
                  .map((t) => (
                    <option key={t.id} value={t.id} className="bg-[#0E0E18]">
                      {t.name} ({formatPaise(t.hourlyRatePaise)}/hr)
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Customer Mobile Number
              </label>
              <Input
                type="tel"
                value={walkinPhone}
                onChange={(e) => setWalkinPhone(e.target.value)}
                placeholder="10-digit number e.g. 9820012345"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Customer Name (Optional)
              </label>
              <Input
                value={walkinName}
                onChange={(e) => setWalkinName(e.target.value)}
                placeholder="e.g. Rohit"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-amber-300 mb-1">
                Reason for Manual Start (Anti-Theft Audit Requirement)
              </label>
              <Input
                value={walkinReason}
                onChange={(e) => setWalkinReason(e.target.value)}
                placeholder="e.g., Customer phone dead / Tablet offline"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={walkinSubmitting}
              className="w-full font-bold mt-2"
            >
              {walkinSubmitting ? "Starting..." : "Start Walk-in (Audit Logged)"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Record Payment */}
      {activePaymentInvoice && (
        <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                Record {paymentMethod === "upi" ? "UPI Online" : "Cash"} Payment
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleMarkPaid} className="space-y-4 mt-2">
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-center space-y-1">
                <span className="text-xs text-slate-400">Total Invoice Amount</span>
                <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 font-mono">
                  {formatPaise(activePaymentInvoice.totalPaise)}
                </div>
                <span className="text-[11px] text-slate-500 block font-mono">
                  Invoice #{activePaymentInvoice.invoiceNo} (Includes 18% GST)
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={paymentMethod === "upi" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("upi")}
                    className="text-xs font-bold"
                  >
                    UPI Payment
                  </Button>
                  <Button
                    type="button"
                    variant={paymentMethod === "cash" ? "default" : "outline"}
                    onClick={() => setPaymentMethod("cash")}
                    className="text-xs font-bold"
                  >
                    Cash Register
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Cashier Audit Reason / Note
                </label>
                <Input
                  value={paymentReason}
                  onChange={(e) => setPaymentReason(e.target.value)}
                  placeholder="e.g. Received ₹200 note / Verified on GPay"
                />
              </div>

              <Button
                type="submit"
                disabled={paymentSubmitting}
                className="w-full font-bold bg-emerald-600 hover:bg-emerald-500"
              >
                {paymentSubmitting
                  ? "Recording..."
                  : `Confirm ${formatPaise(activePaymentInvoice.totalPaise)} Paid`}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

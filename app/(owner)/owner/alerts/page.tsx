"use client";

import React, { useState } from "react";
import { useLive } from "@/lib/hooks/useLive";
import {
  AlertTriangle,
  ShieldCheck,
  Zap,
  Clock,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Flame,
  Radio,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AlertsAntiTheftPage() {
  const { data, isLoading, mutate } = useLive<{ alerts: any[] }>("/api/alerts", {
    refreshInterval: 4000,
  });

  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const alerts = data?.alerts || [];
  const activeAlerts = alerts.filter((a) => !a.resolved);
  const criticalCount = activeAlerts.filter((a) => a.severity === "critical").length;
  const warningCount = activeAlerts.filter((a) => a.severity === "warning").length;

  const handleResolveAlert = async (alertId: string) => {
    setResolvingId(alertId);
    try {
      const res = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertId,
          resolved: true,
          notes: "Audited and verified by Owner via anti-theft dashboard.",
        }),
      });

      if (!res.ok) throw new Error("Failed to resolve alert");

      toast.success("Alert resolved and marked clean");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to resolve alert");
    } finally {
      setResolvingId(null);
    }
  };

  const handleSimulateOccupancyAnomaly = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/occupancy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableName: "Table 1",
          powerWatts: 165,
        }),
      });

      const json = await res.json();
      if (json.status === "anomaly_flagged") {
        toast.warning("Smart Plug Anomaly Flagged!", {
          description: "Table 1 detected drawing 165W with NO active session! Alert generated.",
        });
      } else {
        toast.info("Sensor report received: Table currently running or normal");
      }
      mutate();
    } catch {
      toast.error("Failed to simulate sensor event");
    } finally {
      setSimulating(false);
    }
  };

  const handleRunCronScanner = async () => {
    setSimulating(true);
    try {
      const res = await fetch("/api/cron/anomalies");
      const json = await res.json();
      toast.success("Anti-Fraud Background Scan Complete", {
        description: `Checked ${json.checkedSessions} sessions, found ${json.anomaliesFound} anomalies.`,
      });
      mutate();
    } catch {
      toast.error("Cron scan error");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white tracking-tight">
              Anti-Theft Shield & Anomalies
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                activeAlerts.length > 0
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse"
                  : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              }`}
            >
              {activeAlerts.length > 0 ? `${activeAlerts.length} Active Anomalies` : "All Tables Secure"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated deterrence against unbilled plays, cash theft, time tampering, and ghost games.
          </p>
        </div>

        {/* Demo Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={handleSimulateOccupancyAnomaly}
            disabled={simulating}
            variant="outline"
            size="sm"
            className="gap-2 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate Smart-Plug Anomaly</span>
          </Button>

          <Button
            onClick={handleRunCronScanner}
            disabled={simulating}
            size="sm"
            className="gap-2 text-xs bg-violet-600 hover:bg-violet-500 text-white"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Run Anomaly Scan</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Active Anomalies</div>
          <div className="text-3xl font-black font-mono text-white">
            {activeAlerts.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Unresolved events requiring owner audit
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Critical (Theft Suspected)</div>
          <div className="text-3xl font-black font-mono text-rose-400">
            {criticalCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Unmetered power draw or excessive voids
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="text-xs text-slate-400 mb-1">Operational Warnings</div>
          <div className="text-3xl font-black font-mono text-amber-400">
            {warningCount}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Long running sessions or delayed stop confirms
          </p>
        </div>
      </div>

      {/* Alert Feed List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-violet-400" />
          Real-time Anomaly Stream
        </h2>

        {alerts.length === 0 ? (
          <div className="p-12 rounded-2xl bg-[#0E0E18] border border-white/[0.08] text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Zero Anomalies Detected</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Every table session is fully accounted for with customer OTP logins, automatic time metering, and dynamic UPI QR billing.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const isResolved = alert.resolved;
              const isCritical = alert.severity === "critical";

              return (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isResolved
                      ? "bg-white/[0.01] border-white/[0.05] opacity-60"
                      : isCritical
                      ? "bg-rose-950/20 border-rose-500/40"
                      : "bg-[#0E0E18] border-amber-500/30"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2.5 rounded-xl mt-0.5 ${
                        isCritical
                          ? "bg-rose-500/20 text-rose-400"
                          : isResolved
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {isResolved ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : isCritical ? (
                        <Flame className="w-5 h-5 animate-pulse" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isCritical
                              ? "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          {alert.type.replace(/_/g, " ").toUpperCase()}
                        </span>
                        {isResolved && (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-semibold text-white mt-1.5 leading-relaxed">
                        {alert.message}
                      </p>

                      <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-3">
                        <span>
                          Reported: {new Date(alert.createdAt).toLocaleTimeString("en-IN")}
                        </span>
                        {alert.resolvedBy && (
                          <span>• Resolved by: {alert.resolvedBy}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {!isResolved && (
                    <div className="shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleResolveAlert(alert.id)}
                        disabled={resolvingId === alert.id}
                        className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white w-full sm:w-auto"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Audit & Resolve</span>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Anti-Theft Pillars Explainer Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-950/20 via-[#0E0E18] to-cyan-950/20 border border-white/[0.08]">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-violet-400" />
          The 7 Anti-Theft Pillars of Khushi Gaming Zone OS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="font-bold text-violet-300 mb-1">1. Customer-Initiated OTP Start</div>
            <p className="text-slate-400">
              Customers verify via phone OTP on table kiosk. Staff cannot secretly skip entry in the notebook.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="font-bold text-cyan-300 mb-1">2. Flagged Staff Manual Starts</div>
            <p className="text-slate-400">
              Walk-in starts by staff are permanently tagged `started_by: staff` and trigger an owner audit alert.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="font-bold text-amber-300 mb-1">3. Immutable Append-Only Ledger</div>
            <p className="text-slate-400">
              Financial invoices are never deleted. Any voids require a mandatory audit reason and generate immediate alerts.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="font-bold text-emerald-300 mb-1">4. Server-Authoritative Clock</div>
            <p className="text-slate-400">
              Kiosk timers derive strictly from server UTC timestamps. Tablet clock manipulation has zero billing effect.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="font-bold text-rose-300 mb-1">5. Smart-Plug Power Sensor</div>
            <p className="text-slate-400">
              IoT sensors detect power draw on tables without active sessions, exposing unauthorized offline games instantly.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="font-bold text-blue-300 mb-1">6. Daily Cash Drawer Audit</div>
            <p className="text-slate-400">
              Calculates expected cash vs physically counted cash daily, eliminating pocketing of cash receipts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


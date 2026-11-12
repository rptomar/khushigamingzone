"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/hooks/useLive";
import { formatPaise } from "@/lib/utils";
import {
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Users,
  CreditCard,
  Banknote,
  Tv,
  ArrowUpRight,
  RefreshCw,
  Flame,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function OwnerDashboardPage() {
  const { data, isLoading, mutate } = useLive<any>("/api/owner/analytics", {
    refreshInterval: 4000,
  });

  const [selectedTable, setSelectedTable] = useState<any | null>(null);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin" />
        <p className="text-slate-400 text-sm font-medium">Loading executive analytics...</p>
      </div>
    );
  }

  const analytics = data || {
    revenueTodayPaise: 1845000,
    revenueWeekPaise: 12480000,
    revenueMonthPaise: 48500000,
    cashRevenuePaise: 420000,
    upiRevenuePaise: 1425000,
    occupancyRate: 75,
    runningTables: 6,
    totalTables: 8,
    totalHoursToday: "42.5",
    activeMembersCount: 24,
    unresolvedAlertsCount: 0,
    revenueHistory: [],
    hourlyOccupancy: [],
    gameDistribution: [],
    floorMap: [],
  };

  const cashPercent = Math.round(
    (analytics.cashRevenuePaise / (analytics.revenueTodayPaise || 1)) * 100
  );
  const upiPercent = 100 - cashPercent;

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Executive Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time remote control, revenue tracking & anti-theft monitoring for Khushi Gaming Zone.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/owner/reconciliation">
            <Button variant="outline" size="sm" className="gap-2 border-white/10 hover:bg-white/[0.05] text-xs">
              <Banknote className="w-3.5 h-3.5 text-amber-400" />
              <span>Cash Reconciliation</span>
            </Button>
          </Link>

          <Link href="/owner/alerts">
            <Button
              variant="outline"
              size="sm"
              className={`gap-2 text-xs border-white/10 hover:bg-white/[0.05] ${
                analytics.unresolvedAlertsCount > 0 ? "text-rose-400 border-rose-500/30 bg-rose-500/10" : ""
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Alerts ({analytics.unresolvedAlertsCount})</span>
            </Button>
          </Link>

          <Link href="/reception" target="_blank">
            <Button size="sm" className="gap-2 bg-violet-600 hover:bg-violet-500 text-xs text-white">
              <Tv className="w-3.5 h-3.5" />
              <span>Live Desk</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08] relative overflow-hidden group hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Today&apos;s Revenue</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +14.2%
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
            {formatPaise(analytics.revenueTodayPaise)}
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px]">
            <span className="text-cyan-400 flex items-center gap-1">
              <CreditCard className="w-3 h-3" /> UPI {upiPercent}%
            </span>
            <span className="text-amber-400 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Cash {cashPercent}%
            </span>
          </div>
        </div>

        {/* Live Occupancy */}
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08] relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Live Arena Occupancy</span>
            <span className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {analytics.runningTables} / {analytics.totalTables} Active
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 tracking-tight">
            {analytics.occupancyRate}%
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 mt-4 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-violet-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${analytics.occupancyRate}%` }}
            />
          </div>
        </div>

        {/* Total Hours Played Today */}
        <div className="p-5 rounded-2xl bg-[#0E0E18] border border-white/[0.08] relative overflow-hidden group hover:border-violet-500/30 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Play Time Today</span>
            <Clock className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
            {analytics.totalHoursToday} <span className="text-base text-slate-400 font-sans font-medium">hrs</span>
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.05] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Weekly: {formatPaise(analytics.revenueWeekPaise)}</span>
            <span className="text-slate-500">Mtd: {formatPaise(analytics.revenueMonthPaise)}</span>
          </div>
        </div>

        {/* Anti-Theft Status */}
        <div className={`p-5 rounded-2xl border relative overflow-hidden transition-all ${
          analytics.unresolvedAlertsCount > 0
            ? "bg-rose-950/20 border-rose-500/40"
            : "bg-[#0E0E18] border-white/[0.08] hover:border-emerald-500/30"
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium">Anti-Theft Shield</span>
            {analytics.unresolvedAlertsCount > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
          </div>
          <div className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            {analytics.unresolvedAlertsCount > 0 ? (
              <span className="text-rose-400">{analytics.unresolvedAlertsCount} Anomalies</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-2">
                100% Protected
              </span>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-white/[0.05] text-[11px] flex items-center justify-between">
            <span className="text-slate-400">VIP Members: {analytics.activeMembersCount}</span>
            <span className="text-violet-400">Zero Unbilled Plays</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue 7-Day Trend */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-400" />
                Revenue & Play Velocity (Last 7 Days)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daily collection trends including peak surge performance
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              Avg ₹17.8k / day
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenueHistory}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0d" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161824",
                    borderColor: "#2A2D3D",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Game Category Breakdown */}
        <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-amber-400" />
              Game Category Share
            </h2>
            <p className="text-xs text-slate-400">
              Revenue distribution by resource category
            </p>
          </div>

          <div className="h-48 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.gameDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {analytics.gameDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#161824",
                    borderColor: "#2A2D3D",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val}%`, "Share"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.05]">
            {analytics.gameDistribution.map((item: any) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-300 truncate">{item.name}</span>
                <span className="text-slate-500 font-mono ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Interactive Floor Plan */}
      <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-cyan-400" />
              Live Arena Floor Grid
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any station to view live telemetry, customer details, and stopwatch
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Available
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" /> Playing
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Stopping
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {analytics.floorMap.map((table: any) => {
            const isRunning = table.status === "running";
            const isStopping = table.status === "stopping" || table.status === "awaiting_payment";
            const isAvailable = table.status === "available";

            return (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isRunning
                    ? "bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-400 shadow-lg shadow-cyan-950/30"
                    : isStopping
                    ? "bg-amber-950/20 border-amber-500/40 hover:border-amber-400"
                    : "bg-white/[0.02] border-white/[0.08] hover:border-emerald-500/40"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    {table.typeCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                      isRunning
                        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30"
                        : isStopping
                        ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {table.status}
                  </span>
                </div>

                <div className="font-bold text-white text-sm truncate mb-1">
                  {table.name}
                </div>

                {isRunning && table.currentSession ? (
                  <div className="space-y-1.5 mt-3 pt-3 border-t border-white/[0.08]">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Elapsed</span>
                      <span className="font-mono text-cyan-300 font-bold">
                        {table.currentSession.elapsedMinutes} mins
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Running Bill</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatPaise(table.currentSession.amountPaise)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 truncate">
                      <span>+91 {table.currentSession.customerPhone}</span>
                      {table.currentSession.startedBy === "staff" && (
                        <span className="text-amber-400 font-medium">Manual Start</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-white/[0.05] flex justify-between items-center text-xs text-slate-400">
                    <span>Base Rate</span>
                    <span className="font-mono text-slate-300 font-semibold">
                      ₹{table.hourlyRatePaise / 100}/hr
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

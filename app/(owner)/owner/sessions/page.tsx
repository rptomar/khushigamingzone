"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/hooks/useLive";
import { formatPaise } from "@/lib/utils";
import {
  Search,
  Download,
  FileText,
  Filter,
  UserCheck,
  ShieldAlert,
  ArrowUpDown,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SessionsHistoryPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading } = useLive<{ sessions: any[] }>(
    `/api/owner/sessions?q=${encodeURIComponent(search)}&status=${statusFilter}`,
    { refreshInterval: 5000 }
  );

  const sessions = data?.sessions || [];

  const handleExportCsv = () => {
    if (sessions.length === 0) {
      toast.error("No sessions available to export");
      return;
    }

    const headers = [
      "Session ID",
      "Date & Time",
      "Table",
      "Game Type",
      "Customer Phone",
      "Customer Name",
      "Duration (Mins)",
      "Plan",
      "Started By",
      "Status",
      "Amount (INR)",
      "Invoice No",
    ];

    const rows = sessions.map((s) => [
      s.id,
      new Date(s.startedAt).toLocaleString("en-IN"),
      `"${s.tableName}"`,
      s.typeCode,
      s.customerPhone,
      `"${s.customerName || "Customer"}"`,
      s.durationMinutes,
      `"${s.planName || "Hourly Standard"}"`,
      s.startedBy,
      s.status,
      (s.totalPaise / 100).toFixed(2),
      s.invoiceNo || "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `ps07-gaming-sessions-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sessions export downloaded successfully");
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Sessions History & Audit Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete tamper-proof record of every game session started, stopped, and billed.
          </p>
        </div>

        <Button
          onClick={handleExportCsv}
          variant="outline"
          size="sm"
          className="gap-2 text-xs border-white/10 hover:bg-white/[0.05]"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-[#0E0E18] p-3 rounded-2xl border border-white/[0.08]">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer phone, name, or session ID..."
            className="pl-10 bg-black/40 border-white/10 text-xs h-9 text-white placeholder:text-slate-500 rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter sessions by status"
            className="bg-black/40 border border-white/10 text-xs text-slate-300 rounded-xl px-3 h-9 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="paid">Paid & Completed</option>
            <option value="active">Currently Running</option>
            <option value="stopping">Stop Requested</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl bg-[#0E0E18] border border-white/[0.08] overflow-hidden">
        {isLoading && !data ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 text-violet-400 animate-spin" />
            <p className="text-xs text-slate-400">Loading audit records...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-sm">
            No matching game sessions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.08] text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Session & Date</th>
                  <th className="py-3.5 px-4">Station / Table</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Started By</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {sessions.map((s) => {
                  const isStaffStart = s.startedBy === "staff";
                  const isPaid = s.status === "paid";
                  const isRunning = s.status === "active";

                  return (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-semibold text-white">
                          #{s.id.slice(-6).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(s.startedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-200">{s.tableName}</div>
                        <div className="text-[10px] uppercase font-bold text-violet-400">
                          {s.typeCode}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-200">+91 {s.customerPhone}</div>
                        <div className="text-[10px] text-slate-400">{s.customerName}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-200 font-semibold">
                          {Math.floor(s.durationMinutes / 60) > 0
                            ? `${Math.floor(s.durationMinutes / 60)}h ${s.durationMinutes % 60}m`
                            : `${s.durationMinutes} mins`}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                          {s.planName || "Hourly"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isStaffStart ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            <ShieldAlert className="w-3 h-3" /> Staff Manual
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            <UserCheck className="w-3 h-3" /> Kiosk OTP
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            isPaid
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                              : isRunning
                              ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 animate-pulse"
                              : "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {s.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                        {formatPaise(s.totalPaise)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {s.invoiceId ? (
                          <Link
                            href={`/api/invoices/${s.invoiceId}/pdf`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-violet-600/20 text-violet-300 border border-white/[0.08] hover:border-violet-500/30 transition-all text-[11px]"
                          >
                            <FileText className="w-3 h-3" />
                            <span>PDF</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                          </Link>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


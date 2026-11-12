"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { KhushiLogo } from "@/components/premium/KhushiLogo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Tv,
  AlertTriangle,
  History,
  Settings,
  LogOut,
  ExternalLink,
  ChevronDown,
  Layers,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const navItems = [
    { label: "Overview", href: "/owner", icon: LayoutDashboard },
    { label: "Live Reception", href: "/reception", icon: Tv, external: true },
    { label: "Sessions", href: "/owner/sessions", icon: History },
    { label: "Alerts", href: "/owner/alerts", icon: AlertTriangle },
    { label: "Cash Audit", href: "/owner/reconciliation", icon: Banknote },
    { label: "Zone Settings", href: "/owner/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out successfully");
      router.push("/login");
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070B] text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0E0E18]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <KhushiLogo size="md" href="/owner" />

            {/* Outlet Selector Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Mall Outlet 1 (Nexus Mall)</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.external && (
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/platform" className="hidden sm:inline-flex">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Reseller Portal</span>
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-xs text-slate-400 hover:text-rose-400 gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0E18]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-2 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? "text-violet-400 font-bold" : "text-slate-400"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

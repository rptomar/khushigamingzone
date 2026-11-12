"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { KhushiLogo } from "@/components/premium/KhushiLogo";
import { GlowCard } from "@/components/premium/GlowCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, Sparkles, Key, ArrowRight, Lock, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    {
      role: "Platform Super Admin",
      email: "superadmin@khushigaming.com",
      pass: "admin123",
      route: "/platform",
      badge: "Full SaaS",
    },
    {
      role: "Business Owner",
      email: "owner@khushigaming.com",
      pass: "owner123",
      route: "/owner",
      badge: "Remote Control",
    },
    {
      role: "Shift Manager",
      email: "manager@khushigaming.com",
      pass: "manager123",
      route: "/owner",
      badge: "Ops & Pricing",
    },
    {
      role: "Reception Desk",
      email: "reception@khushigaming.com",
      pass: "reception123",
      route: "/reception",
      badge: "Live Board",
    },
  ];

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string, redirectPath?: string) => {
    if (e) e.preventDefault();
    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    if (!loginEmail || !loginPass) {
      toast.error("Please enter email and password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      toast.success(`Welcome back, ${data.user.name}!`);

      if (redirectPath) {
        router.push(redirectPath);
      } else if (data.user.role === "super_admin" || data.user.role === "reseller") {
        router.push("/platform");
      } else if (data.user.role === "receptionist") {
        router.push("/reception");
      } else {
        router.push("/owner");
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#07070B] text-slate-100 overflow-hidden">
      {/* Left Column: Visual Showcase & Brand Story */}
      <div className="relative flex-1 flex flex-col justify-between p-8 lg:p-14 bg-gradient-to-br from-[#0D0B18] via-[#090812] to-[#05050A] border-b lg:border-b-0 lg:border-r border-white/[0.08]">
        {/* Ambient Aurora lights */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10">
          <KhushiLogo size="lg" showTagline />
        </div>

        <div className="relative z-10 my-auto py-12 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Anti-Theft Gaming Zone Operating System</span>
          </div>

          <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight leading-tight font-[family-name:var(--font-display)]">
            Every second. <br />
            <span className="bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              Every rupee.
            </span>{" "}
            Accounted.
          </h1>

          <p className="mt-5 text-slate-400 text-base lg:text-lg leading-relaxed">
            Eliminate notebook tracking, unbilled table hours, and staff leakage.
            Real-time tablet kiosks, instant UPI QR payments, and remote owner monitoring.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-violet-400 font-bold text-xl font-[family-name:var(--font-mono)]">
                100%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Kiosk OTP Session Auditing
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="text-cyan-400 font-bold text-xl font-[family-name:var(--font-mono)]">
                0%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Cash Skimming & Leakage
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Khushi Gaming Zone SaaS</span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            SOC2 & End-to-End Encrypted
          </span>
        </div>
      </div>

      {/* Right Column: Split Screen Login Form + 1-Click Demo Profiles */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 relative">
        <div className="w-full max-w-md space-y-8">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-white font-[family-name:var(--font-display)]">
              Staff Portal Access
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in with your enterprise credentials or click a demo role below.
            </p>
          </div>

          {/* 1-Click Quick Demo Switcher */}
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              1-Click Demo Logins
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    setPassword(acc.pass);
                    handleLogin(undefined, acc.email, acc.pass, acc.route);
                  }}
                  className="flex flex-col items-start p-3 rounded-xl bg-white/[0.04] hover:bg-violet-600/15 border border-white/[0.08] hover:border-violet-500/40 transition-all text-left group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                      {acc.role}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
                      {acc.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono mt-1 truncate w-full">
                    {acc.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Standard Form */}
          <GlowCard hoverEffect={false} className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@khushigaming.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 text-sm font-bold gap-2 mt-2"
              >
                {loading ? (
                  "Authenticating..."
                ) : (
                  <>
                    <span>Enter Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          </GlowCard>

          <div className="text-center">
            <p className="text-xs text-slate-500">
              Need table kiosk screen?{" "}
              <a
                href="/kiosk/kiosk-snooker-1"
                className="text-violet-400 hover:underline font-medium"
              >
                Launch Kiosk for Table 1 &rarr;
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

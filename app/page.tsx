"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { KhushiLogo } from "@/components/premium/KhushiLogo";
import { formatPaise } from "@/lib/utils";
import {
  ShieldAlert,
  Tv,
  QrCode,
  Smartphone,
  Clock,
  ArrowRight,
  Zap,
  CheckCircle2,
  Lock,
  ChevronRight,
  Calculator,
  Play,
  Banknote,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ROTATING_LINES = [
  "Idle Tables Into Profit.",
  "Every Minute Into Revenue.",
  "Every Match Into Cashflow.",
  "Table Chaos Into Control.",
  "Walk-Ins Into Loyal VIPs.",
  "Unbilled Games Into Zero Leakage.",
];

export default function MarketingLandingPage() {
  // Rotating interactive hero text
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % ROTATING_LINES.length);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Interactive Live Demo Table State
  const [demoStep, setDemoStep] = useState<"idle" | "running" | "stopping" | "billed">("idle");
  const [demoSeconds, setDemoSeconds] = useState(0);
  const demoCustomerPhone = "9820012345";

  // ROI Calculator State
  const [calcTables, setCalcTables] = useState(6);
  const [calcHourlyRate, setCalcHourlyRate] = useState(300);
  const estimatedLeakPaise = Math.round(calcTables * 1.5 * calcHourlyRate * 30 * 100);

  // Demo stopwatch effect
  useEffect(() => {
    let interval: any = null;
    if (demoStep === "running") {
      interval = setInterval(() => {
        setDemoSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [demoStep]);

  const demoElapsedMinutes = Math.max(1, Math.floor(demoSeconds / 4) + 18);
  const demoAmountRupees = Math.round((300 / 60) * demoElapsedMinutes);

  return (
    <div className="min-h-screen bg-[#07070B] text-slate-100 selection:bg-violet-500 selection:text-white">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#07070B]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <KhushiLogo size="md" href="/" />

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#anti-theft" className="hover:text-white transition-colors">
              Anti-Theft Shield
            </a>
            <a href="#interactive-demo" className="hover:text-white transition-colors">
              Live Demo
            </a>
            <a href="#roi-calculator" className="hover:text-white transition-colors">
              ROI Calculator
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-300 hover:text-white hover:bg-white/[0.05]"
              >
                Staff Login
              </Button>
            </Link>

            <Link href="/owner">
              <Button
                size="sm"
                className="gap-2 text-xs bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-bold shadow-lg shadow-violet-950/40"
              >
                <span>Owner Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section with Glow Background */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-br from-violet-600/20 via-cyan-500/15 to-transparent blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.1] text-xs font-semibold text-violet-300 mb-8 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Built for Snooker, Pool & Gaming Lounges Across India</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
            The Automated Gaming OS That Turns{" "}
            <span className="inline-block relative min-h-[1.25em] align-top">
              <AnimatePresence mode="wait">
                <motion.span
                  key={lineIndex}
                  initial={{ opacity: 0, y: 22, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -22, filter: "blur(6px)" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent inline-block cursor-pointer select-none"
                  onClick={() => setLineIndex((prev) => (prev + 1) % ROTATING_LINES.length)}
                  title="Click to switch line"
                >
                  {ROTATING_LINES[lineIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          {/* Interactive Line Switcher Pills */}
          <div className="flex items-center justify-center gap-2 mt-4 mb-2">
            {ROTATING_LINES.map((line, idx) => (
              <button
                key={line}
                onClick={() => setLineIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  lineIndex === idx
                    ? "w-8 h-2 bg-gradient-to-r from-violet-400 to-cyan-400 shadow-md shadow-violet-500/40"
                    : "w-2 h-2 bg-white/20 hover:bg-white/50"
                }`}
                aria-label={`Jump to: ${line}`}
                title={line}
              />
            ))}
          </div>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Paper notebooks and unrecorded games steal money from your gaming zone every day. Ps07 Gaming Arena OS replaces notebooks with touch kiosks, OTP logins, dynamic UPI QR billing, and remote owner telemetrics.
          </p>

          {/* Hero CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#interactive-demo">
              <Button
                size="lg"
                className="w-full sm:w-auto h-12 px-8 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm gap-2 shadow-xl shadow-violet-950/60"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Try Interactive Demo</span>
              </Button>
            </a>

            <Link href="/kiosk/kiosk-snooker-1" target="_blank">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-8 border-white/10 hover:bg-white/[0.05] text-white font-semibold text-sm gap-2"
              >
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Launch Table Kiosk (Tablet View)</span>
              </Button>
            </Link>
          </div>

          {/* Key Metrics Strip */}
          <div className="mt-20 pt-12 border-t border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-white">100%</div>
              <p className="text-xs text-slate-400 mt-1">Cash Reconciliation Accuracy</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-cyan-400">0</div>
              <p className="text-xs text-slate-400 mt-1">Unbilled Ghost Games</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-violet-400">35+</div>
              <p className="text-xs text-slate-400 mt-1">Tables Powered by OS</p>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">&lt; 15s</div>
              <p className="text-xs text-slate-400 mt-1">Table Turnover via UPI QR</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Interactive Live Table Board Demo */}
      <section id="interactive-demo" className="py-20 bg-[#0E0E18]/60 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Interactive Test Drive
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
              See How It Works in 30 Seconds
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Experience the real kiosk workflow. Tap to start, view the running timer, and generate an automated UPI bill.
            </p>
          </div>

          {/* Interactive Simulation Console */}
          <div className="max-w-3xl mx-auto p-6 sm:p-8 rounded-3xl bg-[#07070B] border border-white/[0.1] shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">
                  Table 1 • Championship Riley Aristocrat Snooker
                </span>
              </div>
              <span className="text-xs font-mono text-violet-400 font-bold">
                Rate: ₹300/hour
              </span>
            </div>

            {/* Step: IDLE */}
            {demoStep === "idle" && (
              <div className="py-16 text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center mx-auto text-violet-400 animate-pulse">
                  <Play className="w-8 h-8 fill-violet-400 ml-1" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Table 1 is Available</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Customers enter their phone number on the tablet kiosk to start their game session.
                  </p>
                </div>
                <Button
                  onClick={() => setDemoStep("running")}
                  size="lg"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-8"
                >
                  <span>Tap to Start Session (Customer Login)</span>
                </Button>
              </div>
            )}

            {/* Step: RUNNING */}
            {demoStep === "running" && (
              <div className="py-12 text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>Session Live • Player +91 {demoCustomerPhone}</span>
                </div>

                <div className="space-y-2">
                  <div className="text-5xl sm:text-6xl font-black font-mono text-white tracking-tight">
                    {demoElapsedMinutes} <span className="text-2xl text-slate-500 font-sans font-medium">mins</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">
                    Running Bill: ₹{demoAmountRupees}
                  </div>
                </div>

                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Derived strictly from server clock. Kiosk timer cannot be tampered with.
                </p>

                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => setDemoStep("stopping")}
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-6"
                  >
                    <span>Request End of Session</span>
                  </Button>
                </div>
              </div>
            )}

            {/* Step: STOPPING */}
            {demoStep === "stopping" && (
              <div className="py-12 text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 animate-spin">
                  <Clock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Stop Requested</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                    Reception live board rings an audible chime to review and confirm billing.
                  </p>
                </div>
                <Button
                  onClick={() => setDemoStep("billed")}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-8"
                >
                  <span>Reception Confirms Bill</span>
                </Button>
              </div>
            )}

            {/* Step: BILLED / UPI QR */}
            {demoStep === "billed" && (
              <div className="py-8 text-center space-y-6">
                <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-xl">
                  <QrCode className="w-40 h-40 text-black" />
                </div>

                <div>
                  <div className="text-3xl font-black font-mono text-emerald-400">
                    ₹{demoAmountRupees}.00
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Scan with any UPI app (GPay / PhonePe / Paytm). Instant auto-detection.
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      setDemoStep("idle");
                      setDemoSeconds(0);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-6"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    <span>Simulate Payment & Reset Demo</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Anti-Theft Shield Section */}
      <section id="anti-theft" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
            Deterrence Engine
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
            Why Traditional Notebooks Steal From You
          </h2>
          <p className="text-sm text-slate-400 mt-3 leading-relaxed">
            In typical gaming lounges, staff pocket cash walk-ins, start off-the-record games for friends, and skip bills. Here is how Ps07 Gaming Arena OS eliminates theft permanently:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] hover:border-violet-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">1. Customer OTP Initiation</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Customers start sessions themselves on the table kiosk with their mobile OTP. Staff cannot secretly skip logging the game.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] hover:border-cyan-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">2. Smart-Plug Power Sensors</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              IoT sensors detect power draw on table overhead lights and PS5 consoles. Drawing power without an active session flags an owner theft alert.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] hover:border-amber-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">3. Flagged Staff Manual Starts</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              When staff start a session manually from the reception desk, it is permanently flagged `started_by: staff` and spotlighted on owner audit reports.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] hover:border-emerald-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">4. Tamper-Proof Ledger</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Invoices can never be edited or deleted. Voiding a bill requires a mandatory justification and triggers an anomaly audit.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] hover:border-rose-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mb-4">
              <Banknote className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">5. Daily Cash Reconciliation</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Calculates expected cash from reception receipts against physical currency denominations counted at shift end, instantly catching shortages.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#0E0E18] border border-white/[0.08] hover:border-blue-500/30 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-4">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">6. Remote Owner Control</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Monitor live arena occupancy, active tables, revenue collected, and staff activities from anywhere in the world on your smartphone.
            </p>
          </div>
        </div>
      </section>

      {/* 5. ROI Leakage Calculator */}
      <section id="roi-calculator" className="py-20 bg-[#0E0E18]/60 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#07070B] via-[#0E0E18] to-violet-950/20 border border-white/[0.1] shadow-2xl">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
                <Calculator className="w-4 h-4" /> Leakage Calculator
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white mt-2">
                How Much Are You Losing To Paper Notebooks?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 font-bold mb-2">
                    <span>Number of Tables / Stations:</span>
                    <span className="font-mono text-cyan-400 text-sm">{calcTables} Tables</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="24"
                    value={calcTables}
                    onChange={(e) => setCalcTables(parseInt(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 font-bold mb-2">
                    <span>Average Hourly Rate:</span>
                    <span className="font-mono text-violet-400 text-sm">₹{calcHourlyRate}/hour</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="800"
                    step="50"
                    value={calcHourlyRate}
                    onChange={(e) => setCalcHourlyRate(parseInt(e.target.value))}
                    className="w-full accent-violet-400 cursor-pointer"
                  />
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  *Based on industry averages of 1.5 unrecorded or discounted hours per table daily in non-kiosk gaming lounges.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-black/50 border border-rose-500/30 text-center space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Estimated Monthly Cash Leakage
                </div>
                <div className="text-4xl sm:text-5xl font-black font-mono text-white">
                  {formatPaise(estimatedLeakPaise)}
                </div>
                <div className="text-xs text-emerald-400 font-semibold">
                  Ps07 Gaming Arena OS recovers 100% of this leakage in month 1.
                </div>
                <Link href="/owner">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 mt-3">
                    Protect My Lounge Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pricing Tiers */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
            Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white mt-2">
            Simple SaaS Plans for Every Lounge
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            No long-term contracts. 14-day free trial on all plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="p-8 rounded-3xl bg-[#0E0E18] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Starter Arena</h3>
              <p className="text-xs text-slate-400 mt-1">For single-outlet clubs with up to 5 tables.</p>
              <div className="text-4xl font-black font-mono text-white mt-6">
                ₹2,999<span className="text-sm font-sans text-slate-400 font-normal"> / month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 mt-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 5 Table Touch Kiosks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Customer Phone OTP Login</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dynamic UPI QR Payments</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Live Reception Desk Board</span>
                </li>
              </ul>
            </div>

            <Link href="/login" className="mt-8">
              <Button variant="outline" className="w-full text-xs border-white/10 hover:bg-white/[0.05]">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Professional - Featured */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-violet-950/40 via-[#0E0E18] to-[#0E0E18] border-2 border-violet-500/50 shadow-2xl shadow-violet-950/50 relative flex flex-col justify-between">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold bg-violet-600 text-white uppercase tracking-wider">
              Most Popular
            </span>

            <div>
              <h3 className="font-bold text-white text-lg">Professional Arena</h3>
              <p className="text-xs text-slate-400 mt-1">For high-traffic lounges up to 10 tables.</p>
              <div className="text-4xl font-black font-mono text-violet-300 mt-6">
                ₹4,999<span className="text-sm font-sans text-slate-400 font-normal"> / month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 mt-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Up to 10 Table Touch Kiosks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Full Anti-Theft Anomaly Engine</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Smart-Plug Power Sensor Alerts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Daily Cash Reconciliation Lock</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>VIP Memberships & Hour Passes</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Automated WhatsApp Invoices</span>
                </li>
              </ul>
            </div>

            <Link href="/login" className="mt-8">
              <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs h-10 shadow-lg shadow-violet-950/60">
                Start 14-Day Free Trial
              </Button>
            </Link>
          </div>

          {/* Enterprise */}
          <div className="p-8 rounded-3xl bg-[#0E0E18] border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-white text-lg">Enterprise Arena</h3>
              <p className="text-xs text-slate-400 mt-1">Multi-branch chains and reseller licenses.</p>
              <div className="text-4xl font-black font-mono text-white mt-6">
                ₹8,999<span className="text-sm font-sans text-slate-400 font-normal"> / month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-300 mt-8">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Unlimited Tables & Outlets</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Master Reseller Sub-Licensing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Custom Domain & Brand Theming</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Dedicated Account Manager & 24/7 SLA</span>
                </li>
              </ul>
            </div>

            <Link href="/platform" className="mt-8">
              <Button variant="outline" className="w-full text-xs border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10">
                Reseller Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="border-t border-white/[0.08] bg-[#07070B] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500">
          <KhushiLogo size="sm" href="/" />
          <p>© 2026 Ps07 Gaming Arena OS. All rights reserved. Master Tenant & SaaS Reseller Platform.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">
              Staff Desk
            </Link>
            <Link href="/reception" className="hover:text-white transition-colors">
              Reception
            </Link>
            <Link href="/owner" className="hover:text-white transition-colors">
              Owner Hub
            </Link>
            <Link href="/platform" className="hover:text-white transition-colors">
              Reseller
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

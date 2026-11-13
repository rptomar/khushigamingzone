"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useLive } from "@/lib/hooks/useLive";
import { KhushiLogo } from "@/components/premium/KhushiLogo";
import { GlowCard } from "@/components/premium/GlowCard";
import { LiveTimerRing } from "@/components/premium/LiveTimerRing";
import { KeypadInput } from "@/components/premium/KeypadInput";
import { OtpInput } from "@/components/premium/OtpInput";
import { StatusPill } from "@/components/premium/StatusPill";
import { Button } from "@/components/ui/button";
import { formatPaise } from "@/lib/utils";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  Play,
  CheckCircle2,
  StopCircle,
  Pause,
  AlertCircle,
  Clock,
  Sparkles,
  Crown,
  ChevronLeft,
  QrCode,
  Zap,
} from "lucide-react";

type KioskStep = "idle" | "phone" | "otp" | "plan" | "running" | "stopping" | "payment" | "success";

export default function KioskPage() {
  const params = useParams();
  const deviceToken = params.deviceToken as string;

  // Live polling (3s) for table & session state
  const { data, mutate, isReconnecting } = useLive<{
    resource: any;
    session: any;
    elapsedSeconds: number;
    runningAmountPaise: number;
    invoice?: any;
    upiQrDataUrl?: string;
  }>(`/api/kiosk/${deviceToken}`, { refreshInterval: 2500 });

  const resource = data?.resource;
  const session = data?.session;
  const invoice = data?.invoice;
  const upiQrDataUrl = data?.upiQrDataUrl;

  // Local interactive flow states
  const [step, setStep] = useState<KioskStep>("idle");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"hourly" | "membership">("hourly");
  const [submitting, setSubmitting] = useState(false);
  const [confirmStopOpen, setConfirmStopOpen] = useState(false);

  // Sync step with server session state
  useEffect(() => {
    if (!session || session.status === "paid") {
      if (step === "running" || step === "stopping" || step === "payment") {
        // Just got paid on reception! Trigger success confetti
        triggerSuccessCelebration();
      }
    } else if (session.status === "active" || session.status === "paused") {
      setStep("running");
    } else if (session.status === "stopping") {
      setStep("stopping");
    } else if (session.status === "billed" || resource?.status === "awaiting_payment") {
      setStep("payment");
    }
  }, [session?.status, resource?.status]);

  const triggerSuccessCelebration = () => {
    setStep("success");
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#8B5CF6", "#06B6D4", "#F59E0B", "#10B981"],
    });

    // Auto-reset to idle after 8 seconds as per brief
    setTimeout(() => {
      setStep("idle");
      setPhone("");
      setOtp("");
      mutate();
    }, 8000);
  };

  // 1. Phone input via touch keypad
  const handlePhoneDigit = (digit: string) => {
    if (phone.length < 10) {
      setPhone((prev) => prev + digit);
    }
  };
  const handlePhoneDelete = () => {
    setPhone((prev) => prev.slice(0, -1));
  };
  const handlePhoneClear = () => {
    setPhone("");
  };

  // 2. Request OTP
  const handleRequestOtp = async () => {
    if (phone.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to send OTP");

      if (resData.devOtp) {
        setDevOtpHint(resData.devOtp);
      }
      toast.success("OTP sent to your phone");
      setStep("otp");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Verify OTP
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Invalid OTP code");

      toast.success("Phone verified!");
      setStep("plan");
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Start Session
  const handleStartSession = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/kiosk/${deviceToken}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          planName: selectedPlan === "membership" ? "VIP Membership" : "Standard Hourly",
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to start session");

      toast.success("Game on! Stopwatch running.");
      setStep("running");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Could not start session");
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Customer Requests Stop
  const handleRequestStop = async () => {
    setConfirmStopOpen(false);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/kiosk/${deviceToken}/stop`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to request stop");

      toast.info("Stop requested. Waiting for reception to confirm bill.");
      setStep("stopping");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Could not request stop");
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Pause / Resume Toggle
  const handleTogglePause = async () => {
    try {
      await fetch(`/api/kiosk/${deviceToken}/pause`, { method: "POST" });
      mutate();
    } catch {
      toast.error("Failed to toggle pause");
    }
  };

  // 7. Dev mode simulate payment
  const handleSimulatePayment = async () => {
    if (!invoice?.id) return;
    try {
      const res = await fetch("/api/payments/mock-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, method: "upi" }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      triggerSuccessCelebration();
    } catch (err: any) {
      toast.error(err.message || "Simulate payment failed");
    }
  };

  if (!resource) {
    return (
      <div className="min-h-screen bg-[#07070B] flex flex-col items-center justify-center p-6 text-center text-slate-100">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <h1 className="text-xl font-bold">Kiosk Device Not Paired</h1>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">
          Device token <span className="font-mono text-violet-400 font-bold">{deviceToken}</span> is not mapped to any table. Please pair it in the Owner Settings screen.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#07070B] text-slate-100 flex flex-col justify-between p-6 sm:p-10 select-none overflow-hidden relative font-[family-name:var(--font-sans)]">
      {/* Background ambient lighting based on game type */}
      <div className="absolute -top-32 -left-32 w-[45vw] h-[45vw] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[45vw] h-[45vw] rounded-full bg-cyan-600/15 blur-[140px] pointer-events-none" />

      {/* Top Kiosk Header */}
      <header className="relative z-20 flex items-center justify-between w-full">
        <KhushiLogo size="md" />

        <div className="flex items-center gap-3">
          {/* Subtle Live Connection Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${isReconnecting ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                }`}
            />
            <span className="text-slate-300">
              {isReconnecting ? "Reconnecting..." : "Table Live"}
            </span>
          </div>

          <StatusPill status={resource.status} />
        </div>
      </header>

      {/* Main Kiosk Interactive Canvas */}
      <main className="relative z-20 my-auto w-full max-w-4xl mx-auto flex flex-col items-center justify-center py-6">
        {/* STEP 1: IDLE SCREEN (Tap to Start) */}
        {step === "idle" && (
          <div className="text-center space-y-8 animate-in fade-in duration-500 flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Smart Gaming Table Tablet</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white font-[family-name:var(--font-display)] drop-shadow-md">
                {resource.name}
              </h1>
              <p className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500 font-[family-name:var(--font-mono)]">
                {formatPaise(resource.hourlyRatePaise)} / Hour
              </p>
            </div>

            {/* Giant Animated Tap to Start Button */}
            <button
              type="button"
              onClick={() => setStep("phone")}
              className="group relative flex items-center justify-center gap-4 px-12 py-7 rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-cyan-500 text-white font-extrabold text-2xl shadow-2xl shadow-violet-600/40 hover:shadow-violet-600/60 active:scale-95 transition-all duration-200 border border-white/20"
            >
              <div className="p-3 rounded-2xl bg-white/20 group-hover:scale-110 transition-transform">
                <Play className="w-8 h-8 fill-current" />
              </div>
              <span className="tracking-wide uppercase font-[family-name:var(--font-display)]">
                Tap to Start Playing
              </span>
            </button>

            <p className="text-xs text-slate-400 max-w-md">
              Instant login with your mobile number. Live automated per-minute billing.
            </p>
          </div>
        )}

        {/* STEP 2: PHONE ENTRY */}
        {step === "phone" && (
          <div className="w-full max-w-md space-y-6 animate-in zoom-in-95 duration-300 flex flex-col items-center">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-display)]">
                Enter Mobile Number
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                We’ll send an instant 6-digit OTP to verify your session.
              </p>
            </div>

            {/* Large Digits Display */}
            <div className="w-full p-4 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center gap-3">
              <span className="text-xl font-bold text-slate-400 font-mono">+91</span>
              <span className="text-3xl sm:text-4xl font-extrabold tracking-widest text-white font-[family-name:var(--font-mono)]">
                {phone.padEnd(10, "•")}
              </span>
            </div>

            {/* Large Touch Keypad */}
            <KeypadInput
              onDigit={handlePhoneDigit}
              onDelete={handlePhoneDelete}
              onClear={handlePhoneClear}
            />

            <div className="w-full flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep("idle")}
                className="flex-1"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span>Cancel</span>
              </Button>

              <Button
                size="lg"
                onClick={handleRequestOtp}
                disabled={phone.length !== 10 || submitting}
                className="flex-[2] font-bold text-base"
              >
                {submitting ? "Sending OTP..." : "Get OTP &rarr;"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: OTP VERIFICATION */}
        {step === "otp" && (
          <div className="w-full max-w-md space-y-6 animate-in zoom-in-95 duration-300 flex flex-col items-center">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-display)]">
                Verify 6-Digit OTP
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter the verification code sent to <span className="font-mono text-white">+91 {phone}</span>
              </p>
            </div>

            {devOtpHint && (
              <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
                Dev OTP Hint: {devOtpHint}
              </div>
            )}

            <OtpInput value={otp} onChange={setOtp} onComplete={handleVerifyOtp} />

            <KeypadInput
              onDigit={(d) => otp.length < 6 && setOtp((p) => p + d)}
              onDelete={() => setOtp((p) => p.slice(0, -1))}
              onClear={() => setOtp("")}
            />

            <div className="w-full flex gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setStep("phone")}
                className="flex-1"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                <span>Back</span>
              </Button>

              <Button
                size="lg"
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || submitting}
                className="flex-[2] font-bold text-base"
              >
                {submitting ? "Verifying..." : "Verify & Continue"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: PLAN SELECTION */}
        {step === "plan" && (
          <div className="w-full max-w-xl space-y-6 animate-in zoom-in-95 duration-300">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-display)]">
                Select Your Plan
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Choose pay-per-minute hourly rate or redeem an active membership.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hourly Plan Option */}
              <div
                onClick={() => setSelectedPlan("hourly")}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${selectedPlan === "hourly"
                    ? "bg-violet-600/20 border-violet-500 ring-2 ring-violet-500/40 shadow-xl shadow-violet-600/20"
                    : "bg-white/[0.04] border-white/10 hover:border-white/20"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Standard Pay-Per-Play
                  </span>
                  <Clock className="w-5 h-5 text-violet-400" />
                </div>
                <div className="mt-4 text-3xl font-extrabold text-white font-[family-name:var(--font-mono)]">
                  {formatPaise(resource.hourlyRatePaise)}
                  <span className="text-sm font-normal text-slate-400">/hr</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Billed automatically to the second. Pay at reception when done.
                </p>
              </div>

              {/* Membership Option */}
              <div
                onClick={() => setSelectedPlan("membership")}
                className={`p-6 rounded-2xl border cursor-pointer transition-all ${selectedPlan === "membership"
                    ? "bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-500/20"
                    : "bg-white/[0.04] border-white/10 hover:border-white/20"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    VIP Membership Pass
                  </span>
                  <Crown className="w-5 h-5 text-amber-400" />
                </div>
                <div className="mt-4 text-3xl font-extrabold text-amber-300 font-[family-name:var(--font-mono)]">
                  0 Paise
                  <span className="text-sm font-normal text-slate-400">/hr</span>
                </div>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                  Deducts from your prepaid monthly hours balance. Zero extra payment.
                </p>
              </div>
            </div>

            <Button
              size="xl"
              onClick={handleStartSession}
              disabled={submitting}
              className="w-full font-extrabold text-lg gap-2 shadow-2xl"
            >
              <Zap className="w-5 h-5" />
              <span>{submitting ? "Starting..." : "Start Game Now"}</span>
            </Button>
          </div>
        )}

        {/* STEP 5: LIVE RUNNING SESSION */}
        {step === "running" && (
          <div className="flex flex-col items-center space-y-6 animate-in zoom-in-95 duration-500">
            <div className="text-center space-y-1">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                Playing: {resource.name}
              </div>
              <h2 className="text-lg font-bold text-slate-200">
                Gamer: {session?.customerName || "Guest"} ({session?.customerPhone})
              </h2>
            </div>

            {/* Circular Timer Ring with Live Counting Amount */}
            <LiveTimerRing
              elapsedSeconds={data?.elapsedSeconds || 0}
              runningAmountPaise={data?.runningAmountPaise || 0}
              ratePerHourPaise={resource.hourlyRatePaise}
              size={340}
              isPaused={session?.status === "paused"}
            />

            {/* Actions: Pause & End Session */}
            <div className="flex items-center gap-4 w-full max-w-sm">
              <Button
                variant="outline"
                size="lg"
                onClick={handleTogglePause}
                className="flex-1 gap-2 text-sm"
              >
                <Pause className="w-4 h-4" />
                <span>{session?.status === "paused" ? "Resume" : "Pause"}</span>
              </Button>

              <Button
                variant="destructive"
                size="lg"
                onClick={() => setConfirmStopOpen(true)}
                className="flex-1 gap-2 text-sm font-bold shadow-lg shadow-rose-600/30"
              >
                <StopCircle className="w-4 h-4" />
                <span>End Session</span>
              </Button>
            </div>
          </div>
        )}

        {/* STEP 6: STOPPING / WAITING FOR RECEPTION */}
        {step === "stopping" && (
          <div className="text-center space-y-6 max-w-md animate-in fade-in duration-300">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center mx-auto animate-pulse">
              <Clock className="w-10 h-10 text-amber-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-[family-name:var(--font-display)]">
                Stop Requested
              </h2>
              <p className="text-sm text-slate-400">
                Reception has been notified. Please wait a moment while staff confirms your play time and generates your final bill.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-slate-300">
              Estimated Total: {formatPaise(data?.runningAmountPaise || 0)}
            </div>
          </div>
        )}

        {/* STEP 7: BILL + DYNAMIC UPI QR PAYMENT */}
        {step === "payment" && (
          <div className="w-full max-w-md text-center space-y-6 animate-in zoom-in-95 duration-400 flex flex-col items-center">
            <div className="space-y-1">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                Invoice #{invoice?.invoiceNo || "KGZ-0000"}
              </span>
              <h2 className="text-3xl font-extrabold text-white font-[family-name:var(--font-display)]">
                {formatPaise(invoice?.totalPaise || data?.runningAmountPaise || 0)}
              </h2>
              <span className="text-xs text-slate-400">
                Includes 18% GST ({formatPaise(invoice?.gstPaise || 0)})
              </span>
            </div>

            {/* Dynamic UPI QR Code */}
            {upiQrDataUrl ? (
              <div className="p-4 rounded-3xl bg-white shadow-2xl flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={upiQrDataUrl}
                  alt="UPI QR Code"
                  className="w-56 h-56 object-contain"
                />
                <span className="mt-2 text-[11px] font-bold text-slate-800 font-mono">
                  Scan with GPay / PhonePe / Paytm / BHIM
                </span>
              </div>
            ) : (
              <div className="w-56 h-56 rounded-3xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-slate-600 animate-pulse" />
              </div>
            )}

            <p className="text-xs text-slate-400 max-w-xs">
              Waiting for payment detection... You can also pay cash at reception.
            </p>

            {/* Dev mode simulation button for instant zero-key test */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSimulatePayment}
              className="text-xs font-bold text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
            >
              Simulate Instant UPI Payment (Dev Demo)
            </Button>
          </div>
        )}

        {/* STEP 8: SUCCESS / THANK YOU */}
        {step === "success" && (
          <div className="text-center space-y-6 max-w-md animate-in zoom-in duration-500 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-[family-name:var(--font-display)]">
                Payment Successful!
              </h2>
              <p className="text-sm text-slate-300">
                Thank you for playing at <span className="font-bold text-white">Ps07 Gaming Arena</span>.
              </p>
              <p className="text-xs text-slate-400">
                Your official GST tax invoice has been sent to your WhatsApp.
              </p>
            </div>

            <span className="text-[11px] font-mono text-slate-500">
              Screen resets automatically in a few seconds...
            </span>
          </div>
        )}
      </main>

      {/* Confirmation Modal for Ending Session */}
      {confirmStopOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <GlowCard className="max-w-sm w-full p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">End Gaming Session?</h3>
            <p className="text-xs text-slate-400">
              Are you ready to finish? Reception will be notified to confirm your play time and calculate the bill.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmStopOpen(false)}
              >
                Keep Playing
              </Button>
              <Button
                variant="destructive"
                className="flex-1 font-bold"
                onClick={handleRequestStop}
              >
                Yes, End Session
              </Button>
            </div>
          </GlowCard>
        </div>
      )}

      {/* Bottom Kiosk Footer */}
      <footer className="relative z-20 flex items-center justify-between text-[11px] text-slate-500 w-full pt-4 border-t border-white/[0.06]">
        <span>Ps07 Gaming Arena Kiosk OS</span>
        <span className="font-mono">Device: {deviceToken}</span>
      </footer>
    </div>
  );
}


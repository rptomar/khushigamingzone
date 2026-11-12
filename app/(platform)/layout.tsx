import React from "react";
import Link from "next/link";
import { KhushiLogo } from "@/components/premium/KhushiLogo";
import { Button } from "@/components/ui/button";
import { Layers, ArrowLeft, Shield, Globe } from "lucide-react";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#07070B] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0E0E18]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <KhushiLogo size="md" href="/platform" />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-bold">
              <Layers className="w-3.5 h-3.5" />
              <span>Reseller & Multi-Tenant HQ</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/owner">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-white/10 hover:bg-white/[0.05]">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Flagship Owner Hub</span>
              </Button>
            </Link>

            <Link href="/" target="_blank">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-slate-400 hover:text-white">
                <Globe className="w-3.5 h-3.5" />
                <span>Public Site</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

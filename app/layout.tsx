import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const fontDisplay = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Ps07 Gaming Arena — Smart Gaming Zone Management OS",
  description: "Next-generation SaaS platform for Snooker, Pool & Gaming Lounges. Kiosk-first automated time tracking, UPI billing & anti-theft controls.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} antialiased bg-[#07070B] text-slate-100 min-h-screen selection:bg-violet-600/30 selection:text-violet-200`}
      >
        {children}
        <Toaster position="top-right" richColors theme="dark" />
      </body>
    </html>
  );
}

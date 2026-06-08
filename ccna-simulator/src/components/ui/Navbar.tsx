"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Wifi, WifiOff } from "lucide-react";

export default function Navbar() {
  const { user, examHistory, questions } = useStore();

  const avgScore = examHistory.length
    ? Math.round(examHistory.reduce((a, e) => a + e.score, 0) / examHistory.length)
    : null;

  return (
    <header className="h-14 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6 sticky top-0 z-50">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-brand-blue flex items-center justify-center text-xs font-bold text-white">
          CC
        </div>
        <span className="font-semibold text-sm tracking-tight">CCNA Simulator</span>
        <span className="text-[10px] bg-bg-tertiary border border-border-primary rounded-full px-2 py-0.5 text-gray-500 font-mono">
          200-301
        </span>
      </Link>

      {/* Center status pills */}
      <div className="hidden md:flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-gray-500">
          <span className="text-gray-600">Questions:</span>
          <span className="text-brand-blue font-mono font-semibold">{questions.length}</span>
        </div>
        {avgScore !== null && (
          <>
            <div className="w-px h-3 bg-border-primary" />
            <div className="flex items-center gap-1.5 text-gray-500">
              <span className="text-gray-600">Avg Score:</span>
              <span className={`font-mono font-semibold ${avgScore >= 70 ? "text-brand-green" : avgScore >= 50 ? "text-brand-orange" : "text-brand-red"}`}>
                {avgScore}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Wifi size={13} className="text-brand-green" />
          <span>Claude AI</span>
        </div>
        {user ? (
          <div className="w-8 h-8 rounded-full bg-blue-900 border border-blue-700 flex items-center justify-center text-xs font-semibold text-brand-blue">
            {user.name?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <Link
            href="/login"
            className="text-xs bg-brand-blue-dark hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { ReactNode } from "react";

// ─── Badge ────────────────────────────────────────────────────
interface BadgeProps { children: ReactNode; variant?: "blue"|"green"|"red"|"orange"|"purple"|"gray"; className?: string }
export function Badge({ children, variant = "blue", className }: BadgeProps) {
  const colors = {
    blue: "bg-blue-500/10 text-brand-blue",
    green: "bg-green-500/10 text-brand-green",
    red: "bg-red-500/10 text-brand-red",
    orange: "bg-orange-500/10 text-brand-orange",
    purple: "bg-purple-500/10 text-brand-purple",
    gray: "bg-white/5 text-gray-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide", colors[variant], className)}>
      {children}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"secondary"|"danger"|"success"|"ghost";
  size?: "sm"|"md"|"lg";
  loading?: boolean;
}
export function Button({ children, variant = "primary", size = "md", loading, className, disabled, ...props }: ButtonProps) {
  const variants = {
    primary: "bg-brand-blue-dark hover:bg-blue-500 text-white",
    secondary: "bg-bg-tertiary hover:bg-bg-quaternary text-gray-200 border border-border-primary hover:border-border-secondary",
    danger: "bg-red-600 hover:bg-brand-red text-white",
    success: "bg-brand-green-dark hover:bg-brand-green text-white",
    ghost: "hover:bg-bg-tertiary text-gray-400 hover:text-gray-200",
  };
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base" };
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant], sizes[size], className
      )}
    >
      {loading && <Spinner size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────
interface CardProps { children: ReactNode; className?: string; onClick?: () => void }
export function Card({ children, className, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-bg-secondary border border-border-primary rounded-xl p-5",
        onClick && "cursor-pointer hover:border-border-secondary transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────
interface StatCardProps { label: string; value: string|number; sub?: string; color?: string }
export function StatCard({ label, value, sub, color = "text-white" }: StatCardProps) {
  return (
    <div className="bg-bg-secondary border border-border-primary rounded-xl p-4">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">{label}</div>
      <div className={cn("text-3xl font-bold font-mono leading-none", color)}>{value}</div>
      {sub && <div className="text-[11px] text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────
interface ProgressBarProps { value: number; max?: number; color?: string; className?: string }
export function ProgressBar({ value, max = 100, color, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const barColor = color || (pct >= 70 ? "bg-brand-green" : pct >= 50 ? "bg-brand-orange" : "bg-brand-red");
  return (
    <div className={cn("bg-bg-tertiary rounded-full h-1.5 overflow-hidden", className)}>
      <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────
export function Spinner({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Topic Bar Row ────────────────────────────────────────────
interface TopicBarProps { topic: string; score: number; attempts?: number }
export function TopicBar({ topic, score, attempts }: TopicBarProps) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1 text-gray-400">
        <span>{topic}</span>
        <span className={score >= 70 ? "text-brand-green" : score >= 50 ? "text-brand-orange" : "text-brand-red"}>
          {score}%{attempts ? ` · ${attempts}x` : ""}
        </span>
      </div>
      <ProgressBar value={score} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────
interface EmptyProps { icon?: string; title: string; sub?: string; action?: ReactNode }
export function Empty({ icon = "📭", title, sub, action }: EmptyProps) {
  return (
    <div className="text-center py-16 px-8">
      <div className="text-5xl mb-4">{icon}</div>
      <div className="text-gray-300 font-medium mb-2">{title}</div>
      {sub && <div className="text-gray-500 text-sm mb-6">{sub}</div>}
      {action}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────
interface SectionProps { title: string; sub?: string; action?: ReactNode }
export function Section({ title, sub, action }: SectionProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {sub && <p className="text-gray-400 text-sm mt-1">{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Info Box ─────────────────────────────────────────────────
export function InfoBox({ children, variant = "blue" }: { children: ReactNode; variant?: "blue"|"yellow"|"red" }) {
  const colors = {
    blue: "bg-blue-500/8 border-blue-500/20 text-blue-300",
    yellow: "bg-yellow-500/8 border-yellow-500/20 text-yellow-300",
    red: "bg-red-500/8 border-red-500/20 text-red-300",
  };
  return (
    <div className={cn("border rounded-xl p-4 text-sm leading-relaxed", colors[variant])}>
      {children}
    </div>
  );
}

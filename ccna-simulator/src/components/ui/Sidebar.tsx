"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import {
  LayoutDashboard, ClipboardList, BookOpen, Sparkles,
  MessageCircle, FileUp, BarChart2, LogOut,
} from "lucide-react";

const NAV = [
  { label: "Study", items: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/exam", icon: ClipboardList, label: "Take Exam" },
    { href: "/flashcards", icon: BookOpen, label: "Flashcards" },
  ]},
  { label: "AI Tools", items: [
    { href: "/dashboard/generate", icon: Sparkles, label: "Generate Questions" },
    { href: "/tutor", icon: MessageCircle, label: "AI Tutor" },
  ]},
  { label: "Content", items: [
    { href: "/upload", icon: FileUp, label: "PDF Upload" },
    { href: "/analytics", icon: BarChart2, label: "Analytics" },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  const { questions, flashcards, documents } = useStore();

  const badges: Record<string, number> = {
    "/exam": questions.length,
    "/flashcards": flashcards.length,
    "/upload": documents.length,
  };

  return (
    <aside className="w-52 bg-bg-secondary border-r border-border-primary flex flex-col shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
      <nav className="flex-1 py-3">
        {NAV.map((section) => (
          <div key={section.label}>
            <div className="px-4 py-2 mt-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
              {section.label}
            </div>
            {section.items.map(({ href, icon: Icon, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              const badge = badges[href];
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-2 text-sm border-l-2 transition-all",
                    active
                      ? "bg-blue-500/10 text-brand-blue border-brand-blue"
                      : "text-gray-400 border-transparent hover:bg-bg-tertiary hover:text-gray-200"
                  )}
                >
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="text-[10px] bg-blue-900/60 text-brand-blue px-1.5 py-0.5 rounded-full font-mono">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom user info */}
      <div className="border-t border-border-primary p-3">
        <div className="text-[10px] text-gray-500 text-center">CCNA Exam Simulator v2.0</div>
      </div>
    </aside>
  );
}

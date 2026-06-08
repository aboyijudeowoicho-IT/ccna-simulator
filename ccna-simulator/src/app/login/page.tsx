"use client";

import { useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createBrowserClient();

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created! Check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in!");
        router.push("/dashboard");
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  function continueWithoutAccount() {
    toast.success("Continuing in local mode — data saved in browser");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-brand-blue flex items-center justify-center text-2xl font-bold text-white mx-auto mb-4">
            CC
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CCNA Exam Simulator</h1>
          <p className="text-gray-400 text-sm mt-1">AI-powered CCNA 200-301 preparation</p>
        </div>

        {/* Card */}
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-8">
          <div className="flex gap-1 mb-6 bg-bg-tertiary rounded-xl p-1">
            {(["Sign In", "Sign Up"] as const).map((label, i) => (
              <button
                key={label}
                onClick={() => setIsSignUp(i === 1)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                  (isSignUp ? i === 1 : i === 0)
                    ? "bg-bg-secondary border border-border-primary text-gray-200"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-bg-tertiary border border-border-primary rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-blue-dark transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-bg-tertiary border border-border-primary rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-600 outline-none focus:border-brand-blue-dark transition-colors"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {isSignUp ? "Create Account" : "Sign In"}
            </Button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-primary" />
            </div>
            <div className="relative flex justify-center text-xs text-gray-600 bg-bg-secondary px-3">or</div>
          </div>

          <Button variant="secondary" className="w-full" onClick={continueWithoutAccount}>
            Continue without account (local mode)
          </Button>

          <p className="text-center text-xs text-gray-600 mt-4">
            In local mode, all data is stored in your browser only.
          </p>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: "🤖", label: "Claude AI Questions" },
            { icon: "📊", label: "Progress Analytics" },
            { icon: "🃏", label: "Smart Flashcards" },
          ].map((f) => (
            <div key={f.label} className="bg-bg-secondary border border-border-primary rounded-xl p-3">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-[10px] text-gray-500">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

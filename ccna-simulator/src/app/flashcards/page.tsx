"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, Badge, Section, Empty, InfoBox } from "@/components/ui";
import { DEMO_CCNA_CONTENT } from "@/lib/utils";
import toast from "react-hot-toast";
import { Sparkles, ChevronLeft, ChevronRight, Trash2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FlashcardsPage() {
  const { flashcards, addFlashcards, clearFlashcards, documents } = useStore();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const topics = [...new Set(flashcards.map((f) => f.topic))];
  const filtered = filter === "all" ? flashcards : flashcards.filter((f) => f.topic === filter);
  const current = filtered[index];

  async function handleGenerate() {
    setLoading(true);
    try {
      const contextOverride = documents.length === 0 ? DEMO_CCNA_CONTENT : undefined;
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 15, contextOverride }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { flashcards: newCards } = await res.json();
      addFlashcards(newCards);
      setIndex(0);
      setFlipped(false);
      toast.success(`Generated ${newCards.length} flashcards!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  function next() { setIndex((i) => Math.min(filtered.length - 1, i + 1)); setFlipped(false); }
  function prev() { setIndex((i) => Math.max(0, i - 1)); setFlipped(false); }

  function handleClear() {
    if (confirm("Clear all flashcards?")) { clearFlashcards(); setIndex(0); setFlipped(false); }
  }

  return (
    <div>
      <Section
        title="Flashcards"
        sub={`${flashcards.length} cards from your study materials`}
        action={
          <div className="flex gap-2">
            <Button onClick={handleGenerate} loading={loading} size="sm">
              <Sparkles size={14} /> Generate
            </Button>
            {flashcards.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClear} className="text-red-400">
                <Trash2 size={14} />
              </Button>
            )}
          </div>
        }
      />

      {flashcards.length === 0 ? (
        <div>
          <InfoBox className="mb-6">
            <strong>No flashcards yet.</strong> Click "Generate" to create flashcards from your uploaded PDFs using Claude AI.
            {documents.length === 0 && " Demo CCNA content will be used since no PDFs are uploaded."}
          </InfoBox>
          <Empty
            icon="🃏"
            title="No flashcards yet"
            sub="Generate AI-powered flashcards from your study materials"
            action={
              <Button onClick={handleGenerate} loading={loading}>
                <Sparkles size={15} /> Generate Flashcards
              </Button>
            }
          />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {/* Topic filter */}
          {topics.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-6">
              <button
                onClick={() => { setFilter("all"); setIndex(0); setFlipped(false); }}
                className={cn("text-xs px-3 py-1.5 rounded-full border transition-all",
                  filter === "all" ? "border-brand-blue bg-blue-500/10 text-brand-blue" : "border-border-primary text-gray-400 hover:border-border-secondary")}
              >
                All ({flashcards.length})
              </button>
              {topics.map((t) => (
                <button
                  key={t}
                  onClick={() => { setFilter(t); setIndex(0); setFlipped(false); }}
                  className={cn("text-xs px-3 py-1.5 rounded-full border transition-all",
                    filter === t ? "border-brand-blue bg-blue-500/10 text-brand-blue" : "border-border-primary text-gray-400 hover:border-border-secondary")}
                >
                  {t} ({flashcards.filter((f) => f.topic === t).length})
                </button>
              ))}
            </div>
          )}

          {/* Progress */}
          <div className="flex justify-between text-xs text-gray-500 mb-3">
            <span>Card {index + 1} of {filtered.length}</span>
            <span>{current?.topic}</span>
          </div>

          {/* Flashcard */}
          {current && (
            <div
              className="flashcard-scene cursor-pointer select-none mb-6"
              style={{ height: 260 }}
              onClick={() => setFlipped((f) => !f)}
            >
              <div className={cn("flashcard-card w-full h-full", flipped && "flipped")} style={{ height: 260 }}>
                {/* Front */}
                <div className="flashcard-front bg-bg-secondary border border-border-primary rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">Question</div>
                  <p className="text-lg font-medium leading-relaxed">{current.front}</p>
                  <div className="text-[10px] text-gray-600 mt-6">Click to reveal answer</div>
                </div>
                {/* Back */}
                <div className="flashcard-back bg-bg-secondary border border-brand-green/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                  <div className="text-[10px] text-brand-green uppercase tracking-widest mb-4">Answer</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{current.back}</p>
                  <div className="text-[10px] text-gray-600 mt-6">Click to flip back</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button variant="secondary" onClick={prev} disabled={index === 0}>
              <ChevronLeft size={16} /> Prev
            </Button>
            <button
              onClick={() => setFlipped((f) => !f)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <RotateCcw size={12} /> Flip
            </button>
            <Button variant="secondary" onClick={next} disabled={index >= filtered.length - 1}>
              Next <ChevronRight size={16} />
            </Button>
          </div>

          {/* Mini progress bar */}
          <div className="mt-6 bg-bg-tertiary rounded-full h-1 overflow-hidden">
            <div
              className="h-full bg-brand-blue-dark rounded-full transition-all duration-300"
              style={{ width: `${((index + 1) / filtered.length) * 100}%` }}
            />
          </div>
          <div className="text-center text-xs text-gray-600 mt-2">
            {Math.round(((index + 1) / filtered.length) * 100)}% through deck
          </div>
        </div>
      )}
    </div>
  );
}

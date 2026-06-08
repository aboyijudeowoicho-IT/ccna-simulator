"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "@/lib/store";
import { Button, Card, Badge, Section, Empty } from "@/components/ui";
import { formatTime, getDifficultyColor, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { BookmarkPlus, BookmarkCheck, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

// ─── Exam Setup ───────────────────────────────────────────────
function ExamSetup() {
  const router = useRouter();
  const { questions, startExam } = useStore();
  const [mode, setMode] = useState<"exam" | "practice">("exam");
  const [numQ, setNumQ] = useState(10);
  const [timePerQ, setTimePerQ] = useState(90);
  const [topicFilter, setTopicFilter] = useState("all");

  const topics = [...new Set(questions.map((q) => q.topic))];
  const maxQ = Math.min(questions.length, 50);

  function handleStart() {
    const pool = topicFilter === "all"
      ? questions
      : questions.filter((q) => q.topic === topicFilter);
    const selected = pool.slice(0, numQ);
    if (selected.length === 0) {
      toast.error("No questions available for selected filters");
      return;
    }
    startExam(selected, mode, timePerQ);
  }

  const typeCounts = ["multiple-choice", "choose-two", "troubleshooting", "subnetting", "command"].reduce(
    (acc, t) => ({ ...acc, [t]: questions.filter((q) => q.type === t).length }), {} as Record<string, number>
  );

  return (
    <div>
      <Section title="Take Exam" sub={`${questions.length} questions in your bank`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <div className="text-sm font-semibold mb-5">Exam Configuration</div>
          <div className="space-y-4">
            {/* Mode */}
            <div>
              <label className="text-xs text-gray-400 block mb-2">Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {(["exam", "practice"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={cn(
                      "py-3 px-4 rounded-xl border text-sm font-medium transition-all",
                      mode === m
                        ? "border-brand-blue bg-blue-500/10 text-brand-blue"
                        : "border-border-primary text-gray-400 hover:border-border-secondary"
                    )}
                  >
                    {m === "exam" ? "🎯 Exam Mode" : "📚 Practice Mode"}
                    <div className="text-[10px] font-normal mt-0.5 opacity-70">
                      {m === "exam" ? "Timed, answers at end" : "Instant feedback"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Questions */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">
                Questions: <span className="text-brand-blue font-mono">{numQ}</span>
              </label>
              <input
                type="range" min={5} max={maxQ} step={5} value={numQ}
                onChange={(e) => setNumQ(Number(e.target.value))}
                className="w-full accent-brand-blue-dark"
              />
            </div>

            {/* Time */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Time per Question</label>
              <select
                value={timePerQ}
                onChange={(e) => setTimePerQ(Number(e.target.value))}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-blue-dark"
              >
                <option value={60}>1 minute</option>
                <option value={90}>1.5 minutes</option>
                <option value={120}>2 minutes</option>
                <option value={0}>No limit</option>
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Topic Filter</label>
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-blue-dark"
              >
                <option value="all">All Topics</option>
                {topics.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <Button className="w-full" size="lg" onClick={handleStart}>
              Start Exam →
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-sm font-semibold mb-4">Question Bank</div>
          {Object.entries(typeCounts).filter(([, c]) => c > 0).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between py-2.5 border-b border-border-primary last:border-0">
              <span className="text-sm text-gray-300 capitalize">{type.replace("-", " ")}</span>
              <Badge variant="blue">{count}</Badge>
            </div>
          ))}
          <div className="mt-4 text-xs text-gray-500 leading-relaxed">
            Questions are randomized each exam. In exam mode, answers are revealed only after submission.
            Practice mode gives immediate feedback after each answer.
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Active Exam ──────────────────────────────────────────────
function ActiveExam() {
  const router = useRouter();
  const { currentExam, setAnswer, toggleMark, setCurrentQ, revealAnswer, finishExam } = useStore();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(currentExam?.timeLeft ?? 0);
  const [, forceUpdate] = useState(0);

  const exam = currentExam!;
  const q = exam.questions[exam.current];
  const userAnswers = exam.answers[exam.current] || [];
  const isAnswered = exam.answers[exam.current] !== undefined;
  const isMarked = exam.marked.includes(exam.current);
  const isRevealed = exam.revealed[exam.current];
  const isPractice = exam.mode === "practice";
  const showResult = isRevealed || (isPractice && isAnswered);

  // Timer
  useEffect(() => {
    if (exam.timePerQuestion === 0 || exam.finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          handleFinish(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  const handleFinish = useCallback((auto = false) => {
    clearInterval(timerRef.current!);
    const unanswered = exam.questions.length - Object.keys(exam.answers).length;
    if (!auto && unanswered > 0) {
      if (!confirm(`${unanswered} question${unanswered > 1 ? "s" : ""} unanswered. Submit anyway?`)) return;
    }
    const result = finishExam();
    if (result) router.push("/exam/score");
  }, [exam, finishExam, router]);

  function handleSelect(letter: string) {
    if (showResult) return;
    if (q.type === "choose-two") {
      const current = userAnswers.slice();
      if (current.includes(letter)) {
        setAnswer(exam.current, current.filter((l) => l !== letter));
      } else if (current.length < 2) {
        setAnswer(exam.current, [...current, letter]);
      }
    } else {
      setAnswer(exam.current, [letter]);
    }
    forceUpdate((n) => n + 1);
  }

  const optionClass = (letter: string) => {
    const isSelected = userAnswers.includes(letter);
    if (showResult) {
      if (q.correct.includes(letter)) return "border-brand-green bg-green-500/8";
      if (isSelected) return "border-brand-red bg-red-500/8";
      return "border-border-primary opacity-60";
    }
    return isSelected ? "border-brand-blue bg-blue-500/10" : "border-border-primary hover:border-border-secondary";
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Exam top bar */}
      <div className="bg-bg-secondary border-b border-border-primary px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Q{exam.current + 1} of {exam.questions.length}
          </span>
          <Badge variant={isPractice ? "blue" : "orange"}>
            {isPractice ? "Practice" : "Exam"} Mode
          </Badge>
          <div className="text-xs text-gray-500">
            Answered: {Object.keys(exam.answers).length}/{exam.questions.length}
          </div>
        </div>

        <div className={cn(
          "font-mono text-xl font-bold",
          exam.timePerQuestion > 0 && timeLeft < 120 ? "text-brand-red timer-warning" : "text-brand-orange"
        )}>
          {exam.timePerQuestion > 0 ? formatTime(timeLeft) : "∞"}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={isMarked ? "ghost" : "ghost"}
            size="sm"
            onClick={() => { toggleMark(exam.current); forceUpdate((n) => n + 1); }}
            className={isMarked ? "text-brand-yellow" : "text-gray-500"}
          >
            {isMarked ? <BookmarkCheck size={15} /> : <BookmarkPlus size={15} />}
            {isMarked ? "Marked" : "Mark"}
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleFinish()}>
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Exam body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-gray-500 font-mono">Q{exam.current + 1}</span>
              <Badge variant="blue">{q.topic}</Badge>
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide", getDifficultyColor(q.difficulty))}>
                {q.difficulty}
              </span>
              <Badge variant="gray">{q.type}</Badge>
              {q.type === "choose-two" && (
                <Badge variant="orange">Select 2 answers</Badge>
              )}
            </div>

            <p className="text-base leading-relaxed mb-5">{q.question}</p>

            {q.code && (
              <pre className="text-xs mb-5">{q.code}</pre>
            )}

            <div className="space-y-3">
              {q.options.map((o) => (
                <div
                  key={o.letter}
                  onClick={() => handleSelect(o.letter)}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                    optionClass(o.letter),
                    !showResult && "hover:bg-bg-tertiary"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0",
                    showResult && q.correct.includes(o.letter) ? "bg-brand-green-dark text-white" :
                    showResult && userAnswers.includes(o.letter) ? "bg-red-700 text-white" :
                    userAnswers.includes(o.letter) ? "bg-brand-blue-dark text-white" :
                    "bg-bg-quaternary text-gray-400"
                  )}>
                    {o.letter}
                  </div>
                  <p className="text-sm leading-relaxed pt-0.5">{o.text}</p>
                </div>
              ))}
            </div>

            {/* Explanation */}
            {showResult && (
              <div className="mt-5 bg-bg-tertiary rounded-xl p-4 border border-border-primary">
                <div className="text-xs font-semibold text-brand-blue uppercase tracking-wider mb-2">
                  {q.correct.every((c) => userAnswers.includes(c)) && userAnswers.every((a) => q.correct.includes(a))
                    ? "✅ Correct!" : "❌ Incorrect"}
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{q.explanation}</p>
                {q.wrongExplanations && Object.keys(q.wrongExplanations).length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Why others are wrong:</div>
                    {Object.entries(q.wrongExplanations).map(([k, v]) => (
                      <div key={k} className="text-xs text-gray-400 pl-3 border-l-2 border-border-primary leading-relaxed">
                        <strong className="text-gray-300">{k}:</strong> {v}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isPractice && isAnswered && !isRevealed && (
              <Button variant="secondary" className="mt-4" onClick={() => { revealAnswer(exam.current); forceUpdate((n) => n + 1); }}>
                Show Explanation
              </Button>
            )}

            {/* Nav buttons */}
            <div className="flex gap-3 mt-6">
              <Button variant="secondary" disabled={exam.current === 0} onClick={() => { setCurrentQ(exam.current - 1); forceUpdate((n) => n + 1); }}>
                <ChevronLeft size={15} /> Previous
              </Button>
              {exam.current < exam.questions.length - 1 ? (
                <Button onClick={() => { setCurrentQ(exam.current + 1); forceUpdate((n) => n + 1); }}>
                  Next <ChevronRight size={15} />
                </Button>
              ) : (
                <Button variant="success" onClick={() => handleFinish()}>
                  Finish Exam ✓
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Question palette */}
        <div className="w-52 bg-bg-secondary border-l border-border-primary p-4 overflow-y-auto shrink-0">
          <div className="text-xs font-semibold mb-3 text-gray-400">Navigator</div>
          <div className="grid grid-cols-5 gap-1.5 mb-4">
            {exam.questions.map((_, i) => {
              const isCurrent = i === exam.current;
              const isAnsweredQ = exam.answers[i] !== undefined;
              const isMarkedQ = exam.marked.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => { setCurrentQ(i); forceUpdate((n) => n + 1); }}
                  className={cn(
                    "w-8 h-8 rounded-md text-[11px] font-mono border transition-all",
                    isCurrent ? "bg-brand-blue-dark border-brand-blue text-white" :
                    isMarkedQ ? "bg-yellow-900/40 border-yellow-700 text-brand-yellow" :
                    isAnsweredQ ? "bg-blue-900/30 border-blue-700/50 text-brand-blue" :
                    "bg-bg-tertiary border-border-primary text-gray-500 hover:border-border-secondary"
                  )}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="space-y-1.5 text-[10px] text-gray-500">
            <div className="flex gap-1.5 items-center">
              <div className="w-3 h-3 rounded bg-brand-blue-dark" />Current
            </div>
            <div className="flex gap-1.5 items-center">
              <div className="w-3 h-3 rounded bg-blue-900/50 border border-blue-700/50" />Answered
            </div>
            <div className="flex gap-1.5 items-center">
              <div className="w-3 h-3 rounded bg-yellow-900/40 border border-yellow-700" />Marked
            </div>
            <div className="flex gap-1.5 items-center">
              <div className="w-3 h-3 rounded bg-bg-tertiary border border-border-primary" />Unanswered
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border-primary text-[10px] text-gray-500">
            Answered: {Object.keys(exam.answers).length}/{exam.questions.length}<br />
            Marked: {exam.marked.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Exam page router ─────────────────────────────────────────
export default function ExamPage() {
  const { questions, currentExam } = useStore();

  if (questions.length === 0) {
    return (
      <div className="p-6">
        <Empty
          icon="📋"
          title="No questions in your bank"
          sub="Generate or import questions first"
          action={
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.href = "/dashboard/generate"}>Generate Questions</Button>
              <Button variant="secondary" onClick={() => window.location.href = "/upload"}>Upload PDFs</Button>
            </div>
          }
        />
      </div>
    );
  }

  if (currentExam && !currentExam.finished) {
    return <ActiveExam />;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <ExamSetup />
    </div>
  );
}

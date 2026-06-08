"use client";

import { useStore } from "@/lib/store";
import { Button, Badge } from "@/components/ui";
import { cn, getDifficultyColor } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useEffect } from "react";

export default function ReviewPage() {
  const router = useRouter();
  const { currentExam } = useStore();

  useEffect(() => {
    if (!currentExam?.finished) router.replace("/exam");
  }, []);

  if (!currentExam?.finished) return null;

  const { questions, answers } = currentExam;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="secondary" size="sm" onClick={() => router.push("/exam/score")}>
          <ChevronLeft size={14} /> Back to Score
        </Button>
        <div>
          <h1 className="text-xl font-bold">Exam Review</h1>
          <p className="text-sm text-gray-400">{questions.length} questions</p>
        </div>
      </div>

      <div className="space-y-5">
        {questions.map((q, i) => {
          const ans = answers[i] || [];
          const isCorrect = q.correct.every((c) => ans.includes(c)) && ans.every((a) => q.correct.includes(a));

          return (
            <div key={q.id} className="bg-bg-secondary border border-border-primary rounded-xl p-5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-lg">{isCorrect ? "✅" : "❌"}</span>
                <span className="text-xs text-gray-500 font-mono">Q{i + 1}</span>
                <Badge variant="blue">{q.topic}</Badge>
                <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide", getDifficultyColor(q.difficulty))}>
                  {q.difficulty}
                </span>
              </div>

              <p className="text-sm leading-relaxed mb-3">{q.question}</p>
              {q.code && <pre className="text-xs mb-3">{q.code}</pre>}

              <div className="space-y-1.5">
                {q.options.map((o) => {
                  const isCorrectOpt = q.correct.includes(o.letter);
                  const isUserChoice = ans.includes(o.letter);
                  return (
                    <div
                      key={o.letter}
                      className={cn(
                        "flex items-start gap-2 px-3 py-2 rounded-lg border text-xs",
                        isCorrectOpt ? "border-brand-green bg-green-500/8 text-brand-green" :
                        isUserChoice ? "border-brand-red bg-red-500/8 text-brand-red" :
                        "border-border-primary text-gray-500"
                      )}
                    >
                      <strong>{o.letter}.</strong>
                      <span>{o.text}</span>
                      {isCorrectOpt && <span className="ml-auto">✓ Correct</span>}
                      {isUserChoice && !isCorrectOpt && <span className="ml-auto">✗ Your answer</span>}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 bg-bg-tertiary rounded-lg p-3 border-l-2 border-brand-blue-dark text-xs text-gray-400 leading-relaxed">
                <strong className="text-brand-blue">Explanation: </strong>{q.explanation}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center">
        <Button onClick={() => router.push("/exam")}>Take Another Exam →</Button>
      </div>
    </div>
  );
}

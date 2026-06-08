"use client";

import { useStore } from "@/lib/store";
import { Button, Card, TopicBar, Badge } from "@/components/ui";
import { formatTime, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

export default function ScorePage() {
  const router = useRouter();
  const { currentExam, clearExam } = useStore();

  useEffect(() => {
    if (!currentExam?.finished) router.replace("/exam");
  }, []);

  if (!currentExam?.finished) return null;

  const exam = currentExam;
  const result = (() => {
    let correct = 0;
    const topicMap: Record<string, { correct: number; total: number }> = {};
    exam.questions.forEach((q, i) => {
      const ans = exam.answers[i] || [];
      const isOk = q.correct.every((c) => ans.includes(c)) && ans.every((a) => q.correct.includes(a));
      if (isOk) correct++;
      if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0 };
      topicMap[q.topic].total++;
      if (isOk) topicMap[q.topic].correct++;
    });
    const score = Math.round((correct / exam.questions.length) * 100);
    return { score, correct, total: exam.questions.length, topicMap };
  })();

  const passed = result.score >= 70;
  const timeTaken = exam.finishedAt ? Math.round((exam.finishedAt - exam.startedAt) / 1000) : 0;

  return (
    <div className="max-w-3xl mx-auto p-6 text-center">
      <div className="text-5xl mb-4">{passed ? "🎉" : "📚"}</div>
      <div className={cn(
        "text-7xl font-bold font-mono mb-2",
        passed ? "text-brand-green" : result.score >= 50 ? "text-brand-orange" : "text-brand-red"
      )}>
        {result.score}%
      </div>
      <div className="text-gray-400 mb-1">
        {passed ? "PASSED — Great work!" : "NOT PASSED — Keep studying!"}
      </div>
      <div className="text-gray-500 text-sm mb-8">
        CCNA passing threshold: 70% | You scored {result.correct}/{result.total} correct
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Correct", value: result.correct, color: "text-brand-green" },
          { label: "Incorrect", value: result.total - result.correct, color: "text-brand-red" },
          { label: "Time", value: formatTime(timeTaken), color: "text-brand-blue" },
        ].map((s) => (
          <div key={s.label} className="bg-bg-secondary border border-border-primary rounded-xl p-4">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{s.label}</div>
            <div className={cn("text-3xl font-bold font-mono", s.color)}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card className="text-left mb-6">
        <div className="text-sm font-semibold mb-4">Topic Breakdown</div>
        {Object.entries(result.topicMap).map(([topic, r]) => {
          const pct = Math.round((r.correct / r.total) * 100);
          return (
            <TopicBar key={topic} topic={`${topic} (${r.correct}/${r.total})`} score={pct} />
          );
        })}
      </Card>

      <div className="flex gap-3 justify-center">
        <Link href="/exam/review">
          <Button variant="secondary">Review Answers</Button>
        </Link>
        <Button onClick={() => { clearExam(); router.push("/exam"); }}>
          Take Another Exam
        </Button>
        <Button variant="secondary" onClick={() => { clearExam(); router.push("/dashboard"); }}>
          Dashboard
        </Button>
      </div>
    </div>
  );
}

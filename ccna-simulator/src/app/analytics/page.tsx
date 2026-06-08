"use client";

import { useStore } from "@/lib/store";
import { computeAnalytics, getReadinessLabel } from "@/lib/analytics";
import { StatCard, Card, TopicBar, Badge, Section, Empty, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function AnalyticsPage() {
  const router = useRouter();
  const { examHistory, clearHistory } = useStore();
  const analytics = computeAnalytics(examHistory);

  if (examHistory.length === 0) {
    return (
      <div>
        <Section title="Analytics" sub="Track your CCNA exam performance over time" />
        <Empty
          icon="📊"
          title="No exam data yet"
          sub="Take some practice exams to see your performance analytics"
          action={<Button onClick={() => router.push("/exam")}>Take First Exam →</Button>}
        />
      </div>
    );
  }

  // Score history chart
  const scores = analytics.scoreHistory.slice(-10);
  const chartW = 560;
  const chartH = 140;
  const padX = 40;
  const padY = 20;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;

  const points = scores.map((s, i) => ({
    x: padX + (i / Math.max(scores.length - 1, 1)) * innerW,
    y: padY + (1 - s.score / 100) * innerH,
    score: s.score,
    date: s.date,
  }));

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaD = points.length > 0
    ? `${pathD} L${points[points.length - 1].x},${chartH - padY} L${points[0].x},${chartH - padY} Z`
    : "";

  const passY = padY + (1 - 0.7) * innerH;

  const TrendIcon = ({ trend }: { trend: "up" | "down" | "stable" }) =>
    trend === "up" ? <TrendingUp size={12} className="text-brand-green" /> :
    trend === "down" ? <TrendingDown size={12} className="text-brand-red" /> :
    <Minus size={12} className="text-gray-500" />;

  return (
    <div>
      <Section
        title="Performance Analytics"
        sub="CCNA 200-301 exam preparation progress"
        action={
          <button
            onClick={() => { if (confirm("Clear all exam history?")) clearHistory(); }}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Clear History
          </button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Average Score"
          value={`${analytics.avgScore}%`}
          color={analytics.avgScore >= 70 ? "text-brand-green" : analytics.avgScore >= 50 ? "text-brand-orange" : "text-brand-red"}
          sub={`Pass rate: ${analytics.passRate}%`}
        />
        <StatCard label="Exams Taken" value={analytics.totalExams} color="text-brand-blue" sub={`${examHistory.filter(e => e.score >= 70).length} passed`} />
        <StatCard label="Best Score" value={`${analytics.bestScore}%`} color="text-brand-purple" />
        <StatCard label="Readiness" value={`${analytics.readinessScore}%`}
          color={analytics.readinessScore >= 70 ? "text-brand-green" : analytics.readinessScore >= 50 ? "text-brand-orange" : "text-brand-red"}
          sub={getReadinessLabel(analytics.readinessScore)}
        />
      </div>

      {/* Score History Chart */}
      <Card className="mb-5">
        <div className="text-sm font-semibold mb-4">Score History (last {scores.length} exams)</div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ minWidth: 300 }}>
            {/* Grid lines */}
            {[0, 25, 50, 70, 100].map((v) => {
              const y = padY + (1 - v / 100) * innerH;
              return (
                <g key={v}>
                  <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="#21262d" strokeWidth={1} />
                  <text x={padX - 6} y={y + 4} textAnchor="end" fontSize={9} fill="#6e7681" fontFamily="JetBrains Mono">
                    {v}%
                  </text>
                </g>
              );
            })}
            {/* Pass line */}
            <line x1={padX} y1={passY} x2={chartW - padX} y2={passY} stroke="#3fb950" strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
            <text x={chartW - padX + 4} y={passY + 4} fontSize={8} fill="#3fb950" fontFamily="Sora">Pass</text>
            {/* Area */}
            {areaD && <path d={areaD} fill="#1f6feb" opacity={0.08} />}
            {/* Line */}
            {pathD && <path d={pathD} fill="none" stroke="#58a6ff" strokeWidth={2} strokeLinejoin="round" />}
            {/* Points */}
            {points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x} cy={p.y} r={5}
                  fill={p.score >= 70 ? "#3fb950" : p.score >= 50 ? "#f0883e" : "#f85149"}
                />
                <text x={p.x} y={p.y - 9} textAnchor="middle" fontSize={9} fill="#8b949e" fontFamily="JetBrains Mono">
                  {p.score}%
                </text>
              </g>
            ))}
          </svg>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Topic mastery */}
        <Card>
          <div className="text-sm font-semibold mb-4">Topic Mastery</div>
          {analytics.topicMastery.length > 0 ? (
            analytics.topicMastery.map((t) => (
              <div key={t.topic} className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1 text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={t.trend} />
                    <span>{t.topic}</span>
                  </div>
                  <span className={t.avgScore >= 70 ? "text-brand-green" : t.avgScore >= 50 ? "text-brand-orange" : "text-brand-red"}>
                    {t.avgScore}% ({t.attempts}x)
                  </span>
                </div>
                <div className="bg-bg-tertiary rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500",
                      t.avgScore >= 70 ? "bg-brand-green" : t.avgScore >= 50 ? "bg-brand-orange" : "bg-brand-red")}
                    style={{ width: `${t.avgScore}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Complete more exams to see topic breakdown.</p>
          )}
        </Card>

        {/* Exam history */}
        <Card>
          <div className="text-sm font-semibold mb-4">Full Exam History</div>
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {examHistory.slice().reverse().map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border-primary last:border-0">
                <span className="text-lg">{e.score >= 70 ? "✅" : "❌"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{e.mode} — {e.numQuestions}Q</div>
                  <div className="text-[11px] text-gray-500">{e.date}</div>
                </div>
                <div className={cn("font-mono font-semibold text-base",
                  e.score >= 70 ? "text-brand-green" : e.score >= 50 ? "text-brand-orange" : "text-brand-red")}>
                  {e.score}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weak / Strong */}
      {(analytics.weakTopics.length > 0 || analytics.strongTopics.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
          {analytics.weakTopics.length > 0 && (
            <Card>
              <div className="text-sm font-semibold mb-3">⚠️ Focus Areas</div>
              <div className="flex flex-wrap gap-2">
                {analytics.weakTopics.map((t) => <Badge key={t} variant="red">{t}</Badge>)}
              </div>
              <Button className="mt-4 w-full" variant="secondary" onClick={() => router.push("/dashboard/generate")}>
                Generate targeted questions →
              </Button>
            </Card>
          )}
          {analytics.strongTopics.length > 0 && (
            <Card>
              <div className="text-sm font-semibold mb-3">💪 Strong Topics</div>
              <div className="flex flex-wrap gap-2">
                {analytics.strongTopics.map((t) => <Badge key={t} variant="green">{t}</Badge>)}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

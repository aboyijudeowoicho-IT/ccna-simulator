"use client";

import { useStore } from "@/lib/store";
import { computeAnalytics, getReadinessLabel } from "@/lib/analytics";
import { StatCard, Card, TopicBar, Button, Badge, InfoBox } from "@/components/ui";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const { questions, examHistory, flashcards, documents } = useStore();
  const analytics = computeAnalytics(examHistory);

  const allTopics = ["IP Addressing", "Routing Protocols", "Switching", "WAN Technologies", "Security", "Network Services"];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Study Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">CCNA 200-301 exam readiness overview</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Avg Score"
          value={analytics.avgScore ? `${analytics.avgScore}%` : "—"}
          color={analytics.avgScore >= 70 ? "text-brand-green" : analytics.avgScore >= 50 ? "text-brand-orange" : "text-brand-red"}
          sub={analytics.avgScore >= 70 ? "↑ Passing range" : analytics.avgScore > 0 ? "↓ Below pass" : "No exams yet"}
        />
        <StatCard label="Exams Taken" value={analytics.totalExams} color="text-brand-blue" sub={`${questions.length} questions loaded`} />
        <StatCard label="Best Score" value={analytics.bestScore ? `${analytics.bestScore}%` : "—"} color="text-brand-purple" sub={`${flashcards.length} flashcards`} />
        <StatCard label="PDFs Loaded" value={documents.length} color="text-brand-orange" sub={`${documents.reduce((a, d) => a + d.chunks, 0)} chunks indexed`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Readiness ring */}
        <Card>
          <div className="text-sm font-semibold mb-4">🎯 Exam Readiness</div>
          <div className="flex flex-col items-center py-4">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="58" fill="none" stroke="#21262d" strokeWidth="12" />
              <circle
                cx="70" cy="70" r="58" fill="none"
                stroke={analytics.readinessScore >= 70 ? "#3fb950" : analytics.readinessScore >= 50 ? "#f0883e" : "#f85149"}
                strokeWidth="12"
                strokeDasharray={`${(analytics.readinessScore / 100) * 365} 365`}
                strokeLinecap="round"
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="65" textAnchor="middle" fontFamily="JetBrains Mono" fontSize="26" fontWeight="700"
                fill={analytics.readinessScore >= 70 ? "#3fb950" : analytics.readinessScore >= 50 ? "#f0883e" : "#f85149"}>
                {analytics.readinessScore}%
              </text>
              <text x="70" y="82" textAnchor="middle" fontFamily="Sora" fontSize="9" fill="#6e7681">
                READINESS
              </text>
            </svg>
            <p className="text-sm text-gray-400 mt-3">{getReadinessLabel(analytics.readinessScore)}</p>
            <Button className="mt-4 w-full" onClick={() => router.push("/exam")}>
              Take Practice Exam →
            </Button>
          </div>
        </Card>

        {/* Topic performance */}
        <Card>
          <div className="text-sm font-semibold mb-4">Topic Performance</div>
          {analytics.topicMastery.length > 0
            ? analytics.topicMastery.map((t) => (
                <TopicBar key={t.topic} topic={t.topic} score={t.avgScore} attempts={t.attempts} />
              ))
            : allTopics.map((t) => <TopicBar key={t} topic={t} score={0} />)
          }
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Weak topics */}
        <Card>
          <div className="text-sm font-semibold mb-4">⚠️ Weak Topics</div>
          {analytics.weakTopics.length > 0 ? (
            <>
              {analytics.weakTopics.slice(0, 4).map((t) => (
                <div key={t} className="flex items-center justify-between py-2 border-b border-border-primary last:border-0">
                  <span className="text-sm text-gray-300">{t}</span>
                  <Badge variant="red">Needs work</Badge>
                </div>
              ))}
              <Button className="w-full mt-4" variant="secondary" onClick={() => router.push("/dashboard/generate")}>
                Generate Practice Questions →
              </Button>
            </>
          ) : (
            <InfoBox>
              <strong className="text-blue-300">Take exams to track weak topics.</strong>{" "}
              After each exam, Claude identifies where you need more practice.
            </InfoBox>
          )}
        </Card>

        {/* Recent exams */}
        <Card>
          <div className="text-sm font-semibold mb-4">Recent Exams</div>
          {examHistory.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-gray-500 text-sm">No exams yet — take your first one!</p>
              <Button className="mt-4" onClick={() => router.push("/exam")}>Start Exam →</Button>
            </div>
          ) : (
            examHistory.slice(-5).reverse().map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border-primary last:border-0">
                <span className="text-xl">{e.score >= 70 ? "✅" : "❌"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{e.mode} Exam — {e.numQuestions}Q</div>
                  <div className="text-[11px] text-gray-500">{e.date}</div>
                </div>
                <span className={`font-mono font-semibold text-base ${e.score >= 70 ? "text-brand-green" : e.score >= 50 ? "text-brand-orange" : "text-brand-red"}`}>
                  {e.score}%
                </span>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Getting started banner */}
      {questions.length === 0 && (
        <div className="mt-6">
          <InfoBox>
            <strong className="text-blue-300">Getting Started:</strong>{" "}
            1. Go to{" "}
            <button onClick={() => router.push("/upload")} className="underline text-brand-blue">PDF Upload</button>{" "}
            and load your CCNA study materials (or use demo content) →{" "}
            2. Go to{" "}
            <button onClick={() => router.push("/dashboard/generate")} className="underline text-brand-blue">Generate Questions</button>{" "}
            to create AI-powered exam questions →{" "}
            3. Take a{" "}
            <button onClick={() => router.push("/exam")} className="underline text-brand-blue">Practice Exam</button>
          </InfoBox>
        </div>
      )}
    </div>
  );
}

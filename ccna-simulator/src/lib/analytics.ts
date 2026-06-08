import { ExamResult, AnalyticsData, TopicMastery } from "@/types";

export function computeAnalytics(history: ExamResult[]): AnalyticsData {
  if (history.length === 0) {
    return {
      totalExams: 0, avgScore: 0, bestScore: 0, worstScore: 0,
      readinessScore: 0, passRate: 0, topicMastery: [], scoreHistory: [],
      weakTopics: [], strongTopics: [],
    };
  }

  const scores = history.map((e) => e.score);
  const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const bestScore = Math.max(...scores);
  const worstScore = Math.min(...scores);
  const passRate = Math.round((history.filter((e) => e.score >= 70).length / history.length) * 100);

  // Readiness: weighted blend of avg score, pass rate, and exam count
  const examBonus = Math.min(20, history.length * 4);
  const readinessScore = Math.min(100, Math.round(avgScore * 0.6 + passRate * 0.25 + examBonus));

  // Topic mastery
  const topicMap: Record<string, number[]> = {};
  history.forEach((exam) => {
    exam.topicResults.forEach((t) => {
      if (!topicMap[t.topic]) topicMap[t.topic] = [];
      topicMap[t.topic].push(t.score);
    });
  });

  const topicMastery: TopicMastery[] = Object.entries(topicMap).map(([topic, topicScores]) => {
    const avg = Math.round(topicScores.reduce((a, b) => a + b, 0) / topicScores.length);
    const recent = topicScores.slice(-2);
    const trend: "up" | "down" | "stable" =
      recent.length < 2 ? "stable" : recent[1] > recent[0] ? "up" : recent[1] < recent[0] ? "down" : "stable";
    return { topic, avgScore: avg, attempts: topicScores.length, trend };
  }).sort((a, b) => a.avgScore - b.avgScore);

  const weakTopics = topicMastery.filter((t) => t.avgScore < 60).map((t) => t.topic);
  const strongTopics = topicMastery.filter((t) => t.avgScore >= 80).map((t) => t.topic);

  const scoreHistory = history.slice(-20).map((e) => ({
    date: e.date,
    score: e.score,
  }));

  return {
    totalExams: history.length, avgScore, bestScore, worstScore,
    readinessScore, passRate, topicMastery, scoreHistory, weakTopics, strongTopics,
  };
}

export function getReadinessLabel(score: number): string {
  if (score >= 85) return "🎯 Exam Ready!";
  if (score >= 70) return "📈 Almost Ready";
  if (score >= 50) return "📚 More Practice Needed";
  return "🔴 Intensive Study Required";
}

export function getScoreColor(score: number): string {
  if (score >= 70) return "text-brand-green";
  if (score >= 50) return "text-brand-orange";
  return "text-brand-red";
}

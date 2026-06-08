// ============================================================
// CCNA Simulator — Shared Types
// ============================================================

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType =
  | "multiple-choice"
  | "choose-two"
  | "troubleshooting"
  | "subnetting"
  | "command";

export type ExamMode = "exam" | "practice";

// ─── Question ───────────────────────────────────────────────
export interface QuestionOption {
  letter: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  topic: string;
  difficulty: Difficulty;
  question: string;
  code?: string; // router/switch output block
  options: QuestionOption[];
  correct: string[]; // e.g. ["A"] or ["A","C"] for choose-two
  explanation: string;
  wrongExplanations?: Record<string, string>;
  documentId?: string; // source PDF
  createdAt?: string;
}

// ─── Exam ────────────────────────────────────────────────────
export interface ExamSession {
  id: string;
  mode: ExamMode;
  questions: Question[];
  current: number;
  answers: Record<number, string[]>;
  marked: number[];
  timeLeft: number;
  timePerQuestion: number;
  startedAt: number;
  finishedAt?: number;
  revealed: Record<number, boolean>;
  finished: boolean;
}

export interface TopicResult {
  topic: string;
  correct: number;
  total: number;
  score: number;
}

export interface ExamResult {
  examId: string;
  score: number;
  correct: number;
  total: number;
  timeTaken: number;
  mode: ExamMode;
  topicResults: TopicResult[];
  date: string;
  numQuestions: number;
}

// ─── Flashcard ───────────────────────────────────────────────
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  topic: string;
  documentId?: string;
  createdAt?: string;
}

// ─── PDF / Document ──────────────────────────────────────────
export interface UploadedDocument {
  id: string;
  name: string;
  size: number;
  chunks: number;
  status: "uploading" | "processing" | "ready" | "error";
  uploadedAt: string;
  storagePath?: string;
}

// ─── Analytics ───────────────────────────────────────────────
export interface TopicMastery {
  topic: string;
  avgScore: number;
  attempts: number;
  trend: "up" | "down" | "stable";
}

export interface AnalyticsData {
  totalExams: number;
  avgScore: number;
  bestScore: number;
  worstScore: number;
  readinessScore: number;
  passRate: number;
  topicMastery: TopicMastery[];
  scoreHistory: { date: string; score: number }[];
  weakTopics: string[];
  strongTopics: string[];
}

// ─── Auth ────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt: string;
}

// ─── Chat / Tutor ────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  sources?: string[];
}

// ─── Store ──────────────────────────────────────────────────
export interface AppState {
  questions: Question[];
  examHistory: ExamResult[];
  flashcards: Flashcard[];
  documents: UploadedDocument[];
  currentExam: ExamSession | null;
  user: UserProfile | null;
}

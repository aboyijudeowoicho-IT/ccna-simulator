"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Question, ExamResult, Flashcard, UploadedDocument,
  ExamSession, ExamMode, UserProfile,
} from "@/types";

interface CCNAStore {
  // ─── Auth ───────────────────────────────────────
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  // ─── Questions ──────────────────────────────────
  questions: Question[];
  addQuestions: (qs: Question[]) => void;
  removeQuestion: (id: string) => void;
  clearQuestions: () => void;

  // ─── Exam History ───────────────────────────────
  examHistory: ExamResult[];
  addExamResult: (result: ExamResult) => void;
  clearHistory: () => void;

  // ─── Flashcards ─────────────────────────────────
  flashcards: Flashcard[];
  addFlashcards: (cards: Flashcard[]) => void;
  removeFlashcard: (id: string) => void;
  clearFlashcards: () => void;

  // ─── Documents ──────────────────────────────────
  documents: UploadedDocument[];
  addDocument: (doc: UploadedDocument) => void;
  updateDocument: (id: string, updates: Partial<UploadedDocument>) => void;
  removeDocument: (id: string) => void;

  // ─── Active Exam ────────────────────────────────
  currentExam: ExamSession | null;
  startExam: (questions: Question[], mode: ExamMode, timePerQ: number) => void;
  setAnswer: (qIndex: number, letters: string[]) => void;
  toggleMark: (qIndex: number) => void;
  setCurrentQ: (index: number) => void;
  revealAnswer: (qIndex: number) => void;
  finishExam: () => ExamResult | null;
  clearExam: () => void;
}

export const useStore = create<CCNAStore>()(
  persist(
    (set, get) => ({
      // ─── Auth ─────────────────────────────────────
      user: null,
      setUser: (user) => set({ user }),

      // ─── Questions ────────────────────────────────
      questions: [],
      addQuestions: (qs) =>
        set((s) => ({ questions: [...s.questions, ...qs] })),
      removeQuestion: (id) =>
        set((s) => ({ questions: s.questions.filter((q) => q.id !== id) })),
      clearQuestions: () => set({ questions: [] }),

      // ─── Exam History ─────────────────────────────
      examHistory: [],
      addExamResult: (result) =>
        set((s) => ({ examHistory: [...s.examHistory, result] })),
      clearHistory: () => set({ examHistory: [] }),

      // ─── Flashcards ───────────────────────────────
      flashcards: [],
      addFlashcards: (cards) =>
        set((s) => ({ flashcards: [...s.flashcards, ...cards] })),
      removeFlashcard: (id) =>
        set((s) => ({ flashcards: s.flashcards.filter((f) => f.id !== id) })),
      clearFlashcards: () => set({ flashcards: [] }),

      // ─── Documents ────────────────────────────────
      documents: [],
      addDocument: (doc) =>
        set((s) => ({ documents: [...s.documents, doc] })),
      updateDocument: (id, updates) =>
        set((s) => ({
          documents: s.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      removeDocument: (id) =>
        set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

      // ─── Active Exam ──────────────────────────────
      currentExam: null,

      startExam: (questions, mode, timePerQ) => {
        const shuffled = [...questions].sort(() => Math.random() - 0.5);
        set({
          currentExam: {
            id: `exam_${Date.now()}`,
            mode,
            questions: shuffled,
            current: 0,
            answers: {},
            marked: [],
            timeLeft: timePerQ > 0 ? timePerQ * shuffled.length : 0,
            timePerQuestion: timePerQ,
            startedAt: Date.now(),
            revealed: {},
            finished: false,
          },
        });
      },

      setAnswer: (qIndex, letters) =>
        set((s) => {
          if (!s.currentExam) return {};
          return {
            currentExam: {
              ...s.currentExam,
              answers: { ...s.currentExam.answers, [qIndex]: letters },
            },
          };
        }),

      toggleMark: (qIndex) =>
        set((s) => {
          if (!s.currentExam) return {};
          const marked = s.currentExam.marked.includes(qIndex)
            ? s.currentExam.marked.filter((i) => i !== qIndex)
            : [...s.currentExam.marked, qIndex];
          return { currentExam: { ...s.currentExam, marked } };
        }),

      setCurrentQ: (index) =>
        set((s) => {
          if (!s.currentExam) return {};
          return { currentExam: { ...s.currentExam, current: index } };
        }),

      revealAnswer: (qIndex) =>
        set((s) => {
          if (!s.currentExam) return {};
          return {
            currentExam: {
              ...s.currentExam,
              revealed: { ...s.currentExam.revealed, [qIndex]: true },
            },
          };
        }),

      finishExam: () => {
        const exam = get().currentExam;
        if (!exam) return null;

        let correct = 0;
        const topicMap: Record<string, { correct: number; total: number }> = {};

        exam.questions.forEach((q, i) => {
          const ans = exam.answers[i] || [];
          const isCorrect =
            q.correct.every((c) => ans.includes(c)) &&
            ans.every((a) => q.correct.includes(a));
          if (isCorrect) correct++;

          if (!topicMap[q.topic]) topicMap[q.topic] = { correct: 0, total: 0 };
          topicMap[q.topic].total++;
          if (isCorrect) topicMap[q.topic].correct++;
        });

        const score = Math.round((correct / exam.questions.length) * 100);
        const topicResults = Object.entries(topicMap).map(([topic, r]) => ({
          topic,
          correct: r.correct,
          total: r.total,
          score: Math.round((r.correct / r.total) * 100),
        }));

        const result: ExamResult = {
          examId: exam.id,
          score,
          correct,
          total: exam.questions.length,
          timeTaken: Math.round((Date.now() - exam.startedAt) / 1000),
          mode: exam.mode,
          topicResults,
          date: new Date().toLocaleDateString(),
          numQuestions: exam.questions.length,
        };

        set((s) => ({
          currentExam: { ...exam, finished: true, finishedAt: Date.now() },
          examHistory: [...s.examHistory, result],
        }));

        return result;
      },

      clearExam: () => set({ currentExam: null }),
    }),
    {
      name: "ccna-simulator-store",
      partialize: (state) => ({
        questions: state.questions,
        examHistory: state.examHistory,
        flashcards: state.flashcards,
        documents: state.documents,
        // Don't persist active exam or user (re-auth on load)
      }),
    }
  )
);

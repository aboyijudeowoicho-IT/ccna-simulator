import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";

// ─── Browser client (use in components/hooks) ────────────────
export const createBrowserClient = () =>
  createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  });

// ─── Server/admin client (use in API routes only) ────────────
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

// ─── Database types (mirrors Supabase schema) ─────────────────
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; email: string; name: string | null; created_at: string };
        Insert: { id: string; email: string; name?: string };
        Update: { name?: string };
      };
      documents: {
        Row: {
          id: string; user_id: string; name: string; size: number;
          chunks: number; status: string; storage_path: string; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["documents"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      questions: {
        Row: {
          id: string; user_id: string; document_id: string | null;
          type: string; topic: string; difficulty: string;
          question: string; code: string | null;
          options: string; correct: string; explanation: string;
          wrong_explanations: string | null; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["questions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["questions"]["Insert"]>;
      };
      flashcards: {
        Row: {
          id: string; user_id: string; document_id: string | null;
          front: string; back: string; topic: string; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["flashcards"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["flashcards"]["Insert"]>;
      };
      exam_results: {
        Row: {
          id: string; user_id: string; score: number; correct: number;
          total: number; mode: string; time_taken: number;
          topic_results: string; date: string; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["exam_results"]["Row"], "id" | "created_at">;
        Update: never;
      };
      document_chunks: {
        Row: {
          id: string; document_id: string; content: string;
          embedding: number[] | null; chunk_index: number; created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["document_chunks"]["Row"], "id" | "created_at">;
        Update: never;
      };
    };
  };
};

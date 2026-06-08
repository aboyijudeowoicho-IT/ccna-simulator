import { NextRequest, NextResponse } from "next/server";
import { generateQuestionsFromContext } from "@/lib/anthropic";
import { buildContext } from "@/lib/pdf";
import { createAdminClient } from "@/lib/supabase";
import { QuestionType, Difficulty } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type = "multiple-choice",
      topic = "any",
      difficulty = "mixed",
      count = 5,
      userId,
      contextOverride, // allow passing raw text directly
    } = body as {
      type: QuestionType;
      topic: string;
      difficulty: Difficulty | "mixed";
      count: number;
      userId?: string;
      contextOverride?: string;
    };

    let context = contextOverride || "";

    // If userId provided, retrieve their document chunks from Supabase
    if (!context && userId) {
      const supabase = createAdminClient();
      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("content")
        .eq("user_id", userId)
        .limit(30)
        .order("created_at", { ascending: false });

      if (chunks && chunks.length > 0) {
        context = buildContext(chunks.map((c) => c.content));
      }
    }

    if (!context || context.length < 100) {
      return NextResponse.json(
        { error: "No study material available. Please upload PDFs first." },
        { status: 400 }
      );
    }

    const questions = await generateQuestionsFromContext({
      context,
      type,
      topic,
      difficulty,
      count: Math.min(count, 15), // cap at 15 per request
    });

    // Optionally save to Supabase if userId provided
    if (userId && questions.length > 0) {
      const supabase = createAdminClient();
      await supabase.from("questions").insert(
        questions.map((q) => ({
          user_id: userId,
          type: q.type,
          topic: q.topic,
          difficulty: q.difficulty,
          question: q.question,
          code: q.code || null,
          options: JSON.stringify(q.options),
          correct: JSON.stringify(q.correct),
          explanation: q.explanation,
          wrong_explanations: q.wrongExplanations
            ? JSON.stringify(q.wrongExplanations)
            : null,
        }))
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Question generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const questions = (data || []).map((q) => ({
      id: q.id,
      type: q.type,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      code: q.code,
      options: JSON.parse(q.options),
      correct: JSON.parse(q.correct),
      explanation: q.explanation,
      wrongExplanations: q.wrong_explanations
        ? JSON.parse(q.wrong_explanations)
        : {},
      createdAt: q.created_at,
    }));

    return NextResponse.json({ questions });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

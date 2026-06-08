import { NextRequest, NextResponse } from "next/server";
import { generateFlashcardsFromContext } from "@/lib/anthropic";
import { buildContext } from "@/lib/pdf";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, contextOverride, count = 15 } = body as {
      userId?: string;
      contextOverride?: string;
      count?: number;
    };

    let context = contextOverride || "";

    if (!context && userId) {
      const supabase = createAdminClient();
      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("content")
        .eq("user_id", userId)
        .limit(20)
        .order("created_at", { ascending: false });

      if (chunks && chunks.length > 0) {
        context = buildContext(chunks.map((c) => c.content));
      }
    }

    if (!context || context.length < 100) {
      return NextResponse.json(
        { error: "No study material. Upload PDFs first." },
        { status: 400 }
      );
    }

    const cards = await generateFlashcardsFromContext(context, count);

    const flashcards = cards.map((c) => ({
      id: `fc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      ...c,
    }));

    // Save to Supabase if userId
    if (userId) {
      const supabase = createAdminClient();
      await supabase.from("flashcards").insert(
        flashcards.map((f) => ({
          id: f.id,
          user_id: userId,
          front: f.front,
          back: f.back,
          topic: f.topic,
        }))
      );
    }

    return NextResponse.json({ flashcards });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ flashcards: data });
}

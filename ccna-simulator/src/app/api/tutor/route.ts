import { NextRequest, NextResponse } from "next/server";
import { getTutorResponse } from "@/lib/anthropic";
import { buildContext } from "@/lib/pdf";
import { createAdminClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, history = [], userId, contextOverride } = body as {
      question: string;
      history: Array<{ role: "user" | "assistant"; content: string }>;
      userId?: string;
      contextOverride?: string;
    };

    if (!question?.trim()) {
      return NextResponse.json({ error: "question is required" }, { status: 400 });
    }

    let context = contextOverride || "";

    // Retrieve relevant chunks from Supabase if userId provided
    if (!context && userId) {
      const supabase = createAdminClient();
      const { data: chunks } = await supabase
        .from("document_chunks")
        .select("content")
        .eq("user_id", userId)
        .limit(15)
        .order("created_at", { ascending: false });

      if (chunks && chunks.length > 0) {
        context = buildContext(chunks.map((c) => c.content), 8000);
      }
    }

    const answer = await getTutorResponse({ question, context, history });

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("Tutor error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get response" },
      { status: 500 }
    );
  }
}

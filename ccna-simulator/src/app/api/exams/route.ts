import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { ExamResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { result, userId } = body as { result: ExamResult; userId: string };

    if (!userId || !result) {
      return NextResponse.json({ error: "userId and result required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase.from("exam_results").insert({
      user_id: userId,
      score: result.score,
      correct: result.correct,
      total: result.total,
      mode: result.mode,
      time_taken: result.timeTaken,
      topic_results: JSON.stringify(result.topicResults),
      date: result.date,
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save" },
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
    .from("exam_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = (data || []).map((r) => ({
    examId: r.id,
    score: r.score,
    correct: r.correct,
    total: r.total,
    mode: r.mode,
    timeTaken: r.time_taken,
    topicResults: JSON.parse(r.topic_results),
    date: r.date,
    numQuestions: r.total,
  }));

  return NextResponse.json({ results });
}

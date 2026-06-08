import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import {
  extractTextFromPDF,
  splitTextIntoChunks,
  generateEmbeddingsBatch,
} from "@/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "file and userId are required" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files accepted" }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 20MB)" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Upload PDF to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${userId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(storagePath, buffer, { contentType: "application/pdf" });

    if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

    // 2. Create document record
    const { data: docRecord, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        name: file.name,
        size: file.size,
        chunks: 0,
        status: "processing",
        storage_path: storagePath,
      })
      .select()
      .single();

    if (docError) throw new Error(`DB insert failed: ${docError.message}`);

    // 3. Extract text from PDF
    const text = await extractTextFromPDF(buffer);

    // 4. Split into chunks
    const chunks = await splitTextIntoChunks(text);

    // 5. Generate embeddings (uses OpenAI text-embedding-3-small)
    let embeddings: number[][] = [];
    if (process.env.OPENAI_API_KEY) {
      embeddings = await generateEmbeddingsBatch(chunks);
    }

    // 6. Store chunks in pgvector table
    const chunkRows = chunks.map((content, i) => ({
      document_id: docRecord.id,
      user_id: userId,
      content,
      chunk_index: i,
      embedding: embeddings[i] ? JSON.stringify(embeddings[i]) : null,
    }));

    // Insert in batches of 50
    for (let i = 0; i < chunkRows.length; i += 50) {
      await supabase.from("document_chunks").insert(chunkRows.slice(i, i + 50));
    }

    // 7. Update document status
    await supabase
      .from("documents")
      .update({ status: "ready", chunks: chunks.length })
      .eq("id", docRecord.id);

    return NextResponse.json({
      documentId: docRecord.id,
      name: file.name,
      chunks: chunks.length,
      status: "ready",
      previewText: text.slice(0, 500),
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
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
    .from("documents")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ documents: data });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("id");
  const userId = searchParams.get("userId");

  if (!documentId || !userId) {
    return NextResponse.json({ error: "id and userId required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Delete chunks
  await supabase.from("document_chunks").delete().eq("document_id", documentId);

  // Delete document record (also gets storage path)
  const { data } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("user_id", userId)
    .select()
    .single();

  // Delete from storage
  if (data?.storage_path) {
    await supabase.storage.from("documents").remove([data.storage_path]);
  }

  return NextResponse.json({ success: true });
}

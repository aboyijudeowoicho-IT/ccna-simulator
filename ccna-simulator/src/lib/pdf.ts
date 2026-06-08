import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Extract text from PDF buffer ────────────────────────────
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Dynamic import to avoid SSR issues
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return data.text;
}

// ─── Split text into chunks ───────────────────────────────────
export async function splitTextIntoChunks(text: string): Promise<string[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 150,
    separators: ["\n\n", "\n", ". ", " ", ""],
  });

  const docs = await splitter.createDocuments([text]);
  return docs.map((doc) => doc.pageContent.trim()).filter((c) => c.length > 50);
}

// ─── Generate embedding for a single chunk ───────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return response.data[0].embedding;
}

// ─── Generate embeddings in batches ──────────────────────────
export async function generateEmbeddingsBatch(
  texts: string[],
  batchSize = 20
): Promise<number[][]> {
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: batch.map((t) => t.slice(0, 8000)),
    });
    results.push(...response.data.map((d) => d.embedding));

    // Rate limit buffer
    if (i + batchSize < texts.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return results;
}

// ─── Retrieve top-k relevant chunks via cosine similarity ────
export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

export function retrieveTopChunks(
  queryEmbedding: number[],
  chunks: Array<{ content: string; embedding: number[] }>,
  topK = 5
): string[] {
  const scored = chunks.map((chunk) => ({
    content: chunk.content,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((c) => c.content);
}

// ─── Build RAG context string ─────────────────────────────────
export function buildContext(chunks: string[], maxChars = 12000): string {
  let context = "";
  for (const chunk of chunks) {
    if (context.length + chunk.length > maxChars) break;
    context += chunk + "\n\n";
  }
  return context.trim();
}

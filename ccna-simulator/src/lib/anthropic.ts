import Anthropic from "@anthropic-ai/sdk";
import { Question, QuestionType, Difficulty } from "@/types";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const MODEL = "claude-sonnet-4-20250514";

// ─── Generate questions from PDF context ─────────────────────
export async function generateQuestionsFromContext(params: {
  context: string;
  type: QuestionType;
  topic: string;
  difficulty: Difficulty | "mixed";
  count: number;
}): Promise<Question[]> {
  const { context, type, topic, difficulty, count } = params;

  const typeInstructions: Record<string, string> = {
    "multiple-choice": "Single correct answer from 4 options (A-D)",
    "choose-two": "Exactly 2 correct answers from 4 options. Set correct to ['A','C'] style array",
    "troubleshooting": "Network problem scenario, ask what is wrong or what command to run",
    "subnetting": "Include actual IP addresses, CIDR notation, subnet calculations with numbers",
    "command": "Show router/switch CLI output in the 'code' field and ask to interpret it",
  };

  const prompt = `You are a Cisco CCNA 200-301 exam question generator. Generate exactly ${count} realistic exam question${count > 1 ? "s" : ""} based ONLY on the provided study material. Do NOT hallucinate or use outside knowledge beyond clarifying CCNA concepts found in the material.

<study_material>
${context}
</study_material>

Requirements:
- Question type: ${type} — ${typeInstructions[type] || ""}
- Topic: ${topic === "any" ? "any CCNA topic found in the material" : topic}
- Difficulty: ${difficulty}
- Style: Realistic Cisco CCNA 200-301 exam format (precise, unambiguous, professional)
- Each question MUST have exactly 4 options (A, B, C, D)
- Explanations must reference concepts from the study material
- wrongExplanations: explain why EACH incorrect option is wrong

Return ONLY a valid JSON array with NO markdown, NO explanation, NO preamble:
[
  {
    "id": "placeholder",
    "type": "${type}",
    "topic": "exact topic name",
    "difficulty": "${difficulty === "mixed" ? "easy|medium|hard (pick one per question)" : difficulty}",
    "question": "Question text ending with ?",
    "code": "CLI output here if type=command, else empty string",
    "options": [
      {"letter": "A", "text": "First option"},
      {"letter": "B", "text": "Second option"},
      {"letter": "C", "text": "Third option"},
      {"letter": "D", "text": "Fourth option"}
    ],
    "correct": ["A"],
    "explanation": "Detailed explanation of why the correct answer is right, referencing study material",
    "wrongExplanations": {
      "B": "Why B is wrong",
      "C": "Why C is wrong",
      "D": "Why D is wrong"
    }
  }
]`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const cleaned = raw.replace(/```json|```/g, "").trim();
  const parsed: Question[] = JSON.parse(cleaned);

  return parsed.map((q) => ({
    ...q,
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }));
}

// ─── Generate flashcards from context ────────────────────────
export async function generateFlashcardsFromContext(
  context: string,
  count = 15
): Promise<{ front: string; back: string; topic: string }[]> {
  const prompt = `Generate ${count} CCNA study flashcards from this material. Cover key concepts, commands, protocols, and facts.

<material>
${context}
</material>

Return ONLY valid JSON array, no markdown:
[{"front":"Question or concept","back":"Detailed answer with any key facts","topic":"Topic name"}]`;

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

// ─── AI Tutor response ────────────────────────────────────────
export async function getTutorResponse(params: {
  question: string;
  context: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
  const { question, context, history } = params;

  const system = `You are an expert CCNA 200-301 tutor. Answer questions clearly, accurately, and educationally.
${context ? `\nUse this study material as your primary reference:\n<material>\n${context}\n</material>` : ""}

Guidelines:
- For subnetting: always show step-by-step calculations
- For CLI commands: format them in code blocks using backtick notation
- For protocols: explain how they work, not just what they are
- Be concise but thorough — aim for 150-300 words unless more detail is needed
- If the question isn't in the study material, still answer from your CCNA knowledge but note it
- Always end with a practical tip or memory aid when helpful`;

  const messages = [
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user" as const, content: question },
  ];

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages,
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
}

"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Question, QuestionType, Difficulty } from "@/types";
import { Button, Card, Badge, InfoBox, Section } from "@/components/ui";
import { DEMO_CCNA_CONTENT, generateId, getDifficultyColor } from "@/lib/utils";
import toast from "react-hot-toast";
import { Sparkles, Trash2, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function GeneratePage() {
  const router = useRouter();
  const { questions, addQuestions, clearQuestions, documents } = useStore();
  const [type, setType] = useState<QuestionType>("multiple-choice");
  const [topic, setTopic] = useState("any");
  const [difficulty, setDifficulty] = useState<Difficulty | "mixed">("mixed");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<Question[]>([]);

  const hasContent = documents.length > 0;

  async function handleGenerate() {
    setLoading(true);
    setGenerated([]);
    try {
      // Use demo content if no PDFs uploaded
      const contextOverride = !hasContent ? DEMO_CCNA_CONTENT : undefined;

      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, topic, difficulty, count, contextOverride }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const { questions: newQs } = await res.json();
      addQuestions(newQs);
      setGenerated(newQs);
      toast.success(`Generated ${newQs.length} questions!`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  const typeMap: Record<string, string> = {
    "multiple-choice": "Multiple Choice",
    "choose-two": "Choose Two",
    "troubleshooting": "Troubleshooting",
    "subnetting": "Subnetting",
    "command": "Command Output",
  };

  return (
    <div>
      <Section
        title="Generate Questions"
        sub="AI creates realistic CCNA exam questions from your study materials"
        action={
          questions.length > 0 ? (
            <button onClick={() => { clearQuestions(); toast.success("Cleared"); }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              <Trash2 size={13} /> Clear All ({questions.length})
            </button>
          ) : undefined
        }
      />

      {!hasContent && (
        <InfoBox className="mb-5">
          <strong>No PDFs uploaded.</strong> Using built-in CCNA demo content. For personalized questions based on your materials,{" "}
          <button onClick={() => router.push("/upload")} className="underline text-brand-blue">upload PDFs</button> first.
        </InfoBox>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Settings card */}
        <Card className="lg:col-span-1">
          <div className="text-sm font-semibold mb-4">Generation Settings</div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Question Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-blue-dark"
              >
                {Object.entries(typeMap).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Topic Focus</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-blue-dark"
              >
                <option value="any">Any Topic</option>
                <option value="IP Addressing & Subnetting">IP Addressing & Subnetting</option>
                <option value="Routing Protocols">Routing Protocols (OSPF/EIGRP)</option>
                <option value="Switching & VLANs">Switching & VLANs</option>
                <option value="WAN Technologies">WAN Technologies</option>
                <option value="Network Security">Network Security & ACLs</option>
                <option value="Network Services">Network Services (DHCP/DNS/NAT)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty | "mixed")}
                className="w-full bg-bg-tertiary border border-border-primary rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-brand-blue-dark"
              >
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Count: <span className="text-brand-blue font-mono">{count}</span></label>
              <input
                type="range" min={1} max={15} value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-brand-blue-dark"
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>1</span><span>5</span><span>10</span><span>15</span>
              </div>
            </div>

            <Button onClick={handleGenerate} loading={loading} className="w-full">
              <Sparkles size={15} />
              {loading ? "Generating..." : "Generate with Claude AI"}
            </Button>

            {questions.length > 0 && (
              <Button variant="success" className="w-full" onClick={() => router.push("/exam")}>
                <PlayCircle size={15} />
                Start Exam ({questions.length}Q)
              </Button>
            )}
          </div>
        </Card>

        {/* Output */}
        <div className="lg:col-span-2 space-y-4">
          {loading && (
            <Card className="text-center py-10">
              <div className="inline-block w-8 h-8 border-2 border-border-primary border-t-brand-blue rounded-full animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Claude is generating {count} {typeMap[type]} questions...</p>
            </Card>
          )}

          {generated.map((q) => (
            <Card key={q.id}>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant="blue">{typeMap[q.type]}</Badge>
                <Badge variant="purple">{q.topic}</Badge>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${getDifficultyColor(q.difficulty)}`}>
                  {q.difficulty}
                </span>
              </div>
              <p className="text-sm leading-relaxed mb-3">{q.question}</p>
              {q.code && (
                <pre className="text-xs mb-3 text-sm">{q.code}</pre>
              )}
              <div className="space-y-1.5">
                {q.options.map((o) => (
                  <div
                    key={o.letter}
                    className={`text-xs px-3 py-2 rounded-lg border ${
                      q.correct.includes(o.letter)
                        ? "border-brand-green bg-green-500/8 text-brand-green"
                        : "border-border-primary bg-bg-tertiary text-gray-400"
                    }`}
                  >
                    <strong>{o.letter}.</strong> {o.text} {q.correct.includes(o.letter) && "✓"}
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-gray-400 bg-bg-tertiary rounded-lg p-3 border-l-2 border-brand-blue-dark">
                <span className="text-brand-blue font-semibold">Explanation: </span>
                {q.explanation}
              </div>
            </Card>
          ))}

          {!loading && generated.length === 0 && questions.length > 0 && (
            <Card>
              <div className="text-sm font-semibold mb-3">Question Bank ({questions.length} total)</div>
              <div className="flex flex-wrap gap-2 mb-4">
                {["multiple-choice", "choose-two", "troubleshooting", "subnetting", "command"].map((t) => {
                  const c = questions.filter((q) => q.type === t).length;
                  return c > 0 ? <Badge key={t} variant="blue">{typeMap[t]}: {c}</Badge> : null;
                })}
              </div>
              <Button variant="success" className="w-full" onClick={() => router.push("/exam")}>
                <PlayCircle size={15} /> Start Exam with These Questions
              </Button>
            </Card>
          )}

          {!loading && generated.length === 0 && questions.length === 0 && (
            <Card className="text-center py-12">
              <div className="text-4xl mb-3">🤖</div>
              <p className="text-gray-300 font-medium mb-1">Ready to generate</p>
              <p className="text-gray-500 text-sm">Configure settings and click "Generate with Claude AI"</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

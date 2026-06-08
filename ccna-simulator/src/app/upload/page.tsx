"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useStore } from "@/lib/store";
import { Button, Card, Badge, Section, InfoBox } from "@/components/ui";
import { formatFileSize, DEMO_CCNA_CONTENT, generateId } from "@/lib/utils";
import { UploadedDocument } from "@/types";
import toast from "react-hot-toast";
import { FileText, Trash2, Upload, CheckCircle, XCircle, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const { documents, addDocument, updateDocument, removeDocument } = useStore();
  const [uploading, setUploading] = useState<string[]>([]);

  const onDrop = useCallback(async (accepted: File[]) => {
    for (const file of accepted) {
      const docId = generateId("doc");
      const doc: UploadedDocument = {
        id: docId,
        name: file.name,
        size: file.size,
        chunks: 0,
        status: "uploading",
        uploadedAt: new Date().toISOString(),
      };
      addDocument(doc);
      setUploading((u) => [...u, docId]);

      try {
        // Read file as text (client-side extraction for demo)
        // In production this posts to /api/upload which handles Supabase storage + LangChain
        const text = await readFileText(file);
        const chunks = Math.ceil(text.length / 1000);

        // Try server-side upload first
        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("userId", "local-user");

          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (res.ok) {
            const data = await res.json();
            updateDocument(docId, { status: "ready", chunks: data.chunks });
            toast.success(`${file.name} processed — ${data.chunks} chunks`);
          } else {
            // Fallback: store locally
            updateDocument(docId, {
              status: "ready",
              chunks,
              storagePath: "local:" + docId,
            });
            // Store text in sessionStorage for AI use
            try { sessionStorage.setItem(`doc_${docId}`, text.slice(0, 50000)); } catch {}
            toast.success(`${file.name} loaded — ${chunks} chunks (local mode)`);
          }
        } catch {
          updateDocument(docId, { status: "ready", chunks, storagePath: "local:" + docId });
          try { sessionStorage.setItem(`doc_${docId}`, text.slice(0, 50000)); } catch {}
          toast.success(`${file.name} loaded (local mode)`);
        }
      } catch (e) {
        updateDocument(docId, { status: "error" });
        toast.error(`Failed to process ${file.name}`);
      } finally {
        setUploading((u) => u.filter((id) => id !== docId));
      }
    }
  }, [addDocument, updateDocument]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"], "text/plain": [".txt"] },
    maxSize: 20 * 1024 * 1024,
  });

  async function readFileText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.onerror = reject;
      if (file.type === "application/pdf") {
        // For PDFs, read as text (browser PDF parsing is limited)
        // Server API will handle proper PDF extraction
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  function loadDemo() {
    const docId = generateId("doc");
    const doc: UploadedDocument = {
      id: docId,
      name: "CCNA 200-301 Demo Study Guide",
      size: DEMO_CCNA_CONTENT.length,
      chunks: Math.ceil(DEMO_CCNA_CONTENT.length / 1000),
      status: "ready",
      uploadedAt: new Date().toISOString(),
      storagePath: "demo:" + docId,
    };
    addDocument(doc);
    try { sessionStorage.setItem(`doc_${docId}`, DEMO_CCNA_CONTENT); } catch {}
    toast.success("Demo CCNA content loaded!");
  }

  const statusIcon = (status: string) => {
    if (status === "ready") return <CheckCircle size={16} className="text-brand-green" />;
    if (status === "error") return <XCircle size={16} className="text-brand-red" />;
    return <Loader size={16} className="text-brand-blue animate-spin" />;
  };

  return (
    <div>
      <Section title="PDF Upload" sub="Upload CCNA study materials to power AI question generation" />

      <InfoBox className="mb-6">
        <strong>How it works:</strong> Upload your CCNA PDFs → Text is extracted and chunked into segments →
        Claude generates exam questions and flashcards <em>only</em> from your material (no hallucinations).
        In production, chunks are stored in Supabase pgvector for semantic search.
      </InfoBox>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all mb-6",
          isDragActive
            ? "border-brand-blue bg-blue-500/5"
            : "border-border-secondary hover:border-brand-blue-dark hover:bg-bg-secondary"
        )}
      >
        <input {...getInputProps()} />
        <Upload size={40} className="mx-auto mb-4 text-gray-600" />
        <p className="text-base font-medium mb-2">
          {isDragActive ? "Drop your PDFs here…" : "Drag & drop CCNA PDFs here"}
        </p>
        <p className="text-sm text-gray-500">or click to browse — PDF or TXT, up to 20MB each</p>
      </div>

      {/* File list */}
      {documents.length > 0 && (
        <Card className="mb-6">
          <div className="text-sm font-semibold mb-4">Uploaded Documents ({documents.length})</div>
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 bg-bg-tertiary rounded-xl px-4 py-3 border border-border-primary"
              >
                <FileText size={20} className="text-red-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{doc.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {formatFileSize(doc.size)} · {doc.chunks} chunks
                  </div>
                  {doc.status === "uploading" || doc.status === "processing" ? (
                    <div className="mt-1.5 bg-bg-quaternary rounded-full h-1 overflow-hidden w-full">
                      <div className="h-full bg-brand-blue rounded-full w-1/2 animate-pulse" />
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(doc.status)}
                  <Badge variant={doc.status === "ready" ? "green" : doc.status === "error" ? "red" : "blue"}>
                    {doc.status}
                  </Badge>
                  <button
                    onClick={() => { removeDocument(doc.id); try { sessionStorage.removeItem(`doc_${doc.id}`); } catch {} }}
                    className="text-gray-600 hover:text-red-400 transition-colors ml-2"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Demo content */}
      <div className="border-t border-border-primary pt-6">
        <p className="text-sm text-gray-400 mb-3">No PDFs? Start with built-in demo content:</p>
        <Button variant="secondary" onClick={loadDemo}>
          📚 Load Demo CCNA Content
        </Button>
      </div>

      {/* Architecture note */}
      <div className="mt-8">
        <Card>
          <div className="text-sm font-semibold mb-3">Production Architecture</div>
          <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
            <div className="flex gap-2">
              <span className="text-brand-blue font-mono">1.</span>
              <span>PDF uploaded → stored in <strong className="text-gray-300">Supabase Storage</strong> bucket</span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-blue font-mono">2.</span>
              <span>Text extracted via <strong className="text-gray-300">LangChain PDF parser</strong> → split into 1000-char chunks</span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-blue font-mono">3.</span>
              <span>Each chunk embedded via <strong className="text-gray-300">OpenAI text-embedding-3-small</strong></span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-blue font-mono">4.</span>
              <span>Embeddings stored in <strong className="text-gray-300">Supabase pgvector</strong> table</span>
            </div>
            <div className="flex gap-2">
              <span className="text-brand-blue font-mono">5.</span>
              <span>Question generation uses <strong className="text-gray-300">RAG</strong> — top-k chunks retrieved per query</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

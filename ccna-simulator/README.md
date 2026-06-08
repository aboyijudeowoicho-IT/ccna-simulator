# CCNA Exam Simulator

An AI-powered CCNA 200-301 exam preparation platform built with Next.js 14, Claude AI, Supabase, and LangChain. Generates realistic exam questions from your own study materials using RAG (Retrieval-Augmented Generation).

---

## Features

- **AI Question Generation** — Claude creates realistic CCNA questions from uploaded PDFs only (no hallucinations)
- **5 Question Types** — Multiple choice, choose-two, troubleshooting, subnetting, command interpretation
- **Exam Engine** — Timed exams, question palette, mark-for-review, practice mode with instant feedback
- **AI Tutor** — Chat interface powered by Claude, answers from your study materials
- **Flashcards** — Auto-generated from uploaded PDFs
- **Analytics** — Score history, topic mastery, readiness score, weak topic tracking
- **PDF Upload** — Drag-and-drop, chunked with LangChain, stored in Supabase pgvector
- **Auth** — Supabase email/password auth, or local browser mode (no account needed)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, custom dark theme |
| AI | Anthropic Claude (claude-sonnet-4) |
| Embeddings | OpenAI text-embedding-3-small |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase PostgreSQL + pgvector |
| Storage | Supabase Storage |
| Auth | Supabase Auth |
| PDF Processing | LangChain + pdf-parse |
| State | Zustand (persisted to localStorage) |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/yourusername/ccna-simulator.git
cd ccna-simulator
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all values (see below for how to get them).

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Copy your **service role key** from Settings → API (keep this secret!)
4. Go to **SQL Editor** → New Query → paste contents of `supabase/schema.sql` → Run
5. Verify tables were created in Table Editor

### 4. Get API keys

**Anthropic (required for AI features):**
- Go to [console.anthropic.com](https://console.anthropic.com)
- API Keys → Create Key
- Add to `.env.local` as `ANTHROPIC_API_KEY`

**OpenAI (required for PDF embeddings):**
- Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- Create new secret key
- Add to `.env.local` as `OPENAI_API_KEY`
- Note: Only used for `text-embedding-3-small` (very cheap — ~$0.02 per 1M tokens)

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** You can use the app without an account in local mode. Data is saved to localStorage. Upload functionality falls back to browser-side processing when Supabase isn't configured.

---

## Deployment to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ccna-simulator)

### Manual deploy

```bash
npm install -g vercel
vercel login
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add OPENAI_API_KEY

# Deploy to production
vercel --prod
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-only, never expose) |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for question generation and tutoring |
| `OPENAI_API_KEY` | Yes | OpenAI key for PDF chunk embeddings |
| `NEXT_PUBLIC_APP_URL` | No | Your app URL (default: http://localhost:3000) |

---

## How It Works

### PDF Processing Pipeline

```
User uploads PDF
    ↓
POST /api/upload
    ↓
pdf-parse extracts text
    ↓
LangChain RecursiveCharacterTextSplitter
    → chunks of ~1000 chars with 150 overlap
    ↓
OpenAI text-embedding-3-small
    → 1536-dimensional vector per chunk
    ↓
Supabase pgvector
    → stored in document_chunks table
    ↓
Ready for RAG queries
```

### Question Generation (RAG)

```
User selects type/topic/difficulty
    ↓
POST /api/questions
    ↓
Retrieve top-k relevant chunks from pgvector
    ↓
Build context string from chunks
    ↓
Claude generates questions using ONLY that context
    ↓
Questions saved to Supabase questions table
    ↓
Returned to frontend + added to question bank
```

### Exam Engine Flow

```
User configures exam (mode/count/topic/time)
    ↓
Questions shuffled from bank
    ↓
Zustand state: answers, marked, timer, revealed
    ↓
Timer ticks down (auto-submit at 0)
    ↓
Submit → score computed → saved to exam_results
    ↓
Score screen → Review mode → Analytics updated
```

---

## Folder Structure

```
src/
├── app/
│   ├── api/
│   │   ├── questions/route.ts    # Generate + fetch questions
│   │   ├── upload/route.ts       # PDF upload + chunking + embeddings
│   │   ├── tutor/route.ts        # AI tutor chat
│   │   ├── flashcards/route.ts   # Generate + fetch flashcards
│   │   └── exams/route.ts        # Save + fetch exam results
│   ├── dashboard/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── generate/page.tsx     # Question generation UI
│   │   └── layout.tsx
│   ├── exam/
│   │   ├── page.tsx              # Exam setup + active exam engine
│   │   ├── score/page.tsx        # Score screen
│   │   └── review/page.tsx       # Answer review
│   ├── flashcards/page.tsx       # Flashcard viewer
│   ├── tutor/page.tsx            # AI tutor chat
│   ├── upload/page.tsx           # PDF upload UI
│   ├── analytics/page.tsx        # Performance charts
│   ├── login/page.tsx            # Auth page
│   ├── layout.tsx                # Root layout + fonts
│   └── globals.css               # Global styles
├── components/
│   └── ui/
│       ├── index.tsx             # Shared UI primitives
│       ├── Navbar.tsx            # Top navigation
│       └── Sidebar.tsx           # Side navigation
├── lib/
│   ├── anthropic.ts              # Claude AI helpers
│   ├── pdf.ts                    # PDF processing + embeddings
│   ├── supabase.ts               # Supabase clients + types
│   ├── store.ts                  # Zustand global state
│   ├── analytics.ts              # Analytics computation
│   └── utils.ts                  # Utilities + demo content
└── types/
    └── index.ts                  # All TypeScript types

supabase/
└── schema.sql                    # Complete DB schema + RLS policies
```

---

## Local Mode (No Account)

The app works fully without Supabase by storing everything in `localStorage`:
- Questions, flashcards, exam history → persisted via Zustand
- PDF text → stored in `sessionStorage` per session
- API routes fall back gracefully when Supabase isn't configured

You still need `ANTHROPIC_API_KEY` for AI features.

---

## Cost Estimates

| Service | Usage | Estimated Cost |
|---------|-------|---------------|
| Claude claude-sonnet-4 | ~5Q generation = 1k tokens in/out | ~$0.003 per generation |
| OpenAI embeddings | 1 PDF (~50 chunks) | ~$0.0001 |
| Supabase Free Tier | Up to 500MB DB, 1GB storage | Free |
| Vercel Free Tier | 100GB bandwidth, serverless functions | Free |

Typical monthly cost for personal use: **< $1**

---

## CCNA Topics Covered

- Network Fundamentals (OSI/TCP-IP models)
- IP Addressing and Subnetting (VLSM, CIDR)
- Routing Protocols (OSPF, EIGRP, static routes)
- Switching (VLANs, STP, trunking, EtherChannel)
- WAN Technologies (PPP, Frame Relay, MPLS, SD-WAN)
- Network Security (ACLs, port security, AAA, RADIUS/TACACS+)
- Network Services (DHCP, DNS, NAT/PAT, NTP, SNMP, Syslog)
- Infrastructure Management (CDP, LLDP, IOS commands)

---

## License

MIT — for personal educational use. Not affiliated with Cisco or Boson.

# Agento — Complete System Architecture & Technical Reference

> **Product:** Agento (v0.3 — Research Suite update)
> **Stack:** Next.js 16 · React 19 · TypeScript 5 · MongoDB · Ollama / Groq · Monaco Editor · File System Access API
> **Purpose:** Multi-tenant enterprise AI platform — document RAG, structured data analytics, voice, embeddable guest links, and a full Research Suite (Notebook LLM, Human Writer, AI Research Papers, VS Code-style code editor).

This document covers architecture, features, APIs, data models, methodology, design patterns, and end-to-end workflows for the entire platform.

---

## Table of Contents

0. [Understanding the Project (Plain Language)](#0-understanding-the-project-plain-language)
1. [Executive Overview](#1-executive-overview)
2. [Tech Stack](#2-tech-stack)
3. [High-Level Architecture](#3-high-level-architecture)
4. [Directory Structure](#4-directory-structure)
5. [Features & User Journeys](#5-features--user-journeys)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Data Models](#7-data-models)
8. [API Catalog](#8-api-catalog)
9. [RAG Pipeline (Documents → Chat/Voice)](#9-rag-pipeline-documents--chatvoice)
10. [Query Genius (NL → MongoDB)](#10-query-genius-nl--mongodb)
11. [Voice Mode Architecture](#11-voice-mode-architecture)
12. [Guest / Public Link Architecture](#12-guest--public-link-architecture)
13. [Research Suite Architecture](#13-research-suite-architecture)
14. [LLM & Embedding Fallback Chain](#14-llm--embedding-fallback-chain)
15. [Rate Limiting & Subscriptions](#15-rate-limiting--subscriptions)
16. [Email Flows](#16-email-flows)
17. [Environment & External Connections](#17-environment--external-connections)
18. [Methodology & Design Patterns](#18-methodology--design-patterns)
19. [End-to-End Workflow Diagrams](#19-end-to-end-workflow-diagrams)
20. [Known Caveats / Trade-offs](#20-known-caveats--trade-offs)

---

## 0. Understanding the Project (Plain Language)

### What problem does Agento solve?

Companies have knowledge locked in PDFs, HR policies, SOPs, and spreadsheets. Employees waste time searching for the same answers. Business users who are not database experts want charts and analytical insights from their data. Researchers need tools to write, cite, and generate structured papers. Developers want to explore codebases with an AI that actually understands the code. Agento attacks all of these problems from one authenticated dashboard.

### Three mental models

**1. Two AI brains over data:**
- **Unstructured knowledge** → RAG over `vector_store` chunks (similarity search + grounded generation)
- **Structured data** → LLM generates MongoDB aggregation pipelines against `qg_*` collections (query planning + real execution)

**2. One Research Suite with four specialized tools:**
- **Notebook LLM** — per-notebook persistent RAG chat over any documents you upload
- **Human Writer** — a ghostwriter chatbot that permanently learns your writing style
- **AI Research Summary** — multi-agent paper generator with photon animation + 5 export formats
- **AI Coding Assistant** — a full VS Code-style local code editor with Monaco + File System Access API

**3. One shared infrastructure layer:**
Auth, tenancy, LLM fallback, embedding pipeline, rate limiting, and email all serve every feature. Features don't reinvent the wheel — they call `callLLM()`, `getEmbedding()`, `connectDB()`, and `checkAndIncrementAILimit()`.

### Who uses it

- **Admin** — uploads documents, verifies employees, manages the public guest link, approves subscriptions
- **Employee** — uses chat, voice, Query Genius, and Research Suite after email + admin verification
- **Guest** — opens a tokenized link (or iframe) with only the features the admin exposed; no account needed

### Mental checklist for any feature

When reading any diagram: Who is the actor? Which identity path (session cookie or `x-guest-token`)? Which AI brain (RAG, NL→Mongo, Research Suite)? Where is truth stored? Where does the model help vs execute real data? What must never leak across tenants?

---

## 1. Executive Overview

Agento is a **company-scoped (multi-tenant) AI platform**. Many companies share one deployment, but each company's documents, sessions, Query Genius collections, and guest links are isolated by `company_id`.

At a capability level:

| Capability | What it does |
|---|---|
| **AI Chat + Voice** | RAG over uploaded company documents; voice uses browser STT/TTS |
| **Document Ingest** | PDF/TXT/CSV/MD/JSON → chunk → embed → `vector_store` |
| **Query Genius** | NL CRUD + 4-mode analytics + LookUp charts over company CSV data |
| **Public Guest Link** | Embeddable iframe chat/voice for external users (no login) |
| **Notebook LLM** | Per-notebook persistent RAG chat with own document set |
| **Human Writer** | Style-learning ghostwriter chatbot with persistent global writing profile |
| **AI Research Summary** | 4-node multi-agent paper generator with 5 export formats and photon animation |
| **AI Coding Assistant** | Browser-native local VS Code editor with Monaco + File System Access API |

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.1 |
| UI | React | 19.2.3 |
| Language | TypeScript | ^5 |
| Styling | Tailwind CSS | ^4 |
| Animation (CSS) | tw-animate-css | ^1.4.0 |
| Animation (complex) | Framer Motion | ^12.25.0 |
| Auth | NextAuth (Credentials + JWT) | ^4.24.13 |
| Database | MongoDB via Mongoose | ^9.1.2 |
| Local LLM | Ollama `/api/generate` | any model |
| Cloud LLM | Groq `llama-3.3-70b-versatile` | via API |
| Local Embeddings | Ollama `nomic-embed-text` (768-dim) | via API |
| Cloud Embeddings | HuggingFace `all-MiniLM-L6-v2` (384-dim) | ^4.13.15 |
| Code Editor | Monaco Editor `@monaco-editor/react` | ^4.7.0 |
| File System | Browser File System Access API | native (Chrome/Edge 86+) |
| Word Export | docx | ^9.7.1 |
| Charts | Recharts | ^3.8.0 |
| PDF Parsing | unpdf | ^1.4.0 |
| Flowcharts | Mermaid.js | ^11.12.2 |
| Icons | Lucide React | ^0.562.0 |
| Email | Nodemailer + Gmail SMTP | ^7.0.12 |
| UI Primitives | Radix UI (Label, Slot) | ^2.x |
| Class utilities | clsx + tailwind-merge + class-variance-authority | latest |
| Password hashing | bcryptjs | ^3.0.3 |

**Not used (important for interviews):** LangChain, LlamaIndex, OpenAI SDK, Stripe webhooks, WebRTC audio server, dedicated vector DB (Pinecone/Weaviate).

---

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENTS                                        │
│  Browser (employees)  │  Admin panel  │  Guest iframe  │  Research Suite pages  │
│  Web Speech STT/TTS   │  Recharts     │  x-guest-token │  Monaco + FS Access API │
└──────────────────────────┬───────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP ROUTER  (BFF)                                   │
│                                                                                  │
│  Pages (CSR + useSession)          │   Route Handlers /api/*                     │
│  /dashboard /chat-voice            │   Auth · Chat · Docs · QG                   │
│  /query-genius /admin /guest       │   Research (notebook/human-writer/           │
│  /research/notebook/[id]           │     ai-research/coding/sessions)             │
│  /research/human-writer            │   JWT session OR guest token                 │
│  /research/ai-research             │                                              │
│  /research/coding                  │                                              │
└──────────┬────────────────┬────────┴──────────────┬───────────────────────────────┘
           │                │                        │
  ┌────────┴──────┐ ┌───────┴────────┐    ┌──────────┴────────────┐
  ▼               ▼ ▼                ▼    ▼                        ▼
┌──────────┐ ┌─────────┐ ┌────────────┐ ┌────────────┐  ┌──────────────────────┐
│ MongoDB  │ │ Ollama  │ │    Groq    │ │ HuggingFace│  │  Browser (FS Access) │
│ Agento   │ │LLM+Embed│ │LLM fallback│ │Embed fallbk│  │  Local disk R/W      │
│ + Admin  │ └─────────┘ └────────────┘ └────────────┘  └──────────────────────┘
└──────────┘
  │
  ├── users, documents, vector_store, chat_sessions, public_links
  ├── notebook_sessions, hw_sessions, writing_profiles, research_sessions
  ├── qg_{companyId}_*  (Query Genius data collections)
  └── AgentoAdmin.subscription_requests
```

### Key architectural principles

1. **Single deployable, multiple AI paths.** Chat/voice RAG, Query Genius NL→Mongo, Notebook RAG, Human Writer style-chat, Research paper generation, and Code editing all live in one Next.js app but use different methodologies.
2. **Tenancy is the spine.** Every significant query is scoped by `company_id`. Break tenancy and the product is unsafe regardless of LLM quality.
3. **APIs are the control plane.** Rate limits, auth, embedding calls, and Mongo writes happen in route handlers. React pages are orchestration and UX only.
4. **LLM access is centralized.** All features call `callLLM()` / `getEmbedding()` from `lib/llm.ts`. Providers are swappable without touching feature code.
5. **File System API = zero server copies.** The Coding Assistant never uploads code to the server. Files live on the user's local disk; the browser reads/writes via `FileSystemDirectoryHandle`. Only the AI chat payload (selected file content) crosses the network.
6. **Degradation by design.** Ollama→Groq, vectors→regex, AI LookUp→manual LookUp — fallbacks are intentional, not accidental.

---

## 4. Directory Structure

```
The-Agento/
├── app/
│   ├── api/
│   │   ├── auth/                    # NextAuth, signup, email, admin, public-link, usage
│   │   ├── chat/                    # RAG chat + session CRUD (+ guest support)
│   │   ├── documents/               # Upload + embedding pipeline + debug
│   │   ├── guest/                   # Token validate
│   │   ├── query-genius/            # Collections, schema, query, upload, analytics, lookup
│   │   └── research/
│   │       ├── notebook/
│   │       │   ├── chat/            # In-memory RAG chat for notebook sessions
│   │       │   ├── upload/          # Document upload → embed → in-memory store
│   │       │   └── sessions/        # NotebookSession CRUD (GET/POST/PATCH/DELETE)
│   │       │       └── [id]/
│   │       ├── human-writer/
│   │       │   ├── profile/         # Global WritingProfile CRUD (persistent samples)
│   │       │   ├── chat/            # Style-aware chatbot (reads profile from DB)
│   │       │   ├── sessions/        # HumanWriterSession CRUD
│   │       │   │   └── [id]/
│   │       │   ├── upload/          # Legacy in-memory upload (not used by new page)
│   │       │   ├── analyze/         # Legacy style analyzer
│   │       │   └── generate/        # Legacy one-shot generator
│   │       ├── ai-research/
│   │       │   └── generate/        # Paper generation (5 formats)
│   │       ├── coding/
│   │       │   └── chat/            # Code chat (receives context in request body)
│   │       └── sessions/            # ResearchSession CRUD (AI Research history)
│   │           └── [id]/
│   ├── admin/
│   ├── chat-voice/                  # Primary unified chat + voice
│   ├── chat/ · voice-call/          # Legacy separate UIs
│   ├── guest/[token]/
│   ├── dashboard/
│   ├── ingest-doc/
│   ├── query-genius/
│   ├── pricing/
│   ├── research/                    # Research Suite hub (feature cards)
│   │   ├── notebook/                # NotebookLLM hub (all notebooks grid)
│   │   │   └── [id]/                # Individual notebook chat page
│   │   ├── human-writer/            # Human Writer chatbot page
│   │   ├── ai-research/             # AI Research Summary + paper generator
│   │   └── coding/                  # VS Code-style local code editor
│   ├── login/ · signup/ · verify-email/ · forgot-password/ · reset-password/
│   ├── layout.tsx · page.tsx · globals.css · SessionProviderWrapper.tsx
│
├── components/
│   ├── ui/                          # Button, Card, Input, Label (shadcn pattern)
│   ├── PricingModal.tsx
│   └── transition.tsx
│
├── lib/
│   ├── db.ts                        # Mongoose singleton (connectDB + connectAdminDB)
│   ├── llm.ts                       # callLLM() + getEmbedding() with fallback chains
│   ├── rateLimit.ts                 # checkAndIncrementAILimit() + getAIUsage()
│   ├── guestAuth.ts                 # resolveGuestToken() + incrementGuestCallCount()
│   ├── email.ts                     # Nodemailer helpers
│   ├── token.ts                     # Secure token generation
│   └── utils.ts                     # cn() utility
│
├── models/
│   ├── User.ts                      # role, company_id, aiCallCount, subscriptionPlan
│   ├── ChatSession.ts               # chat/voice sessions + messages + citations
│   ├── Document.ts                  # uploaded document metadata
│   ├── VectorChunk.ts               # textContent + vectorContent + embeddingModel
│   ├── PublicLink.ts                # guest token + features + guestCallCount
│   ├── SubscriptionRequest.ts       # plan upgrade queue (AgentoAdmin DB)
│   ├── NotebookSession.ts           # title, description, docs[], messages[]
│   ├── WritingProfile.ts            # global samples[], styleAnalysis (per user)
│   ├── HumanWriterSession.ts        # style-chat sessions + messages
│   └── ResearchSession.ts           # AI research paper sessions (inputs + output)
│
├── types/                           # next-auth.d.ts + global mongoose cache
├── public/                          # logo, assets
├── README.md
└── ARCHITECTURE.md                  # this file
```

---

## 5. Features & User Journeys

### 5.1 Core Platform Pages

| Route | Audience | Purpose |
|---|---|---|
| `/` | Public | Marketing landing |
| `/login` · `/signup` | Public | Credentials auth |
| `/dashboard` | Logged-in | Hub + usage meters + feature cards |
| `/chat-voice` | Logged-in | **Primary** Chat ↔ Voice toggle (shared RAG) |
| `/ingest-doc` | Admin | Upload + categorize documents |
| `/query-genius` | Logged-in | NL CRUD, analytics, LookUp charts |
| `/admin` | Admin | Employees, subscriptions, public link |
| `/pricing` | Logged-in | Plans + UPI upgrade request |
| `/guest/[token]` | External | Chat/voice without account |

### 5.2 Research Suite Pages

| Route | Purpose |
|---|---|
| `/research` | Hub page — 4 feature cards |
| `/research/notebook` | NotebookLLM hub — grid of all notebooks |
| `/research/notebook/[id]` | Individual notebook chat with sources sidebar |
| `/research/human-writer` | Style-learning ghostwriter chatbot |
| `/research/ai-research` | AI Research Summary with paper generator + history |
| `/research/coding` | VS Code-style local code editor (Monaco + FS API) |

---

## 6. Authentication & Authorization

### 6.1 Roles

| Role | How created | Capabilities |
|---|---|---|
| **admin** | Signup with admin role | Docs ingest, employee verify, public link, subscription admin |
| **employee** | Signup under company | Chat/voice/query/research after email verify + admin approve |
| **guest** | Not a User row | Synthetic identity via `PublicLink` token; scoped to company + features |

### 6.2 Login gate flow

```
Signup
  → bcrypt hash password
  → admins: accountVerified = true immediately
  → employees: accountVerified = false (pending admin)
  → verification token sent via email (~24h expiry)
  → Login blocked until emailVerified
  → employees also blocked until accountVerified by admin
  → NextAuth Credentials → JWT (id, company_id, company_name, role, subscriptionPlan)
```

### 6.3 Guest identity

```
Admin creates PublicLink (token, features["chat","voice"], enabled)
Guest opens /guest/{token}
  → GET /api/guest/validate
  → Client stores company + features
API calls include header: x-guest-token: <token>
Server: resolveGuestToken() → { company_id, features, email: "guest@{token}", role: "guest" }
```

Guest requests reuse the same `/api/chat` endpoint. The identity adapter (`resolveGuestToken`) returns a `GuestIdentity` that satisfies the same interface as `session.user` — no special branches in the chat logic.

---

## 7. Data Models

### `User` (`users`)
- Identity: `name`, `email`, `password` (bcrypt)
- Tenant: `role`, `company_id`, `company_name`
- Verification: `emailVerified`, `emailVerifyToken/Expiry`, `accountVerified`, `verifiedBy`
- Usage: `chatCallCount`, `voiceCallCount`, `queryCallCount`
- Subscription: `subscription` (bool), `subscriptionPlan`, `subscriptionExpiry`

### `Document` (`documents`)
- `company_id`, `filename`, `category`, `uploaded_by`, `upload_date`, `file_url`, optional `full_text`

### `VectorChunk` (`vector_store`)
- `metadata.{ company_id, category, filename, uploaded_by }`
- `textContent: string`, `vectorContent: number[]`, `embeddingModel: string`
- The `embeddingModel` field prevents mixing 768-dim Ollama vectors with 384-dim HuggingFace vectors at query time

### `ChatSession` (`chat_sessions`)
- `company_id`, `user_email`, `title`, `mode: "chat" | "voice"`
- `messages[]: { role, content, mermaidCode?, citations? }`

### `PublicLink` (`public_links`)
- `token`, `company_id`, `company_name`, `enabled`, `features[]`, `guestCallCount`, `expiresAt?`

### `NotebookSession` (`notebook_sessions`)
- `company_id`, `user_email`, `title`, `description`
- `docs[]: { docId, filename, chunks, size }` — doc references (embeddings live in in-memory store)
- `messages[]: { role, content, citations[] }`

### `WritingProfile` (`writing_profiles`)
- `company_id`, `user_email` (unique — one global profile per user)
- `samples[]: { sampleId, filename, content, words, uploadedAt }` — stored permanently in DB
- `styleAnalysis: string` — cached LLM-generated style description
- `analysedAt: Date | null`

### `HumanWriterSession` (`hw_sessions`)
- `company_id`, `user_email`, `title`
- `messages[]: { role, content, createdAt }`

### `ResearchSession` (`research_sessions`)
- `company_id`, `user_email`, `title` (auto-set from first 60 chars of idea)
- `inputs: { idea, prior, approach, result }`
- `output: string` — the full generated paper

### `SubscriptionRequest` (AgentoAdmin DB)
- User/company/plan/status/timestamps; approved by super-admin via email

### Query Genius (raw Mongo, not Mongoose models)
- Data collections: `qg_{company_id}_{collectionName}`
- Schema/meta: `qg_meta_{company_id}`

---

## 8. API Catalog

### Auth & Identity

| Endpoint | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | Public | NextAuth login/session |
| `/api/auth/signup` | POST | Public | Register + send verify email |
| `/api/auth/verify-email` | POST | Public | Confirm email token |
| `/api/auth/forgot-password` | POST | Public | Send reset email |
| `/api/auth/reset-password` | POST | Public | Set new password |
| `/api/auth/change-password` | POST | Session | Change own password |
| `/api/auth/companies` | GET | Public | Company list for signup dropdown |
| `/api/auth/usage` | GET | Session | Per-feature used/limit |
| `/api/auth/public-link` | GET/POST/PATCH/DELETE | Admin | Guest link lifecycle |
| `/api/auth/admin/employees` | GET/PATCH | Admin | Approve/reject employees |
| `/api/auth/subscription/request` | POST | Session | Request paid plan upgrade |
| `/api/auth/admin/subscription-requests` | GET/PATCH/DELETE | Admin | Manage plan requests |
| `/api/guest/validate` | GET | Public | Validate + return guest capabilities |

### Chat / RAG

| Endpoint | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/chat` | POST | Session **or** guest | RAG answer (+ optional mermaid, citations) |
| `/api/chat/sessions` | GET/POST | Session or guest | List / create sessions |
| `/api/chat/sessions/[id]` | GET/PATCH/DELETE | Session or guest | Load / append messages / delete |

### Documents

| Endpoint | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/documents/upload` | GET/POST | Admin | List docs / upload + ingest pipeline |
| `/api/documents/debug` | GET | Session | Chunk/doc counts |

### Query Genius

| Endpoint | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/query-genius/collections` | GET | Session | List company collections |
| `/api/query-genius/schema` | GET | Session | Infer/view schema |
| `/api/query-genius/data` | GET/DELETE | Session | Preview / drop collection |
| `/api/query-genius/upload` | POST | Session | CSV upload with schema |
| `/api/query-genius/query` | POST | Session | NL read/insert/update/delete |
| `/api/query-genius/analytics` | POST | Session | 4-mode analytics pipeline |
| `/api/query-genius/lookup` | POST | Session | Manual or AI chart generation |

### Research Suite

| Endpoint | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/research/notebook/upload` | POST/DELETE | Session | Upload doc → extract → embed → in-memory store |
| `/api/research/notebook/chat` | POST | Session | RAG chat over in-memory session docs |
| `/api/research/notebook/sessions` | GET/POST | Session | List / create notebook sessions |
| `/api/research/notebook/sessions/[id]` | GET/PATCH/DELETE | Session | Load / update docs+messages / delete |
| `/api/research/human-writer/profile` | GET/POST/DELETE | Session | Read / upload / delete writing samples (persistent DB) |
| `/api/research/human-writer/chat` | POST | Session | Style-aware chat (reads WritingProfile from DB) |
| `/api/research/human-writer/sessions` | GET/POST | Session | List / create HW chat sessions |
| `/api/research/human-writer/sessions/[id]` | GET/PATCH/DELETE | Session | Load / append / delete |
| `/api/research/ai-research/generate` | POST | Session | Generate paper in any of 5 formats |
| `/api/research/coding/chat` | POST | Session | Code chat (context sent in request body) |
| `/api/research/sessions` | GET/POST | Session | List / save ResearchSession (AI Research history) |
| `/api/research/sessions/[id]` | GET/DELETE | Session | Load / delete a research session |

---

## 9. RAG Pipeline (Documents → Chat/Voice)

### 9.1 Ingest (offline / admin)

```
File upload (admin) → extract text
  PDF: unpdf (getDocumentProxy + extractText)
  TXT/MD/CSV/JSON: file.text()
  → cleanText() — line quality filter (length ≥10, alphanumeric ratio ≥40%, ≥2 real words)
  → chunkText() — ~1000 chars per chunk, ~200 char overlap (carry last floor(overlap/5) words)
  → for each chunk: getEmbedding(text) → { embedding, model }
  → VectorChunk.insertMany({ metadata.company_id, textContent, vectorContent, embeddingModel })
  → Document metadata saved separately
```

**Categories (manual at upload):** HR, Engineering, Sales, Marketing, Finance, Legal, Operations, General — used for citation display, not retrieval filtering.

### 9.2 Retrieve + Generate (online, per question)

```
User question
  → Auth: session.user.company_id OR resolveGuestToken() → company_id
  → checkAndIncrementAILimit(email, "chat" | "voice")
  → Load ≤100 VectorChunks for company_id
  → getEmbedding(query) → { queryEmbedding, queryModel }
  → Filter: embeddingModel === queryModel  (dimension isolation)
  → cosine similarity all chunks → filter score > 0.2 → sort → Top-K = 5
  → If no results: $regex fallback on textContent (limit 10)
  → Build context: top chunks joined with \n\n---\n\n
  → Build prompt: system + context + last 6 history turns + user message
  → callLLM(prompt)
  → Optional: if needsFlowchart(query) → second callLLM() → Mermaid code
  → Return { message, mermaidCode?, citations[] }
```

### 9.3 Chat vs Voice prompts

| Aspect | Chat mode | Voice mode |
|---|---|---|
| System prompt | Company-named, detailed, encourage numbered steps | "Agento", max 2–3 sentences, simple language |
| Post-process | Full answer returned | Truncate >500 chars at sentence boundary |
| Rate key | `chat` | `voice` |

### 9.4 Chunking algorithm

```
Words of cleaned text → accumulate until (current + word).length > 1000
→ push chunk
→ carry last floor(200/5) = 40 words as overlap into next chunk
→ push final remainder
```

Fixed-size word-window with overlap. Heuristic, fast, and good enough for policy/HR documents.

### 9.5 RAG pattern summary

| Stage | Method |
|---|---|
| Extract | unpdf / file.text() |
| Clean | Line quality heuristics |
| Chunk | ~1000 chars + overlap |
| Embed | Ollama → HuggingFace |
| Store | MongoDB `vector_store` |
| Retrieve | Cosine Top-5, score > 0.2 |
| Fallback | $regex on textContent |
| Generate | callLLM() |
| Cite | { filename, category } deduplicated |
| Diagram | Keyword detection → optional Mermaid LLM call |

---

## 10. Query Genius (NL → MongoDB)

Query Genius is **not RAG**. It is **NL → MongoDB execution** over company tabular data.

**Live path = Next.js APIs only.** The legacy `queryGenius/query.py` is a historical Streamlit prototype, not wired.

Collections are namespaced `qg_{company_id}_{name}` — even a buggy LLM pipeline cannot accidentally access another tenant's collection by name.

### Operations

| Operation | AI involved? | Pattern |
|---|---|---|
| Upload CSV | No (schema UI) | Validate + ingest with schema builder |
| Read | Yes | LLM → aggregation pipeline JSON → aggregate() |
| Insert | No (usually) | Form + schema validation (no LLM cost) |
| Update | Yes | LLM → filter + $set → guarded updateMany |
| Delete | Yes | LLM → filter → guarded deleteMany |
| LookUp manual | No | Client axes + agg type → server builds pipeline |
| LookUp AI | Yes | LLM returns PIPELINE + CHART_TYPE |
| Analytics | Yes (heavy) | LLM → PIPELINE + CHART_TYPE + INSIGHT → execute → chart |

### Schema Inference

Sample up to 500 documents, detect per field: type, nullable, unique, isAutoIncrement, isPrimaryKey, min/max, enumValues (≤15 distinct strings). Fed into LLM prompts to generate safer queries and into UI for insert validation.

### Analytics intent taxonomy (4D)

| Type | Business framing | Prompt role |
|---|---|---|
| Descriptive | What happened? | Counts, averages, distributions |
| Diagnostic | Why did it happen? | Correlations, segments, root causes |
| Predictive | What might happen? | Trend-oriented aggregation narrative |
| Prescriptive | What should we do? | Actionable recommendations |

---

## 11. Voice Mode Architecture

Voice is a **thin client modality** over `/api/chat`. The server receives text. No audio streaming server.

```
[Start Call]
  → ensureMicPermission (getUserMedia audio, stop tracks)
  → SpeechRecognition.start() (continuous, interimResults)

[User speaks]
  → onresult → interim transcript displayed
  → ~1.5s silence timer → submit text to /api/chat { mode: "voice" }

[While processing]
  → recognition stopped (prevent echo / system audio feedback — half-duplex)

[Response]
  → speechSynthesis.speak(answer)
  → onend → restart recognition if still in call

[Error handling]
  → "aborted" errors ignored (expected on stop)
  → not-allowed → end call gracefully
```

**Critical UX pattern:** recognition is muted while TTS plays. If you don't do this, the assistant hears itself and the call loops.

---

## 12. Guest / Public Link Architecture

```
Admin Panel
  → POST /api/auth/public-link → create token (SHA-256 random, stored in PublicLink)
  → PATCH features: ["chat","voice"]
  → Copy URL / embed iframe snippet

External site iframe
  → src=/guest/{token} allow="microphone"
  → Guest page validates token → stores company + features in state
  → Feature-gated Chat / Voice tabs
  → API calls use header: x-guest-token: <token>
  → Sessions stored under user_email "guest@{token}"
  → guestCallCount incremented on AI use
```

Guests reuse the same RAG chat APIs. `resolveGuestToken()` returns a `GuestIdentity` object compatible with the `session.user` shape used in API handlers — zero special branches in chat/RAG logic.

---

## 13. Research Suite Architecture

The Research Suite is a separate product surface under `/research` accessible from the dashboard. It does not share rate limits with the core features but shares the LLM/embedding infrastructure.

### 13.1 Notebook LLM

**Architecture:**
```
Hub page (/research/notebook)
  → NotebookSession list from /api/research/notebook/sessions
  → Create new → POST → redirect to /research/notebook/[id]

Notebook chat page (/research/notebook/[id])
  → Load NotebookSession (title, docs[], messages[]) from DB
  → Sources sidebar: upload file → POST /api/research/notebook/upload
      → extract text (unpdf for PDF, file.text() for TXT/MD)
      → chunk + embed (same getEmbedding() pipeline)
      → store in global.__notebook_sessions__ Map<sessionId, DocEntry[]>
      → PATCH NotebookSession.docs with { docId, filename, chunks, size }
  → Chat: POST /api/research/notebook/chat { message, history, sessionId: notebookId }
      → getNotebookStore().get(notebookId) → in-memory doc chunks
      → getEmbedding(query) → cosine similarity → Top-6 chunks
      → callLLM(context + history + question)
      → return { message, citations[] }
  → PATCH session to persist message pair
```

**In-memory store design decision:** Notebook doc embeddings are stored in `global.__notebook_sessions__` (a server-side Map). This avoids a separate `NotebookVectorChunk` collection and keeps retrieval fast. Trade-off: embeddings are lost on server restart; users must re-upload. Doc references (names, sizes) are persisted in `NotebookSession.docs[]` so the UI shows them correctly after reload.

**Data flow distinction from Core RAG:**

| Aspect | Core RAG (AI Chat) | Notebook LLM |
|---|---|---|
| Doc scope | `company_id` (all company docs) | `sessionId` (notebook-specific docs) |
| Vector storage | MongoDB `vector_store` | In-memory Map on server |
| Persistence | Permanent until admin deletes | Cleared on server restart |
| Session title | Auto from first message | User-defined at creation |

### 13.2 Human Writer

**Architecture:**
```
Single page (/research/human-writer)
  Sidebar section 1 — Writing Style
    → GET /api/research/human-writer/profile
    → Upload .txt/.md → POST /api/research/human-writer/profile
        → Save to WritingProfile.samples[] in MongoDB (permanent, cross-session)
        → Trigger background refreshAnalysis() → callLLM(style analysis prompt)
        → Cache in WritingProfile.styleAnalysis
    → Delete sample → DELETE /api/research/human-writer/profile?sampleId=...
        → Remove from WritingProfile.samples[]
        → Trigger background refreshAnalysis()

  Sidebar section 2 — Chat History
    → GET /api/research/human-writer/sessions
    → Load session → GET /api/research/human-writer/sessions/[id]
    → Delete session → DELETE

  Chat area
    → POST /api/research/human-writer/chat { message, history }
        → Load WritingProfile from DB (no sessionId needed — global per user)
        → Build context: styleAnalysis + sample content (up to 4000 chars)
        → callLLM(style context + conversation history + user message)
        → Respond in user's exact voice
    → PATCH HumanWriterSession to persist message pair
```

**Key design decision — Global Writing Profile:**
Writing samples are stored in `WritingProfile` (one document per user email, unique index) rather than per-session. This means:
- Upload samples once → they work across all chat sessions forever
- Style analysis is cached and auto-refreshed on sample changes
- No re-upload required per session

This is fundamentally different from Notebook LLM where each notebook has its own isolated document set.

### 13.3 AI Research Summary

**Architecture:**
```
Page (/research/ai-research)
  Left column — Step Wizard (vertical accordion)
    → 4 input sections: idea, prior, approach, result
    → Each section: textarea + optional PDF/TXT upload
        → import("unpdf") for PDFs → extract text → append to textarea
    → "Next →" button advances accordion

  Center — Photon Particle Animation (Canvas, client-side)
    → ResearchOrb component: requestAnimationFrame loop
    → On generate: animate nodes sequentially (1.5s delay each)
    → Each active node fires photon particles toward center (cosine trajectory)
    → Center orb: indigo (idle) → gold (all nodes complete) → green (synthesis done)
    → Outgoing photons fire during synthesis phase

  Right column — Live Paper Preview
    → On generate:
        → Animate all 4 nodes as "active"
        → POST /api/research/ai-research/generate { idea, prior, approach, result, format }
            → callLLM(format-specific prompt, 120000ms timeout)
            → Returns structured paper text
        → Render output: PaperPreview component
            → Custom markdown→JSX renderer (Georgia serif font)
            → Handles H1/H2/H3, bold, italic, HR, bullets, lists, code
        → Save to ResearchSession via POST /api/research/sessions

  History sidebar (collapsible)
    → GET /api/research/sessions → list of past papers
    → Click to reload: restore inputs[] + output
    → Delete: DELETE /api/research/sessions/[id]

  Export button (dropdown, appears after generation)
    → "Word Document (.docx)": downloadAsDocx()
        → import("docx") — client-side only
        → Build Document tree: Heading1/2/3, Paragraph, TextRun (bold/italic), bullet
        → Packer.toBlob() → browser download
    → Other formats: re-call /api/research/ai-research/generate with new format
        → downloadAsText() as .txt
```

**5 output formats:**

| Format | Prompt instructions |
|---|---|
| standard | APA headings, paragraphs, 1-inch margins — Word format |
| ieee | IEEE LaTeX structure, numbered sections, two-column style |
| springer | LNCS One-Pager, <800 words, dense structure |
| acm | ACM SIG Proceedings, uppercase sections |
| abstract | 500-word extended abstract with labeled sections |

**Word export uses `docx` library (not HTML-in-Word hack):** `Document → Packer.toBlob()` creates a real `.docx` binary. Opens in Microsoft Word without errors or recovery dialogs.

### 13.4 AI Coding Assistant

**Architecture (fundamentally different from all other tools):**
```
Page (/research/coding)
  No uploads to server. No server-side file store.

  File System Access API flow:
    → window.showDirectoryPicker({ mode: "readwrite" })
    → Returns FileSystemDirectoryHandle (permission to read/write real local disk)
    → readDir(handle, "") → recursive tree (skip node_modules/.git/.next/dist)
    → Tree rendered as accordion (lazy-load children on expand)

  File editing:
    → Click file → fileHandle.getFile() → file.text() → load into Monaco Editor
    → Tab opened in tab bar
    → Edit in Monaco → content in React state (openTabs[])
    → Ctrl+S / Cmd+S → fileHandle.createWritable() → write → close
      → saved directly to user's local disk, zero server involvement

  AI Chat Panel:
    → User asks question in chat panel
    → Build context from React state:
        activeFile: { path, content } (full content of current open file)
        contextFiles: other open tabs (truncated, up to 4 files)
        folderSummary: emoji tree from in-memory tree state
    → POST /api/research/coding/chat { message, history, activeFile, contextFiles, folderSummary }
        → No server-side store lookup (key difference from old architecture)
        → Build prompt sections from request body
        → callLLM(prompt, 120000)
        → Return concise response (≤6 sentences unless showing code)
    → ChatContent renderer: handles code blocks with copy buttons, inline bold/italic

  Layout:
    Activity Bar (48px) → Explorer / Search / Git / AI icons
    File Explorer (256px) → recursive tree, colored file icons, lazy expand
    Monaco Editor (flex-1) → tab bar + breadcrumbs + editor surface + minimap
    AI Chat Panel (320px) → context bar + messages + input
    Status Bar (22px fixed bottom) → folder name, save state, language, Ln/Col
```

**Why File System Access API instead of `<input webkitdirectory>`:**

| `<input webkitdirectory>` (old approach) | File System Access API (new approach) |
|---|---|
| Copies files to browser memory → server upload | Reads from/writes to actual disk files |
| Server needs a store (`__coding_sessions__`) | No server store — file context sent in request |
| Files become stale (can't read changes) | Always reads live disk content |
| Large codebases hit memory/upload limits | Only sends selected file content in chat payload |
| Read-only from user's perspective | True read + write (Ctrl+S saves to disk) |

**Key architectural rule:** The `__coding_sessions__` global store in the old upload API is now unused. The new chat route receives all file context in the request body (`activeFile`, `contextFiles`). The server is stateless for coding sessions.

**Monaco Editor integration:**
- Loaded client-side only via `dynamic(() => import("@monaco-editor/react"), { ssr: false })`
- Language auto-detected from file extension via `EXT_LANG` map (20+ languages)
- File icon colors via `EXT_COLOR` map per extension
- `onMount(editor)` callback tracks cursor position for status bar
- Options: JetBrains Mono font, font ligatures, minimap, bracket pair colorization, indent guides

---

## 14. LLM & Embedding Fallback Chain

Implemented in `lib/llm.ts`.

### Completions — `callLLM(prompt, timeoutMs = 60000)`

```
1) Ollama  POST {OLLAMA_URL}/api/generate
           model: OLLAMA_MODEL, temperature: 0.1, top_p: 0.9
           timeout: timeoutMs (default 60s, analytics/research use 90-120s)
2) Groq_API_1 → Groq_API_2 → Groq_API_3
   POST https://api.groq.com/openai/v1/chat/completions
   model: llama-3.3-70b-versatile, max_tokens: 2048, temperature: 0.1
3) throw "All LLM providers failed"
```

### Embeddings — `getEmbedding(text)`

```
1) Ollama /api/embeddings
   model: OLLAMA_EMBEDDING_MODEL (nomic-embed-text → ~768-dim)
   timeout: 10s
2) HuggingFace featureExtraction
   model: HF_EMBEDDING_MODEL (all-MiniLM-L6-v2 → ~384-dim)
3) Return { embedding: [], model: "" } → text/regex fallback in caller
```

**Why store `embeddingModel` on chunks?** So a 768-dim corpus is never cosine-compared with a 384-dim query vector. The retrieval step filters `chunk.embeddingModel === queryModel` before scoring.

---

## 15. Rate Limiting & Subscriptions

### Plan limits

| Plan | Chat + Voice | Query Genius AI ops |
|---|---|---|
| Starter (default / inactive) | 10 each | 10 |
| Pro-Chat | 500 chat + 500 voice | 10 (starter rate) |
| Pro-Query | 10 chat + 10 voice | 500 |
| Business | Unlimited | Unlimited |
| `ADMIN_MAIL` env var | Unlimited bypass | Unlimited bypass |

### Algorithm (increment-first metering)

```
1. $inc feature counter on User (chatCallCount / voiceCallCount / queryCallCount)
2. Resolve active plan (check subscription + expiry → else starter)
3. If used > limit:
   → $inc -1 (rollback)
   → return { allowed: false } → 429
4. If allowed: return { allowed: true, used, limit }
```

**What counts:** chat messages, voice queries, QG read/update/delete, analytics, AI LookUp.
**What doesn't count:** uploads, schema reads, inserts, manual LookUp, Research Suite tools.

### Subscriptions

Manual UPI payment process (no Stripe in pilot):
1. User clicks upgrade → POST `/api/auth/subscription/request`
2. Email sent to admin with plan + UPI instructions
3. Admin verifies payment → PATCH request to approve
4. `User.subscription = true`, `subscriptionPlan`, `subscriptionExpiry` set
5. Confirmation email sent to user

---

## 16. Email Flows

All email via Nodemailer + Gmail SMTP (`EMAIL_*` env vars).

| Trigger | Recipient | Content |
|---|---|---|
| Signup | User | Email verification link (~24h token) |
| Forgot password | User | Reset link (~15 min token) |
| Subscription request | Admin mailbox | Plan details + UPI instructions |
| Subscription queued | User | Confirmation + payment instructions |
| Subscription approved | User | Plan activated |
| Subscription rejected | User | Rejection notice |

---

## 17. Environment & External Connections

| Variable | Purpose |
|---|---|
| `MONGO_URI` | Main DB (`Agento` — all product data) |
| `MONGO_URI_ADMIN` | Admin DB (`AgentoAdmin` — subscription requests) |
| `NEXTAUTH_SECRET` | JWT signing key |
| `NEXTAUTH_URL` | Canonical app URL (set to prod domain in production) |
| `OLLAMA_URL` | Ollama instance base URL |
| `OLLAMA_MODEL` | Chat/completions model name |
| `OLLAMA_EMBEDDING_MODEL` | Embedding model name (nomic-embed-text) |
| `Groq_API_1..3` | Groq cloud LLM fallback keys (free tier at console.groq.com) |
| `HF_TOKEN` | HuggingFace inference token (free at hf.co) |
| `HF_EMBEDDING_MODEL` | HF embedding model (all-MiniLM-L6-v2) |
| `EMAIL_HOST/PORT/FROM/USER/PASS` | Gmail SMTP for transactional email |
| `ADMIN_MAIL` | Server-side admin bypass + email recipient |
| `NEXT_PUBLIC_ADMIN_MAIL` | Client-side admin UI gate |
| `NEXT_PUBLIC_ADMIN_UPI_PHONE_NO` | Pricing page UPI display |

---

## 18. Methodology & Design Patterns

### 18.1 Pattern catalog

| Pattern | Where used |
|---|---|
| Backend-for-Frontend (BFF) | `app/api/*` |
| Shared-nothing multi-tenancy | `company_id` on all models |
| RBAC + feature flags | roles + PublicLink.features |
| Retrieve-then-Generate (RAG) | Core chat/voice + Notebook LLM |
| Fixed-size chunking with overlap | `chunkText()` |
| Hybrid retrieval (dense + lexical) | `/api/chat`, notebook chat |
| Provider cascade / failover | `callLLM()`, `getEmbedding()` |
| Embedding dimension isolation | `embeddingModel` field on VectorChunk |
| Secondary LLM call (tool-like) | Mermaid flowchart generation |
| NL → Query (Text-to-Mongo) | Query Genius CRUD + analytics |
| Schema-on-read inference | `inferSchema()` |
| Validate-then-execute | QG insert/update/delete guards |
| Dual-path visualization | Manual LookUp vs AI LookUp |
| Analytics intent taxonomy | 4D analytics prompt framing |
| Increment-first rate metering | `checkAndIncrementAILimit()` |
| Half-duplex audio | Stop STT while TTS plays |
| Token-based guest identity | PublicLink resolve |
| Dual database | Agento vs AgentoAdmin |
| Global persistent profile | WritingProfile (one per user) |
| In-memory session store | Notebook RAG embeddings |
| File System Access API | Coding Assistant local R/W |
| Request-body context passing | Coding chat (stateless server) |
| Client-side Word generation | `docx` library, Packer.toBlob() |
| Canvas particle animation | ResearchOrb photon system |
| Lazy tree loading | Coding file explorer (expand on demand) |
| Adapter pattern for LLM | `lib/llm.ts` wraps all providers |

### 18.2 Key architecture decisions with rationale

**Why File System Access API instead of upload for the code editor?**
Upload creates stale server-side copies that go out of sync as files are edited. The FS API gives true read/write to the live disk, matches VS Code's actual model, and eliminates the need for a server-side file store entirely. The trade-off: requires Chrome/Edge 86+ (Safari unsupported without flag, Firefox requires flag).

**Why a global WritingProfile instead of per-session samples?**
Writing style is a persistent user characteristic — it doesn't change per conversation. Making users re-upload samples for every chat would be a friction failure. One profile per user email (unique MongoDB index) ensures samples accumulate and style analysis improves over time.

**Why in-memory store for Notebook RAG instead of a new `NotebookVectorChunk` collection?**
Notebook documents are per-notebook and often temporary (exploratory research). A permanent collection would accumulate rarely-reused vectors. The in-memory store trades persistence (lost on server restart) for zero schema overhead and fast retrieval. Doc references (names, sizes) are still persisted in `NotebookSession.docs[]` so the UI never shows phantom files.

**Why send file content in the coding chat request body instead of a server store?**
The File System Access API means files live on the user's local disk. The server can never independently read them. The only option for AI context is for the browser to send selected file contents in the request. This also makes the server completely stateless for coding sessions — simpler, more scalable, no cleanup needed.

**Why not use LangChain / LlamaIndex?**
For the pilot's scope (fixed RAG, fixed analytics pipelines), adding an agent framework would introduce abstraction overhead without proportional benefit. `lib/llm.ts` is a thin adapter that provides the same failover behavior with 50 lines of code. The methodology is still RAG; the infrastructure is just less abstracted.

### 18.3 Cross-cutting design principles

1. **Ground generation in data.** RAG context or Mongo execution results, not free hallucination when retrieval works.
2. **Tenant walls first.** Every read/write path scopes by `company_id`.
3. **Degrade gracefully.** Ollama→Groq, vectors→regex, AI LookUp→manual LookUp.
4. **Constrain model output.** JSON-only / PIPELINE blocks; parse defensively.
5. **Keep modalities thin.** Voice/chat share `/api/chat`. Code chat is stateless via request body.
6. **Pilot pragmatism.** Fixed chunking + in-memory cosine before introducing vector DB complexity.
7. **Client-side for local data.** File System API and `docx` export both run in the browser — no server needed for private local operations.

### 18.4 Interview answer: "What design patterns did you use?"

**Short list:**
BFF pattern · Multi-tenant shared-DB with namespace prefixing · RAG (retrieve-then-generate) · Fixed-size chunking with overlap · Hybrid retrieval (dense + keyword) · LLM adapter + failover cascade · Schema-on-read inference · Text-to-Mongo with validate-then-execute · Dual-path visualization · Half-duplex audio UX · RBAC + feature flags · Increment-first rate metering · Global persistent profile · File System Access API for local-first editing · Client-side docx generation · Canvas particle animation · Request-body context for stateless AI

**Differentiator sentence:**
"We split unstructured knowledge (RAG) from structured analytics (NL→Mongo), added a local-first code editor using the browser's File System Access API, and a persistent global writing profile for style-matched generation — all sharing one LLM adapter with Ollama→Groq→HuggingFace failover."

---

## 19. End-to-End Workflow Diagrams

### 19.1 Document → Answer (Core RAG)

```
Admin uploads file
  ↓
/api/documents/upload
  → extract text (unpdf / file.text())
  → cleanText() — noise filter
  → chunkText() — ~1000 chars + overlap
  → getEmbedding() per chunk (Ollama → HF)
  → VectorChunk.insertMany() [company_id, vectorContent, embeddingModel]
  ↓
Employee asks question in /chat-voice
  ↓
/api/chat
  → session OR guest token → company_id
  → checkAndIncrementAILimit()
  → load ≤100 VectorChunks for company
  → getEmbedding(query) → cosine Top-5, score>0.2
  → if empty: $regex fallback
  → build prompt (context + history + message)
  → callLLM()
  → optional: needsFlowchart() → second callLLM() → Mermaid
  → return { message, mermaidCode?, citations[] }
```

### 19.2 Query Genius Analytics

```
User selects collection + analytics type + question
  ↓
/api/query-genius/analytics
  → callLLM(type-specific prompt asking for PIPELINE+CHART_TYPE+INSIGHT)
  → parse response (extract JSON pipeline)
  → db.collection(qg_{company}_{name}).aggregate(pipeline)
  → flatten results for chart
  → return { results, insight, chartType }
  ↓
UI → Recharts renders chart + AI insight panel
```

### 19.3 Notebook LLM — Chat

```
User opens /research/notebook/[id]
  → Load NotebookSession (docs[], messages[])
  → If docs not in memory: user uploads → /api/research/notebook/upload
      → extract → chunk → embed → store in global.__notebook_sessions__[notebookId]
  → User asks question
  ↓
/api/research/notebook/chat { message, history, sessionId: notebookId }
  → getNotebookStore().get(notebookId) → DocEntry[]
  → getEmbedding(query) → cosine search across all docs' chunks
  → Top-6 relevant chunks → build context
  → callLLM(context + history + question)
  → return { message, citations[] }
  ↓
Page → PATCH /api/research/notebook/sessions/[id] to persist message pair
```

### 19.4 Human Writer — Chat

```
User uploads writing sample (once, ever)
  ↓
/api/research/human-writer/profile POST
  → save to WritingProfile.samples[] (MongoDB, permanent)
  → background: refreshAnalysis() → callLLM(style analysis) → cache in styleAnalysis

User asks "Write a LinkedIn post about AI"
  ↓
/api/research/human-writer/chat POST { message, history }
  → WritingProfile.findOne({ user_email }) from DB
  → build context: styleAnalysis + sample content (≤4000 chars)
  → callLLM(style context + history + message, 90000)
  → respond in user's voice
  ↓
Page → PATCH HumanWriterSession to persist
```

### 19.5 AI Research Summary — Paper Generation

```
User fills 4 accordion sections + selects format
  ↓
Page animate: nodes 1→2→3→4 light up sequentially (1.5s each)
Canvas: photon particles fire from each node toward center orb
  ↓
/api/research/ai-research/generate POST { idea, prior, approach, result, format }
  → format-specific system prompt (standard / ieee / springer / acm / abstract)
  → callLLM(prompt, 120000)
  → return formatted paper text
  ↓
Canvas: orb turns gold then green
Page: PaperPreview renders paper in Georgia serif
Page: POST /api/research/sessions → save to ResearchSession
  ↓
Export button → dropdown:
  → "Word Document": import("docx") client-side → Packer.toBlob() → download .docx
  → Other formats: re-call /api/research/ai-research/generate with new format → .txt
```

### 19.6 AI Coding Assistant — Edit + AI Chat

```
User clicks "Open Folder"
  → window.showDirectoryPicker({ mode: "readwrite" })
  → FileSystemDirectoryHandle returned (browser OS permission granted)
  → readDir() recursively → tree state (lazy-load children)

User clicks a file in explorer
  → fileHandle.getFile() → file.text() → Monaco Editor loads content
  → Tab opened, language auto-detected

User edits code
  → Monaco onChange → React state update (openTabs[].content)
  → Ctrl+S → fileHandle.createWritable() → write → close
  → File saved directly to local disk (no server involved)

User asks AI "What does this function do?"
  ↓
/api/research/coding/chat POST { message, history, activeFile, contextFiles, folderSummary }
  → No server-side store lookup
  → Build prompt sections from request body
  → callLLM(prompt, 120000)
  → Concise response (≤6 sentences, code block only if change suggested)
  → ChatContent renders: code blocks with copy buttons, inline bold/italic
```

### 19.7 Voice Call Loop

```
[Start]         → ensureMicPermission → SpeechRecognition.start()
[Listening]     → onresult → show interim transcript
[Submit]        → silence ~1.5s → POST /api/chat { mode: "voice" }
[Processing]    → STT stopped (half-duplex — no echo)
[Speaking]      → speechSynthesis.speak(trimmed answer)
[End TTS]       → restart recognition if still in call
[Error/Stop]    → graceful cleanup
```

---

## 20. Known Caveats / Trade-offs

| Area | Limitation | Reason / Trade-off |
|---|---|---|
| Subscription payments | Manual UPI via email; no Stripe | Pilot simplicity |
| Voice support | Chrome/Edge recommended | Web Speech API compatibility |
| File System Access API | Not available in Safari; Firefox requires flag | Browser API maturity |
| Notebook RAG store | Lost on server restart | In-memory trade-off vs separate collection |
| Research Suite rate limits | Not enforced in v0.3 | Separate from core feature billing |
| Analytics accuracy | LLM-generated pipelines, not trained models | NL→Mongo is prompt-based |
| Chunk quality | Fixed-size heuristic, not semantic | Baseline sufficient for policy docs |
| Embedding cap | Top-100 candidates loaded per query | In-memory cosine on small corpus |
| Coding AI context | Only open tabs sent | Browser can't push all files to server |
| Word export | Browser-side docx; no server-side rendering | Simpler architecture, same output quality |
| Dual DB | Admin DB separate connection | Billing/ops isolation without full microservice |

---

*Last updated: v0.3 — Research Suite (Notebook LLM · Human Writer · AI Research Summary · AI Coding Assistant)*

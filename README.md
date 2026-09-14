# Agento — AI-Powered Enterprise Platform

> v0.3 · Next.js 16 · MongoDB · Ollama · Groq · Monaco Editor

Agento is a multi-tenant AI platform that lets companies chat with their documents, query structured data with natural language, run analytics, and build research workflows — all from a single authenticated dashboard. It ships with a full **Research Suite** covering Notebook LLM, a Human Writer ghostwriter, an AI Research Paper generator with animated agent visualization, and a local-first VS Code-style coding assistant.

---

## Platform Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         AGENTO DASHBOARD                             │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐  │
│  │  AI Chat+Voice  │  │  Query Genius   │  │   Research Suite    │  │
│  │  (RAG pipeline) │  │  (NL→MongoDB)   │  │  (4 tools, below)   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘  │
│                                                                      │
│  Admin: Document Ingest · Employee Management · Subscriptions        │
│  Public Guest Link · Rate Limiting · Pricing Plans                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Feature Set

### Core Platform

#### AI Chat & Voice  `/chat-voice`
Unified chat and voice interface on a single page. Both modes share the same RAG pipeline (vector similarity search over company documents) and session history. Voice uses the browser's Web Speech API; responses are trimmed for spoken delivery.

- Collapsible session sidebar with full chat history — fixed position, only the message list scrolls
- Mermaid flowchart rendering for process questions
- Source citations on every answer (linked back to filename + category)
- Mic auto-mutes while the AI is speaking
- **Image OCR upload** — attach any PNG/JPEG/WebP image; Tesseract.js extracts the text server-side and sends it to the RAG pipeline automatically. Add an optional typed follow-up question on top.

#### Document Ingestion  `/ingest-doc`  *(Admin only)*
Upload PDF, TXT, CSV, MD, or JSON files. The pipeline extracts text, cleans it, chunks it into overlapping windows (~800 chars, 150 overlap), generates embeddings via Ollama or HuggingFace, and stores each chunk as a `VectorChunk` document tagged with `embeddingModel`.

#### Query Genius  `/query-genius`
Four-mode structured data workspace:

| Mode | Description |
|---|---|
| **Data Ingestion** | Upload CSV with a custom schema builder (field types, PK, unique, nullable, auto-increment, enums) |
| **Work on Data** | Natural-language CRUD — read, insert, update, delete via LLM-generated MongoDB pipelines |
| **Analytics** | Descriptive / Diagnostic / Predictive / Prescriptive modes with chart + AI insight |
| **LookUp** | Manual axis/aggregation chart builder or AI-described chart generation |

Supported chart types: Bar, Line, Area, Pie, Scatter (Recharts).

#### Shareable Public Link  *(Admin Panel)*
Generate a guest URL (`/guest/<token>`) that gives external users access to Chat and/or Voice without an account. Embeddable as an `<iframe>`. Admin can enable/disable, regenerate, or delete the link. Guest usage is tracked separately per link token.

#### Admin Panel  `/admin`
- Employee list with verification status
- Subscription request queue (approve/deny)
- Public link management with feature toggles
- Usage monitoring per user

---

### Research Suite  `/research`

Four tools accessible from the Research Hub card on the dashboard.

---

#### 1. Notebook LLM  `/research/notebook`

Google NotebookLM-style document Q&A with full notebook persistence.

**Hub page** (`/research/notebook`) — Card grid of all your notebooks (doc count, message count, last updated). Create, open, or delete notebooks.

**Notebook chat page** (`/research/notebook/[id]`) — Per-notebook chat interface:
- Upload PDF, TXT, or MD sources into the notebook (stored in MongoDB as `NotebookSession`)
- Documents are chunked and embedded server-side using the same RAG pipeline as AI Chat
- Collapsible sources sidebar listing all uploaded files with chunk count and size
- Every conversation turn is saved to the session automatically
- Cited answers showing which document each fact came from
- UI mirrors the AI Chat page exactly (same backgrounds, bubble styles, input bar)

---

#### 2. Human Writer  `/research/human-writer`

A personal AI ghostwriter that learns and permanently stores your writing style.

- **Global Writing Profile** — Upload `.txt` or `.md` writing samples once. They persist in MongoDB (`WritingProfile` collection) and apply across all chat sessions forever. No re-uploading per session.
- **Automatic Style Analysis** — After every upload or deletion the system re-runs a background style analysis (sentence length, vocabulary, tone, transitions, punctuation habits) and caches the result.
- **Chat interface** — Full ChatGPT-style chatbot. The AI reads your entire writing profile and style analysis from the database before every response, then writes everything in your exact voice.
- **Chat history** — All sessions saved to `HumanWriterSession` collection. Collapsible sidebar with two sections: Writing Style (sample list + detected style preview) and History (past chats).

---

#### 3. AI Research Summary  `/research/ai-research`

Multi-agent research paper generator with a live photon particle animation.

**Two-column layout:**
- **Left — Step Wizard**: Vertical accordion with 4 input nodes. Each section can accept typed text or an uploaded PDF/TXT (text extracted with `unpdf`). A "Next →" button advances through sections. Step badges show live agent status (spinner → green checkmark).
- **Right — Live Preview**: Academic paper rendered in Georgia serif font with proper heading hierarchy, bold, italic, horizontal rules, and bullet lists — all from markdown output. White paper card with shadow.

**Photon Animation** (Canvas, client-side):
- 4 colored nodes on an orbit ring (one per section)
- Nodes light up and fire laser photon particles toward the center as each agent activates
- Center orb pulses indigo → gold (synthesis) → green (complete)
- Rotating dashed ring + trailing photon particles with glow

**History Sidebar** — collapsible panel between editor and preview. Every generated paper is saved to `ResearchSession` in MongoDB. Click any past paper to reload inputs + output. Delete with confirmation.

**Export** — single "Export" button with dropdown after generation:
| Format | Output |
|---|---|
| Word Document | Real `.docx` via `docx` library (Times New Roman 12pt, 1-inch margins, proper heading styles, bullet formatting) |
| IEEE LaTeX | `.txt` with IEEE-style structure |
| Springer One-Pager | `.txt` compact format |
| ACM Format | `.txt` ACM proceedings style |
| Extended Abstract | `.txt` 500-word structured abstract |

---

#### 4. AI Coding Assistant  `/research/coding`

A local-first VS Code / Cursor-style code editor running entirely in the browser.

**Key architecture decision**: Uses the browser's **File System Access API** (`window.showDirectoryPicker()`) — no file uploads, no server copies. Files are read from and written directly to your local disk.

**Layout (4-panel):**
```
┌────────┬──────────────────────┬──────────────────────┬────────────────┐
│Activity│  File Explorer /     │   Monaco Editor      │  AI Assistant  │
│  Bar   │  Search / Git panel  │  (VS Code engine)    │  Chat Panel    │
│ 48px   │      256px           │      flex-1          │    320px       │
└────────┴──────────────────────┴──────────────────────┴────────────────┘
│                         Status Bar (22px, indigo)                     │
└───────────────────────────────────────────────────────────────────────┘
```

**Activity Bar** — Explorer, Search, Git, AI icons with active panel indicator (indigo left border).

**File Explorer** — Recursive lazy tree using `dirHandle.values()`. Folders expand on click loading children on demand. Auto-skips `node_modules`, `.git`, `.next`, `dist`, `__pycache__`. File icons colored by extension.

**Monaco Editor** — The exact VS Code engine via `@monaco-editor/react`:
- Syntax highlighting for 20+ languages
- Line numbers, minimap, bracket pair colorization
- JetBrains Mono / Fira Code / Cascadia Code font with ligatures
- `Ctrl+S` / `Cmd+S` saves directly to disk via `FileSystemFileHandle.createWritable()`
- Cursor position tracked in status bar

**Tab Bar** — Multiple files open simultaneously. Amber `●` dot on unsaved files. Indigo top border on active tab.

**Breadcrumbs** — Full path shown above the editor.

**Global Search** — Searches all files in the folder recursively by text match. Click result to open file.

**AI Chat Panel** — Sees all open file contents as context. Sends active file + other open tabs directly in the request body (no server-side store). Concise, actionable responses with properly rendered code blocks and copy buttons.

**Status Bar** — Folder name, save indicator, unsaved warning, language mode, line/col position, error/warning counts.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.1 |
| Language | TypeScript | ^5 |
| Runtime | React | 19.2.3 |
| Styling | Tailwind CSS | ^4 |
| Animation | tw-animate-css | ^1.4.0 |
| Animation (complex) | Framer Motion | ^12.25.0 |
| Auth | NextAuth (credentials) | ^4.24.13 |
| Database | MongoDB via Mongoose | ^9.1.2 |
| LLM (local) | Ollama | any model |
| LLM (cloud) | Groq — llama-3.3-70b-versatile | via API |
| Embeddings (local) | Ollama — nomic-embed-text (768-dim) | via API |
| Embeddings (cloud) | HuggingFace — all-MiniLM-L6-v2 (384-dim) | ^4.13.15 |
| Code Editor | Monaco Editor (`@monaco-editor/react`) | ^4.7.0 |
| File System API | Browser File System Access API | native |
| Word Export | docx | ^9.7.1 |
| Charts | Recharts | ^3.8.0 |
| PDF parsing | unpdf | ^1.4.0 |
| Flowcharts | Mermaid.js | ^11.12.2 |
| Email | Nodemailer (Gmail SMTP) | ^7.0.12 |
| UI Primitives | Radix UI (Label, Slot) | ^2.x |
| Icons | Lucide React | ^0.562.0 |
| Class utilities | clsx + tailwind-merge + class-variance-authority | latest |
| Password hashing | bcryptjs | ^3.0.3 |
| OCR | tesseract.js | latest |

---

## Architecture

### LLM Fallback Chain

Every AI call follows this priority order:

```
Ollama (local, 60s timeout)
  → Groq_API_1
    → Groq_API_2
      → Groq_API_3
        → Error: All LLM providers failed
```

Embeddings:
```
Ollama nomic-embed-text  →  768-dim vectors
  → HuggingFace all-MiniLM-L6-v2  →  384-dim vectors
    → Returns []  →  text regex fallback search
```

Vectors are tagged with `embeddingModel` so 768-dim and 384-dim vectors are never compared against each other.

### RAG Pipeline (AI Chat + Notebook LLM)

```
User Query
  → getEmbedding(query)          # Ollama or HF
  → cosine similarity vs. all chunks in session/company scope
  → filter score > 0.1-0.2, take top-5/6
  → if no vector results → regex text fallback
  → build context string
  → callLLM(systemPrompt + context + history + query)
  → return response + citations[]
```

### Multi-Tenancy

Every user belongs to a `company_id`. All data is scoped to it:
- `VectorChunk` — `metadata.company_id`
- `ChatSession` — `company_id + user_email`
- `NotebookSession` — `company_id + user_email`
- `HumanWriterSession` — `company_id + user_email`
- `WritingProfile` — `user_email` (unique, global per user)
- `ResearchSession` — `company_id + user_email`
- Query Genius collections — namespaced `qg_{company_id}_{name}` in MongoDB

### In-Memory Stores (server-side, per deploy instance)

Used for temporary per-session document embeddings in Notebook LLM:
- `__notebook_sessions__` — `Map<sessionId, DocEntry[]>` (chunks + embeddings)

The Coding Assistant does **not** use any server-side store — file content is sent directly in each chat request from the browser.

---

## Project Structure

```
app/
  dashboard/               # Main dashboard with feature cards
  chat-voice/              # Unified AI Chat + Voice (tab toggle)
  chat/                    # Standalone AI Chat
  voice-call/              # Standalone Voice Call
  guest/[token]/           # Public guest page (no login)
  ingest-doc/              # Document upload (admin only)
  query-genius/            # Structured data + analytics
  pricing/                 # Pricing plans page
  admin/                   # Admin panel
  research/                # Research Suite hub
    notebook/              # Notebook LLM hub (all notebooks)
    notebook/[id]/         # Individual notebook chat
    human-writer/          # Human Writer chatbot
    ai-research/           # AI Research Summary + paper generator
    coding/                # VS Code-style local code editor
  api/
    auth/                  # NextAuth + signup/login/reset/verify/public-link
    chat/                  # AI Chat API + session CRUD
    documents/             # Document upload + embedding pipeline
    query-genius/          # Collections, schema, query, analytics, lookup
    guest/validate/        # Guest token validation
    ocr/                   # Tesseract.js OCR endpoint (image → text)
    research/
      notebook/            # Notebook upload (in-memory RAG) + chat + session CRUD
      human-writer/        # Writing profile (persistent), sessions, chat
      ai-research/         # Research paper generation (5 formats)
      coding/              # Code chat (File System API — no store)
      sessions/            # ResearchSession CRUD (AI Research history)

components/
  ui/                      # shadcn/ui primitives: Button, Card, Input, Label
  PricingModal.tsx          # Pricing cards (modal + inline modes)
  transition.tsx            # Framer Motion page transition

lib/
  db.ts                    # MongoDB connection (singleton)
  llm.ts                   # callLLM() + getEmbedding() with fallback chains
  rateLimit.ts             # AI call counter + admin bypass
  guestAuth.ts             # resolveGuestToken() + incrementGuestCallCount()
  email.ts                 # Nodemailer SMTP helpers
  token.ts                 # Secure token generation
  utils.ts                 # cn() Tailwind class utility

models/
  User.ts                  # User (role, company_id, aiCallCount, subscriptionPlan)
  ChatSession.ts           # Chat sessions + messages + citations
  Document.ts              # Uploaded document metadata
  VectorChunk.ts           # Embedding chunks (text + vector + embeddingModel)
  PublicLink.ts            # Guest public link (token, features, guestCallCount)
  NotebookSession.ts       # Notebook (title, description, docs[], messages[])
  WritingProfile.ts        # Global writing style profile (samples[], styleAnalysis)
  HumanWriterSession.ts    # Human Writer chat sessions
  ResearchSession.ts       # AI Research paper sessions (inputs + output)
  SubscriptionRequest.ts   # Plan upgrade request queue
```

---

## Environment Variables

```env
# MongoDB
MONGO_URI="mongodb://127.0.0.1:27017"

# NextAuth
NEXTAUTH_SECRET=your_random_secret_here
NEXTAUTH_URL=http://localhost:3000

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_FROM=your-email@gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your_google_app_password

# Ollama (local — optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=nomic-embed-text:latest

# Groq (cloud LLM fallback — free keys at console.groq.com)
Groq_API_1=gsk_...
Groq_API_2=gsk_...
Groq_API_3=gsk_...

# HuggingFace (cloud embedding fallback — token at hf.co/settings/tokens)
HF_TOKEN=hf_...
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Admin
ADMIN_MAIL=your-admin-email@gmail.com
NEXT_PUBLIC_ADMIN_MAIL=your-admin-email@gmail.com
NEXT_PUBLIC_ADMIN_UPI_PHONE_NO=your-upi-id
```

---

## Getting Started

**1. Install**
```bash
git clone <repo-url>
cd agento
npm install
```

**2. Pull Ollama models** *(skip if using Groq + HuggingFace only)*
```bash
ollama pull llama3
ollama pull nomic-embed-text
```

**3. Configure `.env.local`** — copy the block above and fill in your values.

**4. Run**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Rate Limiting

| User type | Limit |
|---|---|
| Free (default) | 10 AI calls per feature (chat / voice / query) |
| `ADMIN_MAIL` env var | Unlimited |
| Guest | Tracked per public link via `guestCallCount` |
| Research Suite | Not rate-limited (separate from core features) |

What counts: chat message, voice query, Query Genius read/update/delete/analytics. Uploads, schema reads, inserts, and Research Suite usage do not count.

---

## Deployment

```bash
npm run build
npm start
```

**Cloud notes:**
- Set `NEXTAUTH_URL` to your production domain
- Ollama is not available on cloud — Groq + HuggingFace keys required
- Use MongoDB Atlas URI for `MONGO_URI`
- File System Access API (Coding Assistant) requires a browser that supports it (Chrome/Edge 86+, Firefox 111+ with flag)
- The `docx` Word export runs entirely client-side — no server dependency

---

## Known Limitations

- Subscription payments are not wired — plan upgrade buttons send a request email
- Voice requires Web Speech API (Chrome / Edge recommended)
- File System Access API is not available in Safari or Firefox by default
- Research Suite tools are not rate-limited in this version
- In-memory Notebook RAG store resets on server restart (cold sessions need re-upload)

---

## License

Private — pilot release. Not for redistribution.

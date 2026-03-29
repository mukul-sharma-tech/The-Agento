# Agento - AI-Powered Enterprise Assistant

> Pilot v0.2 · Built with Next.js 16, MongoDB, Ollama & Groq

Agento is a multi-tenant AI platform that gives companies an intelligent assistant trained on their own documents. Employees can chat, call, query structured data, and run analytics — all through a single dashboard. Companies can also share a public link so external users access the assistant without any account.

---

## Features

**AI Chat & Voice (Unified)**
Chat and voice are now combined in a single page (`/chat-voice`) with a toggle button in the header. Switch between text and voice mode without leaving the page. Both modes share the same RAG pipeline and session history.

**Voice Call**
Real-time voice interface powered by the browser's Web Speech API. Responses are trimmed for spoken delivery. Mic auto-mutes while the AI is speaking.

**Document Ingestion**
Admins upload PDF, TXT, CSV, MD, or JSON files. Text is chunked, embedded, and stored in MongoDB for semantic retrieval.

**Query Genius**
Natural-language interface over structured MongoDB collections. Upload a CSV, define a schema, then read / insert / update / delete using plain English.

**Data LookUp (Visualizations)**
Dynamic chart generation within Query Genius. Supports two modes:
- **Manual**: Direct control over X/Y axes, aggregation types (Sum, Avg, Min, Max, Count, Raw), and chart types.
- **AI-Powered**: Describe the visualization you want and Agento generates the pipeline and chart automatically.
- **Supported Charts**: Bar, Line, Area, Pie, Scatter.

**Analytics**
Four advanced analytics modes — Descriptive, Diagnostic, Predictive, Prescriptive — each generating a MongoDB aggregation pipeline, an AI-driven insight, and an interactive chart.

**Shareable Public Link**
Company admins can generate a public guest link from the Admin Panel. Anyone with the link can use the AI chat and/or voice assistant without signing up. The link can be embedded as an iframe on any website.

- Admin controls which features (chat, voice) are exposed
- Guest usage is tracked separately per link
- Admin can disable, regenerate, or delete the link at any time
- Guest URL: `https://your-domain.com/guest/<token>`
- Embed snippet provided in the admin panel

**Rate Limiting**
Free tier: 10 AI calls per feature (chat, voice, query). Admin email is exempt. Usage is shown on the dashboard with a progress bar. Upgrade prompts link to the pricing page. Guest users share the company's quota tracked per public link.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Auth | NextAuth v4 (credentials) |
| Database | MongoDB via Mongoose |
| LLM (local) | Ollama (any model) |
| LLM (cloud) | Groq - llama3-70b-8192 |
| Embeddings (local) | Ollama - nomic-embed-text |
| Embeddings (cloud) | HuggingFace - all-MiniLM-L6-v2 |
| Charts | Recharts |
| PDF parsing | unpdf |
| Email | Nodemailer (Gmail SMTP) |

---

## Prerequisites

- Node.js 18+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas URI
- [Ollama](https://ollama.com) installed locally for local LLM + embeddings (optional — Groq/HF work without it)

---

## Getting Started

**1. Clone and install**

```bash
git clone <repo-url>
cd agento
npm install
```

**2. Configure environment**

Copy the example below into `.env.local` and fill in your values:

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
EMAIL_PASS=your_app_password

# Ollama (local - optional)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_EMBEDDING_MODEL=nomic-embed-text:latest

# Groq API keys (cloud LLM fallback - get free keys at console.groq.com)
Groq_API_1=gsk_...
Groq_API_2=gsk_...
Groq_API_3=gsk_...

# HuggingFace (cloud embedding fallback - get token at huggingface.co/settings/tokens)
HF_TOKEN=hf_...
# HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Admin bypass (exempt from rate limits, sees all subscription requests)
ADMIN_MAIL=your-admin-email@gmail.com
NEXT_PUBLIC_ADMIN_MAIL=your-admin-email@gmail.com
```

**3. Pull Ollama models (if using locally)**

```bash
ollama pull llama3
ollama pull nomic-embed-text
```

**4. Run the dev server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## LLM Fallback Chain

Every AI call follows this priority order automatically:

```
Ollama (local, 10s timeout)
  → Groq_API_1
    → Groq_API_2
      → Groq_API_3
        → Error: All providers failed
```

Embeddings follow the same pattern:

```
Ollama nomic-embed-text (768-dim)
  → HuggingFace all-MiniLM-L6-v2 (384-dim)
    → Returns [] - text search fallback kicks in
```

Vectors are tagged with the model that generated them (`embeddingModel` field) so 768-dim and 384-dim vectors are never compared against each other in the same search.

---

## Project Structure

```
app/
  dashboard/          # Main dashboard (combined chat+voice card)
  chat-voice/         # Unified AI Chat + Voice page with tab toggle
  chat/               # Legacy AI Chat page (still accessible)
  voice-call/         # Legacy Voice Call page (still accessible)
  guest/[token]/      # Public guest page (no login required)
  ingest-doc/         # Document upload (admin)
  query-genius/       # Structured data query + analytics
  pricing/            # Pricing page
  admin/              # Admin panel (employees, subscriptions, public link)
  api/
    auth/             # NextAuth + signup/login/reset/verify + public-link
    chat/             # Chat API + session management (guest token support)
    documents/        # Document upload + debug
    query-genius/     # Collections, schema, query, analytics, upload
    guest/validate/   # Public token validation endpoint

components/
  ui/                 # shadcn/ui primitives (Button, Card, Input, Label)
  PricingModal.tsx    # Pricing cards component (modal + inline)
  transition.tsx      # Page transition wrapper

lib/
  db.ts               # MongoDB connection
  llm.ts              # callLLM() + getEmbedding() with fallback chains
  rateLimit.ts        # AI call counter + admin bypass
  guestAuth.ts        # resolveGuestToken() + incrementGuestCallCount()
  email.ts            # Nodemailer helpers
  token.ts            # Token generation
  utils.ts            # cn() utility

models/
  User.ts             # User schema (role, company_id, aiCallCount)
  ChatSession.ts      # Chat session + message history
  Document.ts         # Uploaded document metadata
  VectorChunk.ts      # Embedding chunks (textContent + vectorContent + embeddingModel)
  PublicLink.ts       # Guest public link (token, company_id, enabled, features, guestCallCount)
```

---

## Multi-Tenancy

Every user belongs to a `company_id`. All data (vector chunks, chat sessions, query collections) is scoped to this ID. Employees are verified by their company admin before they can log in.

Query Genius collections are namespaced as `qg_{company_id}_{collection_name}` in MongoDB.

Guest sessions are also scoped to the company via the public link token — guests see only that company's data.

---

## Public Guest Link

Company admins generate a shareable link from **Admin Panel → Public Link tab**.

| Action | Description |
|---|---|
| Generate | Creates a unique token, stored in `public_links` collection |
| Enable / Disable | Toggle access without deleting the link |
| Regenerate | Issues a new token, old link stops working immediately |
| Feature toggles | Choose which features (Chat, Voice) guests can access |
| Delete | Permanently removes the link |

Guest requests pass `x-guest-token: <token>` in headers. All protected API routes fall back to `resolveGuestToken()` if no NextAuth session is present.

**Embedding on a website:**
```html
<iframe
  src="https://your-domain.com/guest/<token>"
  width="100%"
  height="700"
  frameborder="0"
  allow="microphone"
></iframe>
```

---

## Rate Limiting

| User | Limit |
|---|---|
| Free (default) | 10 AI calls per feature (chat / voice / query) |
| `ADMIN_MAIL` | Unlimited |
| Guest | Tracked per public link via `guestCallCount` |

What counts as an AI call: chat message, voice query, Query Genius read/update/delete, analytics run. Uploads, schema reads, and inserts do not count.

---

## Deployment

**Build**

```bash
npm run build
npm start
```

**Environment notes for cloud deployment**

- Set `NEXTAUTH_URL` to your production domain
- Ollama will not be available on cloud — Groq and HuggingFace keys are required
- Use a MongoDB Atlas URI for `MONGO_URI`
- Embedding dimensions differ between Ollama (768) and HuggingFace (384) — existing vectors are tagged and remain compatible

---

## Pilot Limitations

- Payments are not yet wired — plan upgrade buttons are placeholders
- Voice Call requires a browser with Web Speech API support (Chrome recommended)
- Analytics pipeline is LLM-generated — complex queries may need rephrasing
- No file size limit enforced on uploads beyond what the server can process in memory
- Guest voice requires microphone permission in the browser/iframe

---

## License

Private — pilot release. Not for redistribution.

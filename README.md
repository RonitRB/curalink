# Curalink - AI Medical Research Assistant (v2.0)

A full-stack MERN application that acts as a health research companion. It understands user context, retrieves high-quality medical research from multiple sources, reasons over it with an open-source LLM (Llama 3.3-70B via Groq), and delivers structured, source-backed answers.

### ✨ What's New in v2.0
- **Semantic Search (pgvector)**: Understands intent beyond keywords.
- **Drug Interaction Warnings**: OpenFDA integration for automated safety checks.
- **PMC Full-Text**: Ingests full text of open-access PubMed Central articles.
- **Multi-language Support**: Seamless query and response translation across 9 languages.
- **Document Analysis**: Upload medical documents (PDF) to ground the AI research.
- **Export & Analytics**: Visual charts (recharts) and PDF export (jsPDF).
- **Collaborative Sessions**: Generate public read-only links for sharing research.
- **Research Alerts**: Weekly digests for specific disease queries.

---

## Architecture & AI Pipeline

```
User Query + Patient Context
         │
         ▼
┌─────────────────────────┐
│ 1. Query Expansion (LLM)│  → "deep brain stimulation" + "Parkinson's"
│    Llama 3.3-70B / Groq │    → "deep brain stimulation Parkinson's disease neurological outcomes"
└─────────┬───────────────┘
          │ expanded query
          ▼
┌───────────────────────────────────────────────────────┐
│ 2. Parallel Retrieval (50–300 results)                 │
│   ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│   │  PubMed      │  │  OpenAlex    │  │ ClinTrials │ │
│   │  80 articles │  │  100 articles│  │ 50 trials  │ │
│   └──────────────┘  └──────────────┘  └────────────┘ │
└───────────────────────────────────────┬───────────────┘
                                        │ ~230 raw results
                                        ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Re-Ranking + Deduplication                            │
│   Score = Keyword Relevance (40) + Recency (30)          │
│          + Source Credibility (20) + Abstract Quality (10)│
│   → Top 7 publications + Top 5 clinical trials           │
└───────────────────────────────────────┬─────────────────┘
                                        │ 12 top results
                                        ▼
┌─────────────────────────────────────────┐
│ 4. LLM Reasoning (Llama 3.3-70B/Groq)  │
│   System prompt = patient context       │
│                 + top publications      │
│                 + top trials            │
│                 + conversation history  │
│   Output: structured JSON response      │
└───────────────────────────────────────-┘
                    │
                    ▼
    Structured Response:
    ├── Condition Overview
    ├── Research Insights (cited [PUB1], [PUB2]...)
    ├── Source Publications (cards with URL)
    ├── Clinical Trials (status, eligibility, location)
    ├── Personalized Note
    └── Key Takeaways
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite, Recharts, html2canvas, jsPDF |
| Backend | Express.js + Node.js, multer, pdf-parse |
| Database & Auth | Supabase (PostgreSQL + pgvector) |
| LLM | Groq API - `llama-3.3-70b-versatile` (open-source model) |
| Embeddings | HuggingFace Inference API (`all-MiniLM-L6-v2`) |
| APIs | OpenAlex, PubMed NCBI/PMC, ClinicalTrials.gov, OpenFDA |
| Deploy | Vercel (Frontend), Render (Backend) |

> **Why Groq + Llama 3.3-70B?** Groq provides free, ultra-fast cloud inference for open-source model weights (Llama 3.3 by Meta). This satisfies the "no Gemini/OpenAI" requirement while delivering best-in-class reasoning quality.

---

## Project Structure

```
curalink/
├── backend/
│   ├── server.js                    # Express app entry point
│   ├── .env.example                 # Environment variables template
│   ├── render.yaml                  # Render.com deploy config
│   ├── routes/
│   │   ├── chat.js                  # POST /api/chat (main pipeline)
│   │   └── sessions.js              # GET/POST/DELETE /api/sessions
│   └── services/
│       ├── supabase.js              # Supabase admin client setup
│       ├── llmService.js            # Groq API (Llama 3.3-70B)
│       ├── queryExpander.js         # LLM-based query expansion
│       ├── pubmedService.js         # PubMed esearch + efetch pipeline
│       ├── openAlexService.js       # OpenAlex works API
│       ├── clinicalTrialsService.js # ClinicalTrials.gov v2 API
│       ├── ranker.js                # Multi-factor re-ranking engine
│       └── pipelineService.js       # Pipeline orchestrator
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── vercel.json                  # Vercel deploy config
    └── src/
        ├── App.jsx                  # Main layout + session state
        ├── api.js                   # Axios API client
        ├── index.css                # Design system (dark glassmorphism)
        └── components/
            ├── SessionSidebar.jsx   # Session history sidebar
            ├── InputPanel.jsx       # Structured + quick chat input
            ├── MessageCard.jsx      # User bubble + AI response card
            ├── PublicationCard.jsx  # Individual publication card
            └── TrialCard.jsx        # Individual clinical trial card
```

---

## Local Setup

### Prerequisites
- Node.js 18+
- A free [Supabase](https://supabase.com) project
- A free [Groq API key](https://console.groq.com) (Llama 3.3-70B)

### 1. Clone & Install

```bash
# Install backend dependencies
cd curalink/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend** (`curalink/backend/.env`):
```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=ey...
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=http://localhost:5173
PORT=5000
```

**Frontend** (`curalink/frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=ey...
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend
cd curalink/backend
npm run dev

# Terminal 2: Frontend
cd curalink/frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment

### Backend → Render.com
1. Push the `backend/` folder to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `FRONTEND_URL`

### Frontend → Vercel
1. Push the `frontend/` folder to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Set environment variables: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy — Vercel auto-detects Vite

---

## Example Queries to Demo

| Query | Disease | Notes |
|-------|---------|-------|
| Latest treatment for lung cancer | Lung Cancer | Tests publication retrieval |
| Clinical trials for diabetes | Diabetes | Tests ClinicalTrials.gov integration |
| Deep Brain Stimulation outcomes | Parkinson's disease | Tests query expansion |
| Top researchers in Alzheimer's | Alzheimer's disease | Tests OpenAlex author data |
| Can I take Vitamin D? | Lung Cancer | Tests multi-turn context |

---

## API Endpoints

### `POST /api/chat`
Main research pipeline endpoint.

**Request body:**
```json
{
  "message": "Latest treatment for lung cancer",
  "sessionId": "optional-existing-session-id",
  "patientName": "John Smith",
  "disease": "Lung Cancer",
  "location": "Toronto, Canada"
}
```

**Response:**
```json
{
  "sessionId": "uuid",
  "result": {
    "expandedQuery": "lung cancer treatment immunotherapy targeted therapy",
    "llmResponse": {
      "conditionOverview": "...",
      "researchInsights": [...],
      "clinicalTrialsSummary": "...",
      "personalizedNote": "...",
      "keyTakeaways": [...]
    },
    "publications": [...],
    "clinicalTrials": [...],
    "stats": {
      "totalRetrieved": 230,
      "pubmedCount": 80,
      "openAlexCount": 100,
      "clinicalTrialsCount": 50
    }
  }
}
```

### `GET /api/sessions` — List all sessions
### `GET /api/sessions/:id` — Get session with history
### `POST /api/sessions` — Create new session
### `DELETE /api/sessions/:id` — Delete session
### `POST /api/sessions/:id/share` — Create public share link
### `GET /api/sessions/shared/:token` — Read public shared session
### `POST /api/upload` — Upload medical PDF documents
### `GET /api/alerts` — Manage weekly research alerts
### `GET /health` — Health check

---

## Design Decisions

### LLM Choice: Groq (Llama 3.3-70B)
- **Open-source model**: Llama 3.3 weights are fully open (Meta license)
- **Not OpenAI/Gemini**: Satisfies hackathon prohibition
- **Speed**: Groq's LPU delivers ~800 tokens/sec — no cold starts
- **Quality**: 70B parameter model excels at medical reasoning and JSON output

### Retrieval Strategy: Hybrid depth-first
- Retrieves broad candidate pool (230+ results) before filtering
- PubMed prioritized for credibility (score: 20 vs OpenAlex: 15)
- Deduplication by normalized title to avoid showing same paper twice

### Re-ranking: Multi-factor scoring (no vector DB needed)
- TF-style keyword matching (title: 4x weight, abstract: 1x)
- Recency decay: linear falloff over 10 years
- Fast, deterministic, transparent — no embedding API needed

### Multi-turn Context
- Last 6 messages injected into LLM system prompt
- Session stored in Supabase (PostgreSQL) with full metadata per message
- Patient context (disease, name, location) persisted across turns

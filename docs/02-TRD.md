# Document 02 — Technical Requirements Document (TRD)

## Curalink — Technical Architecture

---

### Frontend

| Aspect | Choice |
|--------|--------|
| Framework | **React 19** (via Vite 8) |
| Language | JavaScript (JSX) |
| Styling | Vanilla CSS — custom dark glassmorphism design system |
| Build Tool | Vite 8.0 |
| HTTP Client | Axios |
| Routing | Hash-based routing (lightweight, no react-router for page views) |
| State Management | React hooks (useState, useEffect, useContext) — no Redux |
| Voice Input | Web Speech API (browser native) |

### Backend

| Aspect | Choice |
|--------|--------|
| Runtime | **Node.js 18+** |
| Framework | **Express.js 5** |
| Language | JavaScript (ES Modules) |
| Authentication | **Supabase Auth** (Email/Password, Google OAuth) |
| Session IDs | UUIDv4 |

### Database

| Aspect | Choice |
|--------|--------|
| Database | **Supabase PostgreSQL** |
| ORM/Client | **@supabase/supabase-js** |
| Tables | `users` (auth.users), `sessions`, `bookmarks` |
| Security | Row Level Security (RLS) policies |

### AI / LLM

| Aspect | Choice |
|--------|--------|
| LLM Provider | **Groq** (free cloud inference) |
| Model | **Llama 3.3-70B Versatile** (Meta, open-source) |
| Usage | Query expansion + research reasoning/synthesis |
| Temperature | 0.4 (balanced accuracy/creativity) |
| Max Tokens | 2800 per response |

### Third-Party APIs

| Service | Purpose | Tier |
|---------|---------|------|
| **PubMed / NCBI Entrez** | Biomedical publication search + abstract retrieval | Free (optional API key for higher rate limits) |
| **OpenAlex** | Scholarly works, authors, citations | Free (no key required) |
| **ClinicalTrials.gov v2** | Clinical trial search by condition and location | Free (no key required) |
| **Groq** | LLM inference (Llama 3.3-70B) | Free tier (rate-limited) |

### Hosting & Deployment

| Component | Platform |
|-----------|----------|
| Frontend | **Vercel** (auto-detects Vite) |
| Backend | **Render.com** (Web Service) |
| Database | **Supabase** (PostgreSQL database & Auth) |

### Key Libraries

**Backend:**
- `express` — HTTP server
- `@supabase/supabase-js` — Supabase client
- `axios` — External API calls
- `uuid` — Session ID generation
- `xml2js` — PubMed XML parsing
- `cors` — Cross-origin config
- `dotenv` — Environment variables

**Frontend:**
- `react` / `react-dom` — UI framework
- `axios` — API client
- `react-router-dom` — Available but minimally used (hash routing preferred)

### Environment Variables

**Backend (.env):**
```
SUPABASE_URL         # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY # Supabase service role key for admin operations
GROQ_API_KEY         # Groq API key for Llama 3.3
FRONTEND_URL         # CORS origin (e.g. http://localhost:5173)
PORT                 # Server port (default: 5000)
NCBI_API_KEY         # Optional: higher PubMed rate limits
```

**Frontend (.env):**
```
VITE_API_URL         # Backend API base URL (e.g. http://localhost:5000/api)
VITE_SUPABASE_URL    # Supabase project URL
VITE_SUPABASE_ANON_KEY # Supabase anon key
```

### Security Measures

- Supabase Auth (JWT validation on backend routes)
- Database Row Level Security (RLS)
- Rate limiting (API: 30/min, chat: 10/min)
- Input sanitization (HTML stripping)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- User-scoped data access (handled by RLS and backend filters)
- CORS restricted to explicit frontend URL

### Constraints

- Must work on mobile (375px+ viewport)
- Must use open-source LLM (no OpenAI / Google Gemini API)
- Must operate within free tiers of all services
- No server-side rendering (SPA only)
- Must comply with Indian IT Act 2000 and DPDPA 2023

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
| Authentication | **JWT** (jsonwebtoken) + **bcryptjs** for password hashing |
| Session IDs | UUIDv4 (uuid package) |

### Database

| Aspect | Choice |
|--------|--------|
| Database | **MongoDB Atlas** (cloud-hosted) |
| ODM | **Mongoose 9** |
| Collections | `users`, `sessions`, `bookmarks` |
| Indexing | `users.email`, `sessions.sessionId + userId`, `bookmarks.userId + createdAt` |

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
| Database | **MongoDB Atlas** (free M0 cluster) |

### Key Libraries

**Backend:**
- `express` — HTTP server
- `mongoose` — MongoDB ODM
- `jsonwebtoken` — JWT auth
- `bcryptjs` — Password hashing
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
MONGODB_URI          # MongoDB Atlas connection string
GROQ_API_KEY         # Groq API key for Llama 3.3
JWT_SECRET           # JWT signing secret (min 32 chars)
FRONTEND_URL         # CORS origin (e.g. http://localhost:5173)
PORT                 # Server port (default: 5000)
NCBI_API_KEY         # Optional: higher PubMed rate limits
```

**Frontend (.env):**
```
VITE_API_URL         # Backend API base URL (e.g. http://localhost:5000/api)
```

### Security Measures

- JWT authentication on all protected routes
- Password hashing with bcrypt (salt rounds: 12)
- Rate limiting (auth: 5/min, API: 30/min, chat: 10/min)
- Input sanitization (HTML stripping, NoSQL injection prevention)
- Security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- User-scoped data access (all queries filtered by userId)
- CORS restricted to explicit frontend URL

### Constraints

- Must work on mobile (375px+ viewport)
- Must use open-source LLM (no OpenAI / Google Gemini API)
- Must operate within free tiers of all services
- No server-side rendering (SPA only)
- Must comply with Indian IT Act 2000 and DPDPA 2023

# Document 06 — Implementation Plan

## Curalink — Step-by-Step Build Sequence

---

### Phase 1: Project Setup
**Goal**: Repository initialized, dependencies installed, environment configured.

- [ ] Initialize backend with `npm init` and set `"type": "module"`
- [ ] Install backend dependencies: express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv, axios, uuid, xml2js
- [ ] Initialize frontend with Vite + React template
- [ ] Install frontend dependencies: axios, react-router-dom
- [ ] Create `.env.example` files for both backend and frontend
- [ ] Set up `.gitignore` (node_modules, .env, dist)
- [ ] Create folder structure:
  ```
  backend/
  ├── server.js
  ├── middleware/ (auth.js, rateLimit.js, sanitize.js)
  ├── models/ (User.js, Session.js, Bookmark.js)
  ├── routes/ (auth.js, chat.js, sessions.js, bookmarks.js)
  └── services/ (llmService.js, queryExpander.js, pubmedService.js, openAlexService.js, clinicalTrialsService.js, ranker.js, pipelineService.js)

  frontend/src/
  ├── main.jsx
  ├── App.jsx
  ├── api.js
  ├── index.css
  ├── contexts/ (AuthContext.jsx)
  └── components/ (AuthPage, SessionSidebar, InputPanel, MessageCard, PublicationCard, TrialCard, AnalyticsDashboard, ExportButton, PrivacyPolicy, CookieConsent, Accessibility)
  ```

**Done when**: Both `npm install` complete without errors, env files documented.

---

### Phase 2: Database Schema
**Goal**: MongoDB models defined with proper indexes and validation.

- [ ] Define `User` model with email uniqueness, password hashing (bcrypt, 12 rounds), and `toJSON` sanitization
- [ ] Define `Session` model with embedded `Message`, `Publication`, and `Trial` subdocuments
- [ ] Define `Bookmark` model with compound unique index (userId + sessionId + messageIndex)
- [ ] Add indexes: `users.email`, `sessions.sessionId`, `sessions.userId`, `bookmarks.userId + createdAt`
- [ ] Test MongoDB Atlas connection

**Done when**: All three models load without errors and indexes are created.

---

### Phase 3: Authentication
**Goal**: Secure signup/login with JWT, protected route middleware.

- [ ] Implement `POST /api/auth/register` with password strength validation (8+ chars, uppercase, lowercase, number)
- [ ] Implement `POST /api/auth/login` with generic error messages (prevent email enumeration)
- [ ] Implement `GET /api/auth/me` for session restoration
- [ ] Create JWT auth middleware — require `JWT_SECRET` env var, fail on startup if missing
- [ ] Create rate limiter middleware (auth: 5/min, API: 30/min, chat: 10/min)
- [ ] Create input sanitization middleware (HTML stripping, NoSQL injection prevention)
- [ ] Add security headers middleware (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Wire all middleware into Express app

**Done when**: Register, login, and token verification work. Rate limiting blocks after threshold. Malicious input is stripped.

---

### Phase 4: AI Research Pipeline (Core Feature)
**Goal**: Full research pipeline from query to structured response.

- [ ] Implement `queryExpander.js` — LLM-based query enrichment via Groq
- [ ] Implement `pubmedService.js` — PubMed E-utilities search + fetch pipeline
- [ ] Implement `openAlexService.js` — OpenAlex works API integration
- [ ] Implement `clinicalTrialsService.js` — ClinicalTrials.gov v2 API
- [ ] Implement `ranker.js` — multi-factor scoring: keyword (40%), recency (30%), credibility (20%), quality (10%)
- [ ] Implement `llmService.js` — Groq API wrapper for Llama 3.3-70B
- [ ] Implement `pipelineService.js` — orchestrator: expand → retrieve → rank → reason
- [ ] Implement `POST /api/chat` route with session creation/update, user-scoping, and input validation

**Done when**: A research query returns structured JSON with publications, trials, and LLM synthesis.

---

### Phase 5: Session & Bookmark Management
**Goal**: CRUD operations for sessions and bookmarks, user-scoped.

- [ ] Implement session routes: list, get, create, update, delete (all user-scoped)
- [ ] Implement stats/overview endpoint for analytics
- [ ] Implement bookmark routes: list, create, delete (with session ownership verification)
- [ ] Add input length truncation on all create/update endpoints

**Done when**: All CRUD operations work. User A cannot access User B's data via any endpoint.

---

### Phase 6: Frontend — Auth & Layout
**Goal**: Login/register UI, app shell with sidebar and header.

- [ ] Create design system in `index.css` — colors, typography, glassmorphism tokens, animations
- [ ] Create `AuthContext` with login, register, logout, forced-logout listener
- [ ] Create `api.js` with Axios instance, token management, interceptors
- [ ] Create `AuthPage` with login/register form, password visibility toggle, error handling
- [ ] Create `App.jsx` shell with sidebar, header, and chat area layout
- [ ] Create `SessionSidebar` with session list, bookmarks tab, search, user profile, logout

**Done when**: Users can register, login, see sidebar with sessions, and logout.

---

### Phase 7: Frontend — Chat Interface
**Goal**: Full research interaction flow with structured responses.

- [ ] Create `InputPanel` with structured form (6 fields) and quick chat mode
- [ ] Add voice input via Web Speech API
- [ ] Create `MessageCard` with user bubbles and AI response cards
- [ ] Create structured AI response sections: overview, insights, publications, trials, personalized note, takeaways
- [ ] Create `PublicationCard` and `TrialCard` components
- [ ] Create `ExportButton` with copy, export, and share functionality
- [ ] Add bookmark button on AI responses
- [ ] Implement typing indicator and loading states
- [ ] Add toast notifications for success/error feedback
- [ ] Add keyboard shortcuts (Ctrl+N, Ctrl+K)

**Done when**: Full research flow works — input → loading → structured response with all sections.

---

### Phase 8: Frontend — Analytics & Polish
**Goal**: Dashboard, responsive design, edge cases.

- [ ] Create `AnalyticsDashboard` with stats cards, activity heatmap, top diseases chart
- [ ] Ensure full mobile responsiveness (375px+)
- [ ] Implement all empty states (no sessions, no bookmarks, no data)
- [ ] Implement all error states with user-friendly messages
- [ ] Add collapsible sections with smooth animations
- [ ] Add welcome screen with example query chips
- [ ] Polish scroll behavior, transitions, hover states

**Done when**: Dashboard shows real data. App works on mobile. All empty/error states handled.

---

### Phase 9: Legal & Compliance
**Goal**: Privacy Policy, Cookie Consent, and Accessibility pages per Indian law.

- [ ] Create `PrivacyPolicy.jsx` — IT Act 2000, DPDPA 2023 compliant
- [ ] Create `CookieConsent.jsx` — non-intrusive banner with accept/decline
- [ ] Create `Accessibility.jsx` — WCAG 2.1 AA accessibility statement
- [ ] Add footer links in App.jsx to legal pages
- [ ] Add hash-based routing for legal pages
- [ ] Style legal pages to match app design
- [ ] Add ARIA labels and keyboard navigation to all interactive elements

**Done when**: All three legal pages accessible, cookie consent works, accessibility features verified.

---

### Phase 10: Deploy
**Goal**: Production deployment with proper configuration.

- [ ] Build frontend: `npm run build`
- [ ] Deploy backend to Render.com with env vars: `MONGODB_URI`, `GROQ_API_KEY`, `JWT_SECRET`, `FRONTEND_URL`
- [ ] Deploy frontend to Vercel with env var: `VITE_API_URL`
- [ ] Verify CORS works between deployed frontend and backend
- [ ] Test all flows end-to-end in production
- [ ] Verify rate limiting works in production
- [ ] Check security headers in browser DevTools

**Done when**: Full app works in production. All security measures verified. All legal pages accessible.

---

### Done Criteria (Overall)

- [ ] Two different users cannot see each other's sessions, chats, or bookmarks
- [ ] Rate limiting blocks brute-force auth attempts
- [ ] HTML/script tags are stripped from all inputs
- [ ] No internal error messages are leaked to the client
- [ ] All 6 project documents are complete and accurate
- [ ] Privacy Policy, Cookie Consent, and Accessibility pages are live
- [ ] App builds without errors
- [ ] App works on mobile devices

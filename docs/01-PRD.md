# Document 01 — Product Requirements Document (PRD)

## Curalink — AI Medical Research Assistant

---

### App Name
**Curalink**

### Tagline
AI-powered medical research assistant that retrieves, ranks, and reasons over publications and clinical trials to deliver structured, source-backed health insights.

---

### Problem
Medical professionals, patients, and caregivers need fast access to the latest research for specific conditions. Searching PubMed, OpenAlex, and ClinicalTrials.gov individually is time-consuming and overwhelming. Raw results lack synthesis — users must read dozens of abstracts to extract actionable insights. There is no free, open-source tool that retrieves from multiple sources, re-ranks results, and generates structured, citation-backed summaries with AI reasoning.

### Target User
**Primary**: Medical researchers, clinicians, and healthcare students who need structured literature reviews quickly. They are comfortable reading scientific abstracts but want AI to synthesize findings across sources.

**Secondary**: Patients and caregivers researching a specific diagnosis. They want plain-language summaries with reliable source links and relevant clinical trials near their location.

**Tertiary**: Health-tech builders and indie developers looking for an open-source medical AI platform to build upon.

---

### Core Features (Must Have)

1. **Structured Research Input** — Patient name, disease/condition, location, age, gender fields for personalized context
2. **Quick Chat Mode** — Free-form text input for follow-up questions within a session
3. **AI Query Expansion** — LLM-powered query enrichment using disease context (Llama 3.3-70B via Groq)
4. **Multi-Source Retrieval** — Parallel fetching from PubMed (80 articles), OpenAlex (100 articles), ClinicalTrials.gov (50 trials)
5. **Re-Ranking Engine** — Multi-factor scoring: keyword relevance (40%), recency (30%), source credibility (20%), abstract quality (10%)
6. **LLM Reasoning** — Structured JSON response with condition overview, research insights with citations, clinical trials summary, personalized note, key takeaways
7. **Session Management** — Create, list, select, rename, and delete research sessions with full message history
8. **User Authentication** — Secure signup/login with JWT tokens and bcrypt password hashing
9. **Bookmarks** — Save important AI responses for quick access
10. **Analytics Dashboard** — Research activity heatmap, top diseases chart, session/message counts
11. **Voice Input** — Web Speech API integration for hands-free query input
12. **Export & Share** — Copy research to clipboard, export to text, share functionality

### Nice to Have (v2)

- PDF export of research sessions
- Email digest of bookmarked research
- Collaborative sessions (share with team)
- PubMed Central full-text retrieval
- Drug interaction checker
- Multi-language support
- OAuth login (Google, institutional SSO)
- Research citation generator (APA, MLA, Vancouver)

### Out of Scope (v1)

- Medical diagnosis or treatment recommendations (Curalink is a research tool, not a diagnostic tool)
- Electronic health records (EHR) integration
- Real-time collaboration between users
- Mobile native apps (iOS/Android)
- HIPAA compliance certification (though security best practices are followed)
- Image or radiology analysis

---

### User Stories

1. As a **medical researcher**, I want to enter a disease and research question so that I get a synthesized overview with cited publications from multiple databases.
2. As a **patient**, I want to find clinical trials near my location so that I can discuss enrollment options with my doctor.
3. As a **clinician**, I want to ask follow-up questions in the same session so that the AI maintains context about my patient.
4. As a **healthcare student**, I want to bookmark research responses so that I can review them later for my studies.
5. As a **returning user**, I want to see my research history in a sidebar so that I can continue where I left off.
6. As a **privacy-conscious user**, I want my research sessions to be visible only to me so that other users cannot access my data.
7. As a **mobile user**, I want the interface to be responsive so that I can research on my phone.
8. As a **power user**, I want keyboard shortcuts (Ctrl+N for new chat, Ctrl+K for sidebar) so that I can work faster.

---

### Success Metrics

| Metric | Target |
|--------|--------|
| User registration rate | 100 signups in first month |
| Session completion rate | > 70% of sessions receive AI response |
| Average sources retrieved per query | > 100 |
| Research pipeline response time | < 30 seconds |
| User retention (7-day) | > 40% |
| Bookmark usage | > 20% of users bookmark at least one response |
| Mobile responsiveness | Fully usable on 375px+ screens |

---

### Medical Disclaimer
Curalink is a research tool, not a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for medical decisions.

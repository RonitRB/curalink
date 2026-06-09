# Document 03 — App Flow (Navigation & User Journey Map)

## Curalink — Every Page, Every Click, Every Path

---

### Pages List

| Path | Page | Auth Required | Description |
|------|------|:---:|-------------|
| `/` | Auth Page / Main App | No / Yes | Login/register form (unauthenticated) or main chat interface (authenticated) |
| `/#/privacy` | Privacy Policy | No | Legal privacy policy page |
| `/#/accessibility` | Accessibility Statement | No | Accessibility compliance page |
| Main view: Chat | Chat Interface | Yes | Research input + AI response messages |
| Main view: Dashboard | Analytics Dashboard | Yes | Usage stats, activity heatmap, top diseases |

### Navigation Type

- **Desktop**: Left sidebar (280px, collapsible) + top header bar
- **Mobile**: Slide-in sidebar with backdrop overlay + top header with hamburger toggle
- **Keyboard**: Ctrl+N (new chat), Ctrl+K (toggle sidebar)

---

### First Screen

**New visitor (not logged in):**
1. Sees the Auth Page with animated dark background (floating orbs, grid pattern)
2. Login form is shown by default with toggle to "Create Account"
3. Features badges at bottom: "🔒 Secure & Private", "🧬 AI-Powered Research", "📊 Multi-Source Data"

**Returning visitor (has valid token):**
1. Token is validated via `GET /api/auth/me`
2. If valid → main app loads immediately
3. If expired → redirected to Auth Page with clean state

---

### Auth Flow

```
Landing → Auth Page
              ├── Google Sign-In → Supabase OAuth → Success → Main App (Chat)
              │
              ├── Login Form → Supabase Email Login → Success → Main App (Chat)
              │                                     → Failure → Error message
              │
              └── Register Form → Supabase Signup → Success → Main App (Chat)
                                                  → Failure → Error message
```

**Post-auth redirect:** Always → Main App (empty chat with welcome screen)

**Logout flow:** Click logout button in sidebar → Supabase Sign Out → Auth Page

**Forced logout:** 401 API response / invalid session → Auth state cleared → Auth Page

---

### Core User Journey 1: Structured Research

```
1. User lands on Main App (welcome screen with DNA icon animation)
2. Sees structured input form with fields:
   - Patient Name (optional)
   - Disease/Condition (optional)
   - Research Query (required) — with voice input button
   - Location (optional)
   - Age (optional)
   - Gender (optional)
3. User fills in fields and clicks "Run Research"
4. Loading state: typing indicator ("Curalink is researching…")
5. AI response card appears with:
   ├── Header: badge, expanded query, source count
   ├── Action bar: Copy, Export, Share, Bookmark, reading time
   ├── Condition Overview (always open)
   ├── Research Insights with citations (collapsible, open by default)
   ├── Source Publications (collapsible, closed by default)
   ├── Clinical Trials with summary (collapsible, closed by default)
   ├── Personalized Note
   └── Key Takeaways
6. Session appears in sidebar under "Recent Sessions"
7. User can ask follow-up questions (session context maintained)
```

### Core User Journey 2: Quick Chat Follow-up

```
1. User switches to "Quick Chat" tab in input panel
2. Types a follow-up question (or uses voice)
3. Textarea supports Enter to send, Shift+Enter for newline
4. Response maintains session context (disease, patient name, location)
5. Chat scrolls to bottom automatically
```

### Core User Journey 3: Session Management

```
1. User clicks session in sidebar → Full history loads
2. User clicks "New Research Session" → Chat clears, new session
3. User clicks ✕ on session → Session deleted, chat cleared if active
4. User searches sessions by disease or patient name
5. User switches between "Sessions" and "Saved" tabs in sidebar
```

### Core User Journey 4: Bookmarks

```
1. User clicks "Save" button on any AI response
2. Bookmark appears in sidebar "Saved" tab
3. User clicks bookmark → Loads the full session containing that response
4. User clicks ✕ on bookmark → Bookmark removed (session remains)
```

### Core User Journey 5: Analytics Dashboard

```
1. User clicks "Dashboard" button in sidebar footer
2. Dashboard replaces chat area with:
   ├── Stats cards: sessions, messages, conditions, member since
   ├── Activity heatmap (last 30 days)
   └── Top researched conditions bar chart
3. User clicks ✕ to return to chat
```

---

### Empty States

| Location | State | Display |
|----------|-------|---------|
| Chat area (no messages) | Welcome screen | DNA animation, headline, description, example query chips, keyboard shortcuts |
| Sidebar (no sessions) | No sessions | "⬡ No sessions yet. Start a research query below." |
| Sidebar (no bookmarks) | No bookmarks | "🔖 No bookmarks yet. Save research responses for quick access." |
| Sidebar (search, no match) | No search results | "No matching sessions." |
| Dashboard (no data) | No analytics | "No data available yet. Start researching!" |

### Error States

| Scenario | Behavior |
|----------|----------|
| API request fails | Error bubble in chat: red-tinted message with warning icon |
| Session load fails | Error message: "Failed to load session." |
| Login fails (wrong credentials) | Form error: "Invalid email or password." |
| Register fails (duplicate email) | Form error: "An account with this email already exists." |
| Register fails (weak password) | Form error: "Password must contain at least one uppercase letter, one lowercase letter, and one number." |
| Network error | Toast: error type with message |
| Rate limited | 429 error displayed as toast |
| Token expired mid-session | Auto-redirect to login page |

### Loading States

| Location | Indicator |
|----------|-----------|
| App startup | Centered card with bouncing dots + "Loading Curalink..." |
| Research in progress | Typing indicator with 3 bouncing dots + "Curalink is researching…" |
| Auth form submitting | Spinning circle + "Signing in…" / "Creating account…" |
| Dashboard loading | Bouncing dots + "Loading analytics..." |
| Submit button | Spinning circle + "Researching…" text |

---

### Redirects

| Action | Destination |
|--------|-------------|
| Successful login/register | Main App (welcome screen) |
| Logout | Auth Page (login form) |
| Token expired (401) | Auth Page (login form) |
| Select session from sidebar | Chat loads that session |
| Click "New Research Session" | Chat clears to welcome screen |
| Click "Dashboard" | Dashboard view replaces chat |
| Close dashboard | Return to last chat state |

---

### Cookie Consent Flow

```
1. First visit → Cookie consent banner slides up from bottom
2. User clicks "Accept" → Consent stored in localStorage, banner dismissed
3. User clicks "Decline" → Only essential storage used, banner dismissed
4. Subsequent visits → Banner not shown if consent already given
```

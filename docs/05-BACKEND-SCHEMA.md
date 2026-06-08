# Document 05 — Backend Schema

## Curalink — Data Model & Auth Architecture

---

### Database

**MongoDB Atlas** (NoSQL document database) via **Mongoose 9** ODM.

Database name: `curalink`

---

### Collection: `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Auto-generated, primary key | MongoDB document ID |
| `name` | String | Required, trim, 2–50 chars | User's full name |
| `email` | String | Required, unique, lowercase, trim, regex-validated | Login email address |
| `password` | String | Required, min 8 chars (stored as bcrypt hash, salt=12) | Hashed password |
| `createdAt` | Date | Auto (timestamps: true) | Account creation time |
| `updatedAt` | Date | Auto (timestamps: true) | Last account update |

**Indexes:**
- `{ email: 1 }` — unique, for fast login lookups

**Security:**
- Password is hashed via `bcryptjs` (12 salt rounds) in a `pre('save')` hook
- Password is stripped from JSON output via `toJSON()` override
- `comparePassword()` instance method for login verification

---

### Collection: `sessions`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Auto-generated | MongoDB document ID |
| `sessionId` | String | Required, unique, indexed | UUIDv4 session identifier |
| `userId` | ObjectId | Required, indexed, ref → `users` | Owner of this session |
| `patientName` | String | Default: '' | Patient name context |
| `disease` | String | Default: '' | Primary disease/condition |
| `location` | String | Default: '' | Patient location |
| `age` | String | Default: '' | Patient age |
| `gender` | String | Default: '' | Patient gender |
| `messages` | Array of `Message` | Embedded subdocuments | Full conversation history |
| `createdAt` | Date | Auto (timestamps: true) | Session creation time |
| `updatedAt` | Date | Auto (timestamps: true) | Last message time |

**Indexes:**
- `{ sessionId: 1 }` — unique, for direct session lookup
- `{ userId: 1 }` — for listing user's sessions

#### Embedded: `Message` subdocument

| Field | Type | Description |
|-------|------|-------------|
| `role` | String (enum: 'user', 'assistant') | Message sender |
| `content` | String (required) | Message text |
| `metadata.publications` | Array of `Publication` | Retrieved publications (assistant only) |
| `metadata.clinicalTrials` | Array of `Trial` | Retrieved trials (assistant only) |
| `metadata.expandedQuery` | String | LLM-expanded query |
| `metadata.llmResponse` | Mixed (JSON) | Full structured LLM response |
| `metadata.stats` | Mixed (JSON) | Retrieval statistics |
| `timestamp` | Date | Message timestamp |

#### Embedded: `Publication` subdocument

| Field | Type |
|-------|------|
| `id` | String |
| `title` | String |
| `abstract` | String |
| `authors` | Array of String |
| `year` | Number |
| `source` | String ('PubMed' / 'OpenAlex') |
| `url` | String |
| `finalScore` | Number |

#### Embedded: `Trial` subdocument

| Field | Type |
|-------|------|
| `id` | String |
| `title` | String |
| `status` | String |
| `briefSummary` | String |
| `eligibilityCriteria` | String |
| `minAge` | String |
| `maxAge` | String |
| `location` | String |
| `contactInfo` | String |
| `url` | String |
| `finalScore` | Number |

---

### Collection: `bookmarks`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `_id` | ObjectId | Auto-generated | MongoDB document ID |
| `userId` | ObjectId | Required, indexed, ref → `users` | Bookmark owner |
| `sessionId` | String | Required | Reference to session |
| `messageIndex` | Number | Required | Index of bookmarked message in session |
| `title` | String | Default: 'Untitled Research' | Display title |
| `disease` | String | Default: '' | Disease tag |
| `preview` | String | Default: '' | Text preview |
| `createdAt` | Date | Auto (timestamps: true) | Bookmark creation |
| `updatedAt` | Date | Auto (timestamps: true) | Last update |

**Indexes:**
- `{ userId: 1, createdAt: -1 }` — for listing user's bookmarks (newest first)
- `{ userId: 1, sessionId: 1, messageIndex: 1 }` — unique compound, prevents duplicate bookmarks

---

### Relationships

```
users._id ←──── sessions.userId     (one-to-many: user has many sessions)
users._id ←──── bookmarks.userId    (one-to-many: user has many bookmarks)
sessions.sessionId ←── bookmarks.sessionId  (many-to-one: bookmark references a session)
```

---

### Authentication Architecture

| Component | Implementation |
|-----------|---------------|
| **Strategy** | Stateless JWT (JSON Web Tokens) |
| **Token Storage** | Client-side `localStorage` |
| **Token Payload** | `{ id, email, name }` |
| **Token Expiry** | 7 days |
| **Signing Algorithm** | HS256 (HMAC-SHA256) |
| **Secret** | `JWT_SECRET` env var (required, min 32 chars recommended) |
| **Password Hashing** | bcryptjs with 12 salt rounds |

### Row-Level Security (MongoDB Equivalent)

MongoDB doesn't have built-in RLS like PostgreSQL. Security is enforced at the **application layer**:

| Rule | Implementation |
|------|----------------|
| Users can only read their own sessions | All session queries include `{ userId: req.user.id }` |
| Users can only modify their own sessions | Update/delete queries include `{ userId: req.user.id }` |
| Users can only read their own bookmarks | All bookmark queries include `{ userId: req.user.id }` |
| Users can only bookmark their own sessions | `POST /bookmarks` verifies session ownership before creation |
| Password never exposed | `toJSON()` strips password field from User documents |

### User Roles

| Role | Access |
|------|--------|
| **user** (default) | Full access to own sessions, bookmarks, and analytics |
| **admin** | Not implemented in v1 — future: manage users, view system stats |

---

### Sensitive Fields

| Field | Protection |
|-------|------------|
| `users.password` | Bcrypt-hashed (12 rounds), stripped from API responses |
| `users.email` | Stored lowercase, only visible to the user themselves |
| JWT token | Stored in localStorage, transmitted via `Authorization: Bearer` header |
| `JWT_SECRET` | Server-side env var only, never exposed |
| Patient data (name, disease, age) | Stored in session, accessible only by session owner |

---

### API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| POST | `/api/auth/register` | ✗ | Create account |
| POST | `/api/auth/login` | ✗ | Login, get JWT |
| GET | `/api/auth/me` | ✓ | Get current user profile |
| POST | `/api/chat` | ✓ | Run research pipeline |
| GET | `/api/sessions` | ✓ | List user's sessions |
| GET | `/api/sessions/stats/overview` | ✓ | Get analytics data |
| GET | `/api/sessions/:id` | ✓ | Get session with history |
| POST | `/api/sessions` | ✓ | Create new session |
| PUT | `/api/sessions/:id` | ✓ | Update session metadata |
| DELETE | `/api/sessions/:id` | ✓ | Delete session |
| GET | `/api/bookmarks` | ✓ | List user's bookmarks |
| POST | `/api/bookmarks` | ✓ | Create bookmark |
| DELETE | `/api/bookmarks/:id` | ✓ | Delete bookmark |
| GET | `/health` | ✗ | Health check |

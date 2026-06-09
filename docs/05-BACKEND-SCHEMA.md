# Document 05 — Backend Schema

## Curalink — Data Model & Auth Architecture

---

### Database

**Supabase PostgreSQL** relational database.

---

### Table: `users` (managed by Supabase Auth)

Supabase handles the `auth.users` table automatically. We use this table to manage authentication via Email/Password and Google OAuth.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `email` | String | User's email address |
| `encrypted_password` | String | Hashed password |
| `created_at` | Timestamp | Account creation time |

---

### Table: `sessions`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key, default gen_random_uuid() | Database ID |
| `session_id` | String | Unique, Not Null | App-level UUIDv4 session identifier |
| `user_id` | UUID | Foreign Key -> `auth.users(id)` | Owner of this session |
| `patient_name` | String | | Patient name context |
| `disease` | String | | Primary disease/condition |
| `location` | String | | Patient location |
| `age` | String | | Patient age |
| `gender` | String | | Patient gender |
| `messages` | JSONB | Not Null, Default '[]'::jsonb | Full conversation history |
| `is_public` | Boolean | Default false | Whether session is shared |
| `share_token` | String | Nullable | UUID for public sharing |
| `created_at` | Timestamp | Default now() | Session creation time |
| `updated_at` | Timestamp | Default now() | Last message time |

---

### Table: `bookmarks`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key, default gen_random_uuid() | Database ID |
| `user_id` | UUID | Foreign Key -> `auth.users(id)` | Bookmark owner |
| `session_id` | String | Not Null | Reference to session `session_id` |
| `message_index` | Integer | Not Null | Index of bookmarked message |
| `title` | String | Default 'Untitled Research' | Display title |
| `disease` | String | | Disease tag |
| `preview` | String | | Text preview |
| `created_at` | Timestamp | Default now() | Bookmark creation |
| `updated_at` | Timestamp | Default now() | Last update |

**Indexes:**
- Unique constraint on `(user_id, session_id, message_index)` prevents duplicate bookmarks.

---

### Table: `alerts`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | Database ID |
| `user_id` | UUID | Foreign Key -> `auth.users(id)` | Alert owner |
| `disease` | String | Not Null | Disease/Condition to monitor |
| `query` | String | | Search query for literature |
| `is_active` | Boolean | Default true | Is alert active |
| `frequency` | String | Default 'weekly' | Alert frequency |
| `created_at` | Timestamp | Default now() | Creation time |

---

### Table: `article_embeddings` (pgvector)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary key | Database ID |
| `title` | String | Not Null | Publication title |
| `abstract` | Text | | Publication abstract |
| `embedding` | Vector(384) | Not Null | pgvector semantic embedding |
| `metadata` | JSONB | | Additional pub data (authors, year) |
| `created_at` | Timestamp | Default now() | Insertion time |

---

### Relationships

```
auth.users.id ←──── sessions.user_id     (one-to-many: user has many sessions)
auth.users.id ←──── bookmarks.user_id    (one-to-many: user has many bookmarks)
sessions.session_id ←── bookmarks.session_id  (many-to-one: bookmark references a session)
```

---

### Authentication Architecture

| Component | Implementation |
|-----------|---------------|
| **Strategy** | Supabase Auth (Email/Password, Google OAuth) |
| **Token Storage** | Client-side via `@supabase/supabase-js` |
| **Token Payload** | Supabase JWT |
| **Backend Validation**| Supabase client token verification |

### Row-Level Security (RLS)

Security is enforced at the database layer using PostgreSQL Row Level Security (RLS):

| Rule | Implementation |
|------|----------------|
| Users can only read their own sessions | `create policy "Users can view own sessions" on sessions for select using (auth.uid() = user_id);` |
| Users can only modify their own sessions | `create policy "Users can modify own sessions" on sessions for update/insert/delete using (auth.uid() = user_id);` |
| Users can only read their own bookmarks | `create policy "Users can view own bookmarks" on bookmarks for select using (auth.uid() = user_id);` |
| Users can only modify their own bookmarks | `create policy "Users can modify own bookmarks" on bookmarks for update/insert/delete using (auth.uid() = user_id);` |

---

### API Endpoints

Authentication is handled directly by Supabase on the frontend. The backend verifies the Supabase token for API access.

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
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
| POST | `/api/sessions/:id/share` | ✓ | Generate share link |
| DELETE | `/api/sessions/:id/share`| ✓ | Revoke share link |
| GET | `/api/sessions/shared/:token`| ✗ | Read shared session |
| GET | `/api/alerts` | ✓ | List user's alerts |
| POST | `/api/alerts` | ✓ | Create new alert |
| PATCH | `/api/alerts/:id` | ✓ | Toggle alert status |
| DELETE | `/api/alerts/:id` | ✓ | Delete alert |
| POST | `/api/upload` | ✓ | Upload medical document |
| GET | `/health` | ✗ | Health check |

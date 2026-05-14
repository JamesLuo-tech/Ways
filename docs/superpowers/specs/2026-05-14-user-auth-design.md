# User Authentication Design

**Date:** 2026-05-14
**Scope:** Email/password registration and login with JWT access tokens. Read operations remain public; write operations require authentication.
**Approach:** FastAPI self-hosted JWT — no third-party auth services.

---

## Goals

- Users can register with email + password + display name
- Users can log in and receive a JWT access token (7-day expiry)
- `GET /api/auth/me` returns the current user's profile
- Existing GET endpoints remain fully public (no auth required)
- Future write endpoints use `Depends(get_current_user)` to require auth
- Passwords stored as bcrypt hashes — never plaintext

## Non-Goals (deferred)

- Refresh tokens
- Email verification
- Password reset flow
- Google / Apple OAuth
- Role-based permissions

---

## Database Schema

### `users` table

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Primary key, auto-generated |
| `email` | VARCHAR UNIQUE NOT NULL | Login identifier |
| `hashed_password` | VARCHAR NOT NULL | bcrypt hash |
| `display_name` | VARCHAR NOT NULL | Shown in UI |
| `avatar_url` | VARCHAR NULL | Profile photo URL |
| `bio` | VARCHAR NULL | Short bio |
| `home_base` | VARCHAR NULL | City / base location |
| `created_at` | TIMESTAMP WITH TIME ZONE | Default: now() |

---

## API Endpoints

### POST /api/auth/register

Request:
```json
{ "email": "user@example.com", "password": "...", "displayName": "Annie" }
```

Response 201:
```json
{ "accessToken": "eyJ...", "tokenType": "bearer" }
```

Errors: 400 if email already registered.

### POST /api/auth/login

Request:
```json
{ "email": "user@example.com", "password": "..." }
```

Response 200:
```json
{ "accessToken": "eyJ...", "tokenType": "bearer" }
```

Errors: 401 if email not found or wrong password.

### GET /api/auth/me

Header: `Authorization: Bearer <token>`

Response 200:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "Annie",
  "avatarUrl": null,
  "bio": null,
  "homeBase": null,
  "createdAt": "2026-05-14T..."
}
```

Errors: 401 if token missing or invalid.

---

## JWT Flow

- Library: `python-jose[cryptography]`
- Algorithm: HS256
- Expiry: 7 days (`exp` claim)
- Payload: `{ "sub": "<user_uuid>", "email": "<email>" }`
- Secret: `JWT_SECRET` environment variable (required)
- Transport: `Authorization: Bearer <token>` header only (no cookies)

---

## File Structure

**Create:**
- `server/api/auth.py` — register, login, me route handlers
- `server/schemas/auth.py` — RegisterRequest, LoginRequest, TokenResponse, UserResponse Pydantic models
- `server/alembic/versions/002_add_users.py` — creates users table

**Modify:**
- `server/db/models.py` — add `User` ORM model
- `server/db/engine.py` — add `get_current_user` dependency
- `server/main.py` — include auth router
- `server/requirements.txt` — add python-jose[cryptography], passlib[bcrypt]
- `.env` — add `JWT_SECRET`
- `tests/test_auth_api.py` — auth endpoint tests

---

## get_current_user Dependency

```python
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    # decode JWT → get user_id → load from DB → return User
    # raises HTTP 401 on any failure
```

Lives in `server/db/engine.py` alongside `get_db`.

---

## Error Handling

| Scenario | Status | Detail |
|----------|--------|--------|
| Email already registered | 400 | "Email already registered" |
| Wrong email or password | 401 | "Invalid credentials" |
| Missing / expired token | 401 | "Not authenticated" |
| Malformed token | 401 | "Not authenticated" |

---

## Testing

- `POST /api/auth/register` → 201 + token
- `POST /api/auth/register` duplicate → 400
- `POST /api/auth/login` correct creds → 200 + token
- `POST /api/auth/login` wrong password → 401
- `GET /api/auth/me` with valid token → 200 + user
- `GET /api/auth/me` without token → 401

---

## Environment Variables

Add to `.env`:
```
JWT_SECRET=<random 32+ char string>
```

Add to `wiki/02-system-architecture.md` env table.

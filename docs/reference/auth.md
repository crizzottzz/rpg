# Authentication & Authorization Architecture

Adapted from prior enterprise architecture experience.

---

## Core Principles

### The SPA Is Untrusted

- All client-side code is public and modifiable
- The SPA cannot be relied upon for security decisions
- UI controls and route guards are advisory only — for UX, not protection

### The API Is the Authority

- All authentication and authorization decisions are enforced server-side
- Every protected API call independently validates identity and permissions
- There is no session-based trust between requests

### Tokens Are Bearer Credentials

- Possession of a valid token grants access until expiration
- Tokens are short-lived to limit blast radius
- Tokens are portable across clients

### JWTs Are Verified Locally

- No per-request calls to identity providers
- Verification is cryptographic and stateless
- Horizontal scaling does not require shared session state

---

## Token Types

### Access Tokens

- JWT format, short-lived (1 hour default)
- Used on every API request via `Authorization: Bearer <token>` header
- Contains user identity (sub, roles)
- Used by the API to identify the user and enforce permissions

### Refresh Tokens

- Long-lived (30 days default)
- Used only to obtain new access tokens
- Never sent to API endpoints — only to the refresh endpoint
- Enable session continuity without repeated logins

---

## Token Verification (Backend)

Every protected API request:

1. Extract token from Authorization header
2. Parse JWT header
3. Verify cryptographic signature against secret key
4. Validate claims: `exp`, `iat`, `sub`
5. Resolve user from token claims
6. Authorize the requested action (ownership checks, etc.)

No network calls during verification. Stateless and horizontally scalable.

---

## Identity Provider Abstraction

The app supports an identity provider interface that abstracts the auth source:

- **Current:** Local provider (username/password, JWT minted by Flask)
- **Future:** Auth0, social login, SSO

From the API's perspective, all providers behave the same — they produce JWTs with normalized claims. Switching providers does not change route code or service logic.

### Qualification for Parametric Abstraction

Auth is a textbook case for the parametric abstraction pattern (see `docs/reference/parametric-abstraction.md`):

- Multiple implementations exist (local, Auth0, social)
- Behavior differs by deployment
- External systems are involved
- App code should never branch on auth type

---

## SPA Responsibilities

The frontend does not verify tokens. Its responsibilities are:

- Storing access and refresh tokens in localStorage
- Attaching the access token to API requests (Axios interceptor)
- Tracking token expiration
- Refreshing tokens when a 401 is received
- Redirecting to login when authentication is lost
- Hiding/showing UI elements based on auth state (advisory only)

The SPA treats the API as the source of truth.

---

## SPA Route Protection

Client-side route guards (`ProtectedRoute`) exist for **user experience only**:

- Prevent accidental navigation to auth-required pages
- Reduce unnecessary API calls from unauthenticated users
- Not trusted for security — all enforcement is server-side

---

## Token Lifecycle

### Login

1. User submits credentials to `POST /api/auth/login`
2. Backend validates credentials
3. Backend mints access token + refresh token
4. Frontend stores both tokens in localStorage
5. Axios interceptor attaches access token to subsequent requests

### Token Refresh

1. API returns 401 (access token expired)
2. Axios interceptor catches the 401
3. Interceptor calls `POST /api/auth/refresh` with refresh token
4. Backend validates refresh token, mints new access token
5. Interceptor retries the original request with the new token
6. If refresh fails, clear tokens and redirect to login

### Logout

- Remove tokens from localStorage
- Redirect to login page
- Refresh tokens are not revoked server-side (stateless model)

---

## Threat Model

- Access tokens are bearer tokens — if stolen, they can be replayed until expiration
- Short lifetimes (1 hour) limit exposure
- Refresh tokens enable session continuity without storing passwords
- Logout revokes client-side token access, not active access tokens
- This is consistent with standard OAuth 2.0 / JWT tradeoffs

---

## Future Considerations

- httpOnly cookies as an alternative token transport (XSS mitigation)
- RBAC with roles/permissions in token claims
- Multi-tenant isolation if the app becomes a shared product
- Token revocation via a deny list (for immediate logout)

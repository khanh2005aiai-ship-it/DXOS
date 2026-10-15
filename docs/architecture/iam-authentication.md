# IAM authentication foundation

## Implemented strategy

DX-OS uses a short-lived HS256 JWT access token plus a server-side `AuthSession` containing a hash of an opaque refresh token. The access-token payload is intentionally limited to `sub` (user UUID), `sid` (session UUID), and `typ=access`. It contains no password hash, email, role, permission, organization, or refresh token.

At login, passwords are verified with Argon2id using 19 MiB memory, two iterations, one lane, and a 32-byte hash. Passwords are never stored or logged in plaintext. Unknown identities and identities without a local password credential consume equivalent Argon2 work before returning the same `INVALID_CREDENTIALS` response as an incorrect password.

Refresh tokens are random 32-byte values attached to a session UUID, are stored only as a SHA-256 hash, and expire according to `JWT_REFRESH_TTL` (30 days by default). Refresh exchanges atomically revoke the old session and create a replacement. Logout revokes the current session. The authentication guard checks signature, token type, expiry, session state, and active account state on each protected request, so a revoked session invalidates its active access token.

## Account and user model

`User` has an optional `password_hash` for controlled future provisioning, `account_status` (`ACTIVE`, `INACTIVE`, `SUSPENDED`), and `last_login_at`. Public registration is not implemented. Only active accounts can receive or use sessions.

`AuthSession` is the smallest server-side state needed for refresh rotation and effective logout. It has no IP address, user-agent, or raw token field in this foundation. Session retention/cleanup will be defined with operational policies later.

## Configuration

`JWT_ACCESS_SECRET` is required outside test mode, must not be the documented placeholder, and must contain at least 32 characters. `JWT_ACCESS_TTL` defaults to `15m` (60 seconds to one hour permitted). `JWT_REFRESH_TTL` defaults to `30d` (one hour to 90 days permitted). Values are validated at startup.

## Authentication rate limiting

Login and refresh use a shared Redis fixed-window limiter in production. The `INCR` and first-request `PEXPIRE` operations run in one Redis Lua script, so concurrent backend replicas share one atomic counter and every key expires with its configured window. Keys use the form `auth:rate-limit:v1:<scope>:<direct-socket-address>`; forwarding headers are not trusted.

`REDIS_URL` is required in production, and all backend replicas must point to the same Redis instance or cluster. If Redis is unavailable, only login and refresh fail closed with a safe 503 response; the rest of the application remains available. Development and test environments may omit `REDIS_URL` and use the bounded process-local fallback. Shared edge/API-gateway throttling remains recommended defense-in-depth.

RBAC, permission checking, organization selection, user/role administration, public user registration, password reset, and MFA remain outside this IAM foundation.

## Database testing boundary

Authentication unit/API tests mock Prisma and do not claim database integration coverage. Schema validation and offline migration structural validation run locally. Applying migrations, full history diff, and database integration tests require a configured MySQL test database; `SHADOW_DATABASE_URL` enables the full Prisma history diff.

# Authentication API contract

This contract introduces the first frontend-facing IAM endpoints. It is additive: there was no earlier authentication API. All errors use the shared [error envelope](../error-envelope.md). No endpoint returns a password hash or token/session persistence details.

## POST /api/v1/auth/login

| Property | Value |
| --- | --- |
| Authentication | Not required |
| Authorization | Not required |
| Rate limiting | Shared Redis fixed-window limit in production; defaults are 10 requests per 60 seconds per direct socket address |

### Request body

```json
{
  "email": "user@example.com",
  "password": "user supplied password"
}
```

`email` must be an email address of 3–320 characters and is trimmed/lowercased before lookup. `password` must be a string of 1–1,024 characters. Unknown fields are rejected.

### Response — 200 OK

```json
{
  "accessToken": "JWT access token omitted from examples",
  "refreshToken": "opaque refresh token omitted from examples",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

`expiresIn` is an integer duration in seconds. The access token is used as `Authorization: Bearer <accessToken>`. The refresh token is opaque, must be treated as a credential, and is rotated whenever it is exchanged.

### Errors

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | VALIDATION_FAILED | Invalid body, including unknown fields. |
| 401 | INVALID_CREDENTIALS | Unknown email, no password credential, or incorrect password. The response intentionally does not distinguish these cases. |
| 403 | ACCOUNT_INACTIVE | Correct credentials for an inactive account. |
| 403 | ACCOUNT_SUSPENDED | Correct credentials for a suspended account. |
| 429 | TOO_MANY_REQUESTS | The authentication request limit was exceeded. `Retry-After` indicates the minimum retry delay in seconds. |
| 503 | AUTH_RATE_LIMIT_UNAVAILABLE | The shared authentication rate-limit store is temporarily unavailable; the request is rejected safely. |
| 500 | INTERNAL_ERROR / DATABASE_ERROR | Safe operational failure. |

## POST /api/v1/auth/refresh

| Property | Value |
| --- | --- |
| Authentication | Not required; the refresh token is the credential |
| Authorization | Not required |
| Rate limiting | Shared Redis fixed-window limit in production; defaults are 30 requests per 60 seconds per direct socket address |

### Request body

```json
{
  "refreshToken": "opaque refresh token omitted from examples"
}
```

The token must be a valid opaque refresh-token format. It is not a JWT.

### Response — 200 OK

The response has the same schema as `POST /auth/login`. On success the previous refresh token is revoked and a new refresh token is issued.

### Errors

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | VALIDATION_FAILED | Invalid body. |
| 401 | UNAUTHORIZED | Missing, malformed, expired, revoked, replayed, or invalid refresh token. |
| 403 | ACCOUNT_INACTIVE / ACCOUNT_SUSPENDED | The user is no longer eligible to authenticate. |
| 429 | TOO_MANY_REQUESTS | The authentication request limit was exceeded. `Retry-After` indicates the minimum retry delay in seconds. |
| 503 | AUTH_RATE_LIMIT_UNAVAILABLE | The shared authentication rate-limit store is temporarily unavailable; the request is rejected safely. |

## GET /api/v1/auth/me

| Property | Value |
| --- | --- |
| Authentication | Required — bearer access token |
| Authorization | Identity only; RBAC is not part of this endpoint |

### Response — 200 OK

```json
{
  "id": "a UUID",
  "email": "user@example.com",
  "displayName": "Example User",
  "accountStatus": "ACTIVE"
}
```

`displayName` may be `null`; `accountStatus` is one of `ACTIVE`, `INACTIVE`, or `SUSPENDED`. Password hashes and session/refresh-token fields are never returned.

### Errors

| Status | Code | Meaning |
| --- | --- | --- |
| 401 | UNAUTHORIZED | Missing, malformed, expired, revoked, or invalid access token; also returned when its session is no longer active. |

## POST /api/v1/auth/logout

| Property | Value |
| --- | --- |
| Authentication | Required — bearer access token |
| Authorization | Identity only; the current session only |

### Response — 204 No Content

The current server-side session is revoked. Its associated access token will then fail authentication because the guard verifies that the session is still active.

### Errors

| Status | Code | Meaning |
| --- | --- | --- |
| 401 | UNAUTHORIZED | Missing, malformed, expired, revoked, or invalid access token. |

## Pagination, filtering, and sorting

None of these endpoints returns a collection.

## Frontend impact and migration

- **Existing contract:** no authentication endpoints existed.
- **Breaking change:** no.
- **Frontend impact:** clients may implement login, refresh, current-user bootstrap, and logout using this document. They must keep tokens out of logs and treat refresh tokens as credentials.
- **Migration:** no migration is required for existing frontend behavior.

In production, `REDIS_URL` is required and all backend replicas must use the same Redis instance or cluster. Redis increments are atomic and each rate-limit key expires with its configured window. Development and test environments may omit `REDIS_URL` and use the bounded process-local fallback. If the configured Redis store is unavailable, login and refresh return a safe 503 response rather than bypassing rate limiting.

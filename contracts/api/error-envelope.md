# DX-OS API error envelope

All public DX-OS API failures use this response structure. Clients must use error.code for programmatic behavior and show error.message only when it fits the UX.

## Response body

~~~json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request validation failed.",
    "details": {
      "fields": ["email must be an email"]
    },
    "requestId": "f37e2579-04e7-4989-9c22-3a1a469e365d"
  }
}
~~~

| Field | Type | Meaning |
| --- | --- | --- |
| success | boolean | Always false for an error response. |
| error.code | string | Stable machine-readable error code. |
| error.message | string | Safe human-readable summary. |
| error.details | object | Safe structured details; validation uses fields. Never includes secrets, stack traces, or internal paths. |
| error.requestId | string | Correlation ID for support and backend log tracing. |

## Foundation error codes

| HTTP status | Code | Meaning |
| --- | --- | --- |
| 400 | VALIDATION_FAILED | Request DTO validation or unknown-property rejection failed. |
| 400 | BAD_REQUEST | Request is malformed outside DTO validation. |
| 401 | UNAUTHORIZED | Missing, invalid, expired, or revoked authentication credential. |
| 401 | INVALID_CREDENTIALS | Login credentials are not valid; user existence is not disclosed. |
| 403 | FORBIDDEN | Organization authorization failed: missing membership, permission, or valid tenant context. |
| 403 | ACCOUNT_INACTIVE | Correct credentials were supplied for an inactive account. |
| 403 | ACCOUNT_SUSPENDED | Correct credentials were supplied for a suspended account. |
| 404 | NOT_FOUND | Resource or disabled API documentation endpoint is not available. |
| 409 | CONFLICT | Requested state conflicts with an existing resource. |
| 422 | UNPROCESSABLE_ENTITY | Request cannot be processed. |
| 429 | TOO_MANY_REQUESTS | Authentication request limit was reached. The response may include `Retry-After` seconds. |
| 503 | AUTH_RATE_LIMIT_UNAVAILABLE | The shared authentication rate-limit store is unavailable; protected authentication requests fail closed. |
| 500 | INTERNAL_ERROR | Unexpected server error; no implementation details are exposed. |

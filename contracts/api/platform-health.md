# Platform health API

| Property | Value |
| --- | --- |
| Endpoint | /api/v1/health |
| Method | GET |
| Authentication | Not required |
| Authorization | Not required |

## Request headers

| Header | Required | Behavior |
| --- | --- | --- |
| X-Request-Id | No | A valid opaque value of 8 to 128 safe characters is reused; otherwise DX-OS generates a UUID. |
| Origin | No | Browser origins must match configured CORS_ORIGINS. |

## Response — 200 OK

~~~json
{
  "status": "ok",
  "service": "dx-os-api",
  "timestamp": "2026-09-06T00:00:00.000Z"
}
~~~

The X-Request-Id response header is always set and is exposed to allowed CORS origins. The endpoint has no request body, filtering, sorting, or pagination.

## Error response

Unexpected failures use the shared error envelope in error-envelope.md. The normal health response is intentionally not wrapped to preserve its existing contract.

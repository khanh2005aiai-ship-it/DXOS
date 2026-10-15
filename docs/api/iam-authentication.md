# IAM authentication API notes

DXOS-IAM-001 publishes login, refresh, current-user, and logout endpoints under `/api/v1/auth`. The implementation and source-of-truth request/response definitions are in `contracts/api/auth/authentication.md`.

The OpenAPI-compatible JSON document now describes bearer authentication and the auth endpoint schemas. Its token examples are deliberately non-credential placeholders.

Login and refresh use a shared Redis fixed-window limiter in production. Defaults are 10 login requests and 30 refresh requests per 60 seconds per direct socket address; the values can be configured with `RATE_LIMIT_*` environment variables. Each Redis increment is atomic and each key expires with its window. Exceeded requests return the shared `TOO_MANY_REQUESTS` envelope with `Retry-After`.

`REDIS_URL` is required in production. Every backend replica must use the same Redis instance or cluster so requests distributed across instances count toward the same bucket. If Redis is unavailable, only the protected login and refresh endpoints fail closed with a safe 503 response; other application endpoints remain available. Development and test environments may omit `REDIS_URL` and use the bounded process-local fallback. The application does not trust client-supplied forwarding headers for its key. Edge/API-gateway throttling remains recommended defense-in-depth.

# AI API v1 — DXOS-AI-002

`POST /api/v1/organizations/:organizationId/ai/generate` is the tenant-scoped AI chat boundary. The caller must present a valid bearer JWT, an active account, an `ACTIVE` membership in the path organization, and an explicit `ai:use` permission. The route organization and permission decision are always derived from the authenticated request context; a client supplied organization, actor, provider, permission list, role, tool or privilege field is rejected or ignored. Cross-tenant access returns the existing safe `403 FORBIDDEN` envelope.

The request is bounded and additive to the existing endpoint:

```json
{
  "messages": [
    { "role": "user", "content": "What is our next task?" },
    { "role": "assistant", "content": "The next task is ..." },
    { "role": "user", "content": "Give me more detail." }
  ],
  "model": "gpt-4o-mini",
  "maxOutputTokens": 256,
  "temperature": 0.2,
  "metadata": { "purpose": "general" }
}
```

`messages` contains 1–16 `user` or `assistant` messages. A message is non-blank and at most 4,000 characters; combined content is at most 16,000 UTF-16 units and 64,000 UTF-8 bytes. `model` is optional and, when supplied, must equal the server configured model. Model identifiers are bounded safe identifiers. `maxOutputTokens` is 1–2,048 (default 256), `temperature` is 0–2 (default 0), and metadata is optional, exactly `{ "purpose": "general" }`, and at most 256 UTF-8 bytes. `system`, `developer`, `tool`, arbitrary options, tool calls and executable actions are not accepted. Conversation state is supplied by the client for each request; no conversation table is created.

On success, the server returns only normalized data:

```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "requestId": "opaque-correlation-id",
  "provider": "mock|openai",
  "model": "mock-v1|configured-openai-model",
  "text": "untrusted assistant text",
  "finishReason": "stop|length",
  "usage": { "inputTokens": 12, "outputTokens": 8, "totalTokens": 20 }
}
```

Provider payloads, headers, stack traces, prompts, responses, credentials and filesystem/internal URLs are never returned or persisted. The `AiRequest` row stores tenant/actor, provider/model, request correlation, bounded usage, lifecycle status, error category and latency only. Audit records contain the existing `ai.request.started`, `ai.request.succeeded` or `ai.request.failed` event and request correlation/resource metadata; they never contain conversation content.

`AI_PROVIDER=mock` selects the deterministic offline provider and requires no key. `AI_PROVIDER=openai` selects the official OpenAI Chat Completions API adapter, with `AI_API_KEY` required outside `NODE_ENV=test`, `AI_MODEL` defaulting to `gpt-4o-mini`, and `AI_TIMEOUT_MS` bounded to 1–30,000 ms (default 5,000). Production continues to default to `disabled` unless explicitly configured. The API key is server-only and is excluded from validated environment output and application logs. The provider uses the request abort signal; there is no provider retry or tool execution.

Errors use the existing `ErrorResponse` envelope and request ID: `400 VALIDATION_FAILED`/`AI_INVALID_REQUEST`, `401 UNAUTHORIZED`, `403 FORBIDDEN`, `429 AI_LIMIT_EXCEEDED`, `503 AI_PROVIDER_UNAVAILABLE` for disabled/timeout/transport/5xx failures, `502 AI_PROVIDER_ERROR` for safe provider or malformed-response failures, and `500 AI_INTERNAL_ERROR` for persistence/lifecycle failures. Provider error bodies are not read into errors or logs.

No database schema or migration change is required. The endpoint is non-streaming, has no history/read endpoint, and does not add RAG, vectors, agents, tools, autonomous actions, document retrieval or notification side effects.

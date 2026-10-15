import { AI_LIMITS } from './ai-policy';
const error = { $ref: '#/components/responses/ErrorResponse' };
export const aiPaths = {
  '/organizations/{organizationId}/ai/generate': { post: {
    summary: 'Generate bounded text through the tenant AI boundary', security: [{ bearerAuth: [] }], 'x-required-permission': 'ai:use',
    description: 'Active tenant membership and explicit ai:use grant, no automatic admin access. Conversation history is client-supplied and bounded. Provider/model are server configured; secrets and raw prompts/responses are never persisted or returned. Authorization is rechecked after provider completion.',
    parameters: [{ name: 'organizationId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
    requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AiGenerateRequest' } } } },
    responses: { '200': { description: 'Normalized response; private no-store', content: { 'application/json': { schema: { $ref: '#/components/schemas/AiGenerateResponse' } } } },
      '400': error, '401': error, '403': error, '429': error, '500': error, '502': error, '503': error },
  } },
};
export const aiSchemas = {
  AiGenerateRequest: { type: 'object', additionalProperties: false, required: ['messages'], properties: {
    messages: { type: 'array', minItems: 1, maxItems: AI_LIMITS.messages,
      description: `Non-whitespace content; total <=${AI_LIMITS.totalChars} UTF-16 units and ${AI_LIMITS.inputBytes} UTF-8 bytes.`,
      items: { type: 'object', additionalProperties: false, required: ['role', 'content'], properties: {
        role: { type: 'string', enum: ['user', 'assistant'] }, content: { type: 'string', minLength: 1, maxLength: AI_LIMITS.messageChars },
      } } },
    model: { type: 'string', pattern: '^[A-Za-z0-9][A-Za-z0-9._:-]{0,99}$', description: 'Optional; must equal the server configured model.' },
    maxOutputTokens: { type: 'integer', minimum: 1, maximum: AI_LIMITS.outputTokens, default: AI_LIMITS.defaultOutputTokens },
    temperature: { type: 'number', minimum: 0, maximum: 2, default: 0 },
    metadata: { type: 'object', additionalProperties: false, required: ['purpose'], description: `Optional; <=${AI_LIMITS.metadataBytes} UTF-8 bytes; not persisted.`,
      properties: { purpose: { type: 'string', enum: ['general'] } } },
  } },
  AiGenerateResponse: { type: 'object', additionalProperties: false,
    required: ['id', 'organizationId', 'requestId', 'provider', 'model', 'text', 'finishReason', 'usage'], properties: {
      id: { type: 'string', format: 'uuid' }, organizationId: { type: 'string', format: 'uuid' }, requestId: { type: 'string', maxLength: 128 },
      provider: { type: 'string', enum: ['mock', 'openai'] }, model: { type: 'string', maxLength: 100 },
      text: { type: 'string', minLength: 1, maxLength: AI_LIMITS.outputChars }, finishReason: { type: 'string', enum: ['stop', 'length'] },
      usage: { type: 'object', additionalProperties: false, required: ['inputTokens', 'outputTokens', 'totalTokens'], properties: {
        inputTokens: { type: 'integer', minimum: 0, maximum: AI_LIMITS.usageCount },
        outputTokens: { type: 'integer', minimum: 0, maximum: AI_LIMITS.outputTokens },
        totalTokens: { type: 'integer', minimum: 0, maximum: AI_LIMITS.usageCount + AI_LIMITS.outputTokens },
      } },
    } },
};

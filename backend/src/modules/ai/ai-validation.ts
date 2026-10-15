import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { ApiErrorException } from '../../common/errors/api-error.exception';
import { GenerateAiDto } from './ai.dto';
import { AI_LIMITS } from './ai-policy';
import type { AiProviderResult } from './ai-provider';

export function validatedAiInput(input: GenerateAiDto): GenerateAiDto {
  const invalid = () => { throw new ApiErrorException(400, 'AI_INVALID_REQUEST', 'Invalid AI request.'); };
  if (!input || typeof input !== 'object' || Array.isArray(input)) invalid();
  const dto = plainToInstance(GenerateAiDto, input);
  if (validateSync(dto, { whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }).length) invalid();
  const content = dto.messages.map((m) => m.content).join('');
  if (content.length > AI_LIMITS.totalChars || Buffer.byteLength(content, 'utf8') > AI_LIMITS.inputBytes ||
    (dto.metadata !== undefined && (dto.metadata === null || Buffer.byteLength(JSON.stringify(dto.metadata), 'utf8') > AI_LIMITS.metadataBytes))) invalid();
  return dto;
}
function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value); }
export function validatedAiResult(result: unknown, outputCap: number): AiProviderResult {
  const invalid = () => { throw new Error('Invalid normalized provider response'); };
  if (!record(result)) return invalid();
  if (Object.keys(result).some((key) => !['text', 'usage', 'finishReason'].includes(key)) ||
    typeof result.text !== 'string' || !result.text.length || result.text.length > AI_LIMITS.outputChars ||
    !['stop', 'length'].includes(result.finishReason as string) || !record(result.usage)) return invalid();
  const usage = result.usage;
  if (Object.keys(usage).some((key) => !['inputTokens', 'outputTokens'].includes(key)) ||
    !Number.isSafeInteger(usage.inputTokens) || !Number.isSafeInteger(usage.outputTokens) ||
    (usage.inputTokens as number) < 0 || (usage.inputTokens as number) > AI_LIMITS.usageCount ||
    (usage.outputTokens as number) < 0 || (usage.outputTokens as number) > outputCap) return invalid();
  return { text: result.text, finishReason: result.finishReason as 'stop' | 'length',
    usage: { inputTokens: usage.inputTokens as number, outputTokens: usage.outputTokens as number } };
}

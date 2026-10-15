import type { AiMessageDto } from './ai.dto';

export interface AiProviderInput {
  messages: AiMessageDto[];
  model: string;
  maxOutputTokens: number;
  temperature: number;
  systemPrompt?: string;
}
export interface AiProviderContext { requestId: string; signal: AbortSignal }
export interface AiProviderResult {
  text: string;
  usage: { inputTokens: number; outputTokens: number };
  finishReason: 'stop' | 'length';
}
export abstract class AiProvider {
  abstract generateText(input: AiProviderInput, context: AiProviderContext): Promise<AiProviderResult>;
}
export class AiProviderUnavailable extends Error {}
export class AiProviderLimit extends Error {}
export class AiProviderError extends Error {}
export class AiProviderNotConfigured extends AiProviderUnavailable {}

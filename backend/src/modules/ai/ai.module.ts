import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { AuditWriterModule } from '../audit/audit-writer.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiDataService } from './ai-data.service';
import { AiAnalyticsService } from './ai-analytics.service';
import { AiProvider } from './ai-provider';
import { MockAiProvider } from './mock-ai.provider';
import { OpenAiProvider } from './openai-ai.provider';
import { GeminiAiProvider } from './gemini-ai.provider';
import { ConfigService } from '@nestjs/config';
import type { AppConfiguration } from '../../config/environment';

@Module({
  imports: [AuthModule, RbacModule, AuditWriterModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiDataService,
    AiAnalyticsService,
    MockAiProvider,
    OpenAiProvider,
    GeminiAiProvider,
    {
      provide: AiProvider,
      useFactory: (
        config: ConfigService,
        mock: MockAiProvider,
        openai: OpenAiProvider,
        gemini: GeminiAiProvider
      ) => {
        const app = config.getOrThrow<AppConfiguration>('app');
        if (app.aiProvider === 'openai') return openai;
        if (app.aiProvider === 'gemini') return gemini;
        return mock;
      },
      inject: [ConfigService, MockAiProvider, OpenAiProvider, GeminiAiProvider],
    },
  ],
  exports: [AiService, AiDataService, AiAnalyticsService],
})
export class AiModule {}

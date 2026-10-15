import { Module } from '@nestjs/common';
import { ApiDocumentationController } from './api-documentation.controller';

@Module({
  controllers: [ApiDocumentationController],
})
export class ApiDocumentationModule {}

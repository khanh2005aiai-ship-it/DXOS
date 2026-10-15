import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';
import { SelfServiceService } from './self-service.service';
import { SelfServiceController } from './self-service.controller';

@Module({
  imports: [AuthModule, RbacModule],
  controllers: [SelfServiceController],
  providers: [SelfServiceService],
  exports: [SelfServiceService],
})
export class SelfServiceModule {}

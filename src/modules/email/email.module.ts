import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EmailService } from './email.service';

@Global()
@Module({
  imports: [
    CacheModule.register({
      ttl: 10 * 60 * 1000, // 10 minutes default TTL
    }),
  ],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

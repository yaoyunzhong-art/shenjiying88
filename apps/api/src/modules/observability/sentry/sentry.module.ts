/**
 * sentry.module.ts - Phase-22 T69
 * Sentry Module — 提供 SentryService 给业务代码注入
 */
import { Global, Module } from '@nestjs/common';
import { SentryService } from './sentry.service';

@Global()
@Module({
  providers: [
    {
      provide: SentryService,
      useFactory: () =>
        new SentryService({
          release: process.env.SENTRY_RELEASE ?? process.env.SERVICE_VERSION ?? '0.1.0',
          environment: process.env.NODE_ENV ?? 'development',
          dsn: process.env.SENTRY_DSN,
        }),
    },
  ],
  exports: [SentryService],
})
export class SentryModule {}

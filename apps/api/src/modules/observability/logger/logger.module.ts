/**
 * Logger Module
 *
 * 提供 LoggerService (pino 封装) + attachRequestContext 中间件。
 * 与 MetricsModule 平级,@Global() 全局可用。
 */

import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}

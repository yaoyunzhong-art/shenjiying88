/**
 * Tracing Module
 *
 * 提供 TracingService (NestJS 注入式 span 包装)。
 *
 * 注意:OpenTelemetry SDK 初始化必须在 main.ts 顶部完成 (副作用导入 tracing.ts),
 * TracingModule 仅负责提供 TracingService 给业务代码注入使用。
 */

import { Global, Module } from '@nestjs/common';
import { TracingService } from './tracing.service';

@Global()
@Module({
  providers: [TracingService],
  exports: [TracingService],
})
export class TracingModule {}

import { Global, Module } from '@nestjs/common'
import { InMemoryOutboxStore } from './in-memory-outbox.store'
import { OutboxRelay } from './outbox.relay'
import { OutboxReplayService } from './outbox-replay.service'

/**
 * OutboxModule · 事件可靠投递基础设施 (P1-3)
 *
 * 全局模块, 任何业务模块可直接:
 *   - 注入 OutboxWriter (注入即用 InMemoryOutboxStore)
 *   - 注入 OutboxRelay 注册 handler
 *   - 注入 OutboxReplayService 做 DLQ 重放
 *
 * 未来扩展 (Phase-46):
 *   - 替换 store 为 PrismaOutboxStore (持久化)
 *   - 替换轮询为 LISTEN/NOTIFY (DB 触发)
 *   - 分布式 relay 锁 (Redis SETNX)
 */
@Global()
@Module({
  providers: [
    InMemoryOutboxStore,
    OutboxRelay,
    OutboxReplayService
  ],
  exports: [
    InMemoryOutboxStore,
    OutboxRelay,
    OutboxReplayService
  ]
})
export class OutboxModule {}

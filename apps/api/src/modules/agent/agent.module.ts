import { Module, OnModuleInit } from '@nestjs/common'
import { AgentController } from './agent.controller'
import { AgentService } from './agent.service'
import { ToolRegistry } from './tool-registry'
import { EventBufferService } from './event-buffer.service'
import { EventStoreService } from './event-store.service'

@Module({
  controllers: [AgentController],
  providers: [AgentService, ToolRegistry, EventBufferService, EventStoreService],
  exports: [AgentService, EventBufferService, EventStoreService]
})
export class AgentModule implements OnModuleInit {
  constructor(
    private readonly eventBuffer: EventBufferService,
    private readonly eventStore: EventStoreService
  ) {}

  /**
   * Phase-33: 启动时把 EventStore 注入到 EventBuffer, 启用双写
   */
  onModuleInit(): void {
    if (!this.eventBuffer || typeof this.eventBuffer.setEventStore !== 'function') {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[agent] event buffer unavailable, skip dual-write setup')
      }
      return
    }

    this.eventBuffer.setEventStore(this.eventStore ?? null)
  }
}

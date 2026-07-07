/**
 * Infrastructure Queue Module (Phase-13 task 13)
 *
 * 提供 BullMQ 兼容的 QueueProducer:
 *   - forRootInMemory() — 测试 / 开发
 *   - forRootBullMQ() — 生产(默认 redis://localhost:6379)
 *   - viaToken() — 自定义后端
 *
 * 与 EventBus 的区别:
 *   - EventBus:轻量 pub/sub,无重试、无持久化、无调度
 *   - Queue:持久化作业队列,有重试、调度、统计
 */

import { DynamicModule, Global, Module, type Provider } from '@nestjs/common'
import {
  BullMQQueueProducer,
  InMemoryQueueProducer,
  QueueType,
  type QueueProducerService
} from './queue-producer'

export const QUEUE_PRODUCER_SERVICE = Symbol.for('m5.infrastructure.queue-producer')

export { QueueType } from './queue-producer'
export type {
  QueueJob,
  QueueJobResult,
  QueueStats,
  QueueHandler,
  QueueProducerService
} from './queue-producer'
export { InMemoryQueueProducer, BullMQQueueProducer }

export interface QueueModuleOptions {
  backend: 'memory' | 'bullmq'
  connectionUrl?: string
}

@Global()
@Module({})
export class QueueModule {
  static forRootInMemory(): DynamicModule {
    return {
      module: QueueModule,
      providers: [
        {
          provide: QUEUE_PRODUCER_SERVICE,
          useFactory: (): QueueProducerService => new InMemoryQueueProducer()
        }
      ],
      exports: [QUEUE_PRODUCER_SERVICE]
    }
  }

  static forRootBullMQ(connectionUrl?: string): DynamicModule {
    return {
      module: QueueModule,
      providers: [
        {
          provide: QUEUE_PRODUCER_SERVICE,
          useFactory: (): QueueProducerService => new BullMQQueueProducer(connectionUrl)
        }
      ],
      exports: [QUEUE_PRODUCER_SERVICE]
    }
  }

  static viaToken(provider: Provider): DynamicModule {
    return {
      module: QueueModule,
      providers: [provider, { provide: QUEUE_PRODUCER_SERVICE, useExisting: provider } as Provider],
      exports: [QUEUE_PRODUCER_SERVICE]
    }
  }
}

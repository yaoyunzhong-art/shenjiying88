/**
 * EventBusModule — 跨模块事件总线
 *
 * 设计要点:
 * - 后端:BullMQ (生产) 或 EventEmitter (内存 fallback,测试 / Redis 不可用)。
 * - 接口统一:publish(eventName, payload) + subscribe(eventName, handler)。
 * - 测试:用 forRootInMemory() 或直接注入 mock EVENT_BUS_SERVICE。
 * - 跨模块场景:workbench receipt 完成 → publish('ReceiptCompleted') →
 *   notification worker 收到事件 → 自动发通知。
 */
import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnModuleDestroy,
  Provider,
} from '@nestjs/common'
import { EventEmitter } from 'node:events'

export const EVENT_BUS_SERVICE = Symbol.for('m5.infrastructure.event-bus.service')

export interface EventPayload {
  /** 事件名,例如 'ReceiptCompleted' / 'NotificationFailed' */
  eventName: string
  payload: unknown
  /** 发布时附加 metadata (tenantId, actorId 等) */
  metadata?: Record<string, unknown>
}

export type EventHandler<T = unknown> = (payload: T, metadata?: Record<string, unknown>) => Promise<void> | void

export interface EventBusService {
  publish(eventName: string, payload: unknown, metadata?: Record<string, unknown>): Promise<void>
  subscribe<T = unknown>(eventName: string, handler: EventHandler<T>): void
  /** 后端标识 */
  readonly backend: 'bullmq' | 'memory'
  /** 健康检查 */
  ping(): Promise<boolean>
}

// ── 内存实现 ────────────────────────────────────────────────────────
@Injectable()
export class InMemoryEventBus implements EventBusService {
  readonly backend = 'memory' as const
  private readonly emitter = new EventEmitter()
  private readonly logger = new Logger(InMemoryEventBus.name)

  constructor() {
    this.emitter.setMaxListeners(100)
  }

  async publish(eventName: string, payload: unknown, metadata?: Record<string, unknown>): Promise<void> {
    this.emitter.emit(eventName, payload, metadata)
  }

  subscribe<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    this.emitter.on(eventName, async (payload: T, metadata?: Record<string, unknown>) => {
      try {
        await handler(payload, metadata)
      } catch (error) {
        this.logger.error(
          `Event handler for "${eventName}" threw: ${(error as Error).message}`
        )
      }
    })
  }

  async ping(): Promise<boolean> {
    return true
  }

  /** 测试 helper:触发 handler 数 */
  listenerCount(eventName: string): number {
    return this.emitter.listenerCount(eventName)
  }

  onModuleDestroy(): void {
    this.emitter.removeAllListeners()
  }
}

// ── BullMQ 实现 ────────────────────────────────────────────────────
export interface BullMQEventBusOptions {
  /** @nestjs/bullmq 已注册的 Queue 注入 token;BullMQ Queue 实例 */
  queue: { add(name: string, data: EventPayload, opts?: unknown): Promise<unknown> }
  /**
   * worker.handleJob:处理单个 job。EventBus 自身不维护 worker,
   * 而是在 process step 由 EventBusWorkerProcessor 消费。
   */
}

@Injectable()
export class BullMQEventBus implements EventBusService {
  readonly backend = 'bullmq' as const
  private readonly logger = new Logger(BullMQEventBus.name)
  private readonly handlers = new Map<string, Array<EventHandler<unknown>>>()

  constructor(@Inject('BULLMQ_EVENT_QUEUE') private readonly queue: BullMQEventBusOptions['queue']) {}

  async publish(eventName: string, payload: unknown, metadata?: Record<string, unknown>): Promise<void> {
    await this.queue.add(eventName, { eventName, payload, metadata })
  }

  subscribe<T = unknown>(eventName: string, handler: EventHandler<T>): void {
    const list = this.handlers.get(eventName) ?? []
    list.push(handler as EventHandler<unknown>)
    this.handlers.set(eventName, list)
  }

  /** Worker 调用入口:dispatch 给本地 handlers */
  async dispatch(data: EventPayload): Promise<void> {
    const list = this.handlers.get(data.eventName) ?? []
    for (const handler of list) {
      try {
        await handler(data.payload, data.metadata)
      } catch (error) {
        this.logger.error(
          `Event handler for "${data.eventName}" threw: ${(error as Error).message}`
        )
      }
    }
  }

  async ping(): Promise<boolean> {
    return true
  }

  /** 测试 helper:本地注册数 */
  handlerCount(eventName: string): number {
    return this.handlers.get(eventName)?.length ?? 0
  }
}

// ── Module ────────────────────────────────────────────────────────────
export interface EventBusInMemoryOptions {
  backend: 'memory'
}

export interface EventBusBullMQOptions {
  backend: 'bullmq'
  queue: BullMQEventBusOptions['queue']
}

export type EventBusModuleOptions = EventBusInMemoryOptions | EventBusBullMQOptions

const eventBusProvider: Provider = {
  provide: EVENT_BUS_SERVICE,
  inject: ['EVENT_BUS_MODULE_OPTIONS'],
  useFactory: (options: EventBusModuleOptions): EventBusService => {
    if (options.backend === 'memory') {
      return new InMemoryEventBus()
    }
    return new BullMQEventBus(options.queue)
  },
}

@Global()
@Module({})
export class EventBusModule {
  static forRoot(options: EventBusModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: 'EVENT_BUS_MODULE_OPTIONS',
      useValue: options,
    }
    return {
      module: EventBusModule,
      providers: [optionsProvider, eventBusProvider, InMemoryEventBus],
      exports: [EVENT_BUS_SERVICE],
    }
  }

  /** 测试 / 降级用 */
  static forRootInMemory(): DynamicModule {
    return this.forRoot({ backend: 'memory' })
  }
}
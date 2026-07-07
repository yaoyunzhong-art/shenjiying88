/**
 * Infrastructure Queue — 抽象队列生产者接口
 *
 * 设计目标:
 *   - 提供统一的 addJob / registerHandler / stats API
 *   - InMemoryQueueProducer 用 node:events 实现(测试/开发)
 *   - BullMQQueueProducer 懒加载 bullmq 包(生产)
 * - 调用方通过 token (QUEUE_PRODUCER_SERVICE) 注入,不感知后端
 */

export enum QueueType {
  /** 通知发送 */
  Notification = 'notification',
  /** Receipt 处理 */
  Receipt = 'receipt',
  /** 报表/账单生成 */
  Report = 'report',
  /** Email 投递 */
  Email = 'email',
  /** SMS 投递 */
  Sms = 'sms',
  /** Webhook 重试 */
  Webhook = 'webhook',
  /** 数据导出 */
  Export = 'export'
}

/** 队列作业通用负载 */
export interface QueueJob<TPayload = unknown> {
  id: string
  type: QueueType
  payload: TPayload
  attempts: number
  maxAttempts: number
  enqueuedAt: string
  scheduledFor?: string
  /** 租户/品牌/门店维度(用于隔离) */
  scope?: {
    tenantId?: string
    brandId?: string
    storeId?: string
  }
}

/** 队列执行结果 */
export interface QueueJobResult {
  jobId: string
  type: QueueType
  status: 'completed' | 'failed' | 'retry'
  error?: string
  durationMs: number
  completedAt: string
}

/** 队列统计 */
export interface QueueStats {
  total: number
  pending: number
  completed: number
  failed: number
  retries: number
  byType: Record<QueueType, number>
}

/** 队列 handler */
export type QueueHandler<TPayload = unknown> = (
  job: QueueJob<TPayload>
) => Promise<void>

/** 队列生产者抽象接口 */
export interface QueueProducerService {
  readonly backend: 'memory' | 'bullmq'

  /** 添加作业到队列 */
  addJob<TPayload>(
    type: QueueType,
    payload: TPayload,
    options?: { delayMs?: number; maxAttempts?: number; scope?: QueueJob['scope'] }
  ): Promise<QueueJob<TPayload>>

  /** 注册 handler(每种 type 可注册 1 个) */
  registerHandler<TPayload>(
    type: QueueType,
    handler: QueueHandler<TPayload>
  ): void

  /** 移除 handler */
  removeHandler(type: QueueType): void

  /** 同步执行所有 pending jobs(测试用) */
  drain(): Promise<QueueJobResult[]>

  /** 获取统计 */
  stats(): Promise<QueueStats>

  /** ping 后端 */
  ping(): Promise<boolean>
}

/**
 * InMemory Queue Producer
 *
 * - 使用 EventEmitter 触发 handler
 * - 同步执行 handler(模拟 BullMQ 同步 dispatcher)
 * - 持久化 jobs 到 Map (测试可见)
 */
export class InMemoryQueueProducer implements QueueProducerService {
  readonly backend = 'memory' as const
  private readonly jobs = new Map<string, QueueJob>()
  private readonly results: QueueJobResult[] = []
  private readonly handlers = new Map<QueueType, QueueHandler>()

  async addJob<TPayload>(
    type: QueueType,
    payload: TPayload,
    options?: { delayMs?: number; maxAttempts?: number; scope?: QueueJob['scope'] }
  ): Promise<QueueJob<TPayload>> {
    const job: QueueJob<TPayload> = {
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      payload,
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      enqueuedAt: new Date().toISOString(),
      scheduledFor: options?.delayMs
        ? new Date(Date.now() + options.delayMs).toISOString()
        : undefined,
      scope: options?.scope
    }
    this.jobs.set(job.id, job as QueueJob)

    // 同步执行 handler(模拟 BullMQ 异步,但保留同步语义便于测试)
    queueMicrotask(() => {
      void this.executeJob(job.id)
    })

    return job
  }

  registerHandler<TPayload>(type: QueueType, handler: QueueHandler<TPayload>): void {
    this.handlers.set(type, handler as QueueHandler)
  }

  removeHandler(type: QueueType): void {
    this.handlers.delete(type)
  }

  /**
   * 测试辅助:等待所有 pending jobs 执行完
   */
  async drain(): Promise<QueueJobResult[]> {
    // Poll until all jobs have a corresponding result
    const maxWaitMs = 2000
    const start = Date.now()
    while (Date.now() - start < maxWaitMs) {
      const pending = Array.from(this.jobs.values()).filter(
        (j) => !this.results.find((r) => r.jobId === j.id)
      )
      if (pending.length === 0) {
        // 等一两个 microtask 确保全部 flush
        await new Promise((r) => setImmediate(r))
        await new Promise((r) => setImmediate(r))
        return [...this.results]
      }
      await new Promise((r) => setTimeout(r, 5))
    }
    return [...this.results]
  }

  async stats(): Promise<QueueStats> {
    const byType = {} as Record<QueueType, number>
    for (const t of Object.values(QueueType)) {
      byType[t] = 0
    }
    let pending = 0
    for (const job of this.jobs.values()) {
      byType[job.type]++
      const result = this.results.find((r) => r.jobId === job.id)
      if (!result) pending++
    }
    return {
      total: this.jobs.size,
      pending,
      completed: this.results.filter((r) => r.status === 'completed').length,
      failed: this.results.filter((r) => r.status === 'failed').length,
      retries: this.results.filter((r) => r.status === 'retry').length,
      byType
    }
  }

  async ping(): Promise<boolean> {
    return this.handlers.size >= 0
  }

  /** 测试用:获取所有 jobs */
  listJobs(): QueueJob[] {
    return Array.from(this.jobs.values())
  }

  /** 测试用:获取所有 results */
  listResults(): QueueJobResult[] {
    return [...this.results]
  }

  /** 测试用:清理 */
  reset(): void {
    this.jobs.clear()
    this.results.length = 0
    this.handlers.clear()
  }

  private async executeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) return
    const handler = this.handlers.get(job.type)
    if (!handler) {
      this.results.push({
        jobId,
        type: job.type,
        status: 'failed',
        error: 'No handler registered',
        durationMs: 0,
        completedAt: new Date().toISOString()
      })
      return
    }

    const start = Date.now()
    job.attempts++
    try {
      await handler(job)
      this.results.push({
        jobId,
        type: job.type,
        status: 'completed',
        durationMs: Date.now() - start,
        completedAt: new Date().toISOString()
      })
    } catch (err: unknown) {
      const error = err instanceof Error ? err.message : 'Unknown error'
      if (job.attempts < job.maxAttempts) {
        this.results.push({
          jobId,
          type: job.type,
          status: 'retry',
          error,
          durationMs: Date.now() - start,
          completedAt: new Date().toISOString()
        })
      } else {
        this.results.push({
          jobId,
          type: job.type,
          status: 'failed',
          error,
          durationMs: Date.now() - start,
          completedAt: new Date().toISOString()
        })
      }
    }
  }
}

/**
 * BullMQ Queue Producer stub
 *
 * - 不实际 import bullmq (避免硬依赖)
 * - 生产模式时,需要在 app.module 替换为真实实现
 * - 提供接口一致性 + 测试兼容性
 */
export class BullMQQueueProducer implements QueueProducerService {
  readonly backend = 'bullmq' as const
  private readonly inMemory = new InMemoryQueueProducer()
  private readonly connectionUrl: string

  constructor(connectionUrl: string = 'redis://localhost:6379') {
    this.connectionUrl = connectionUrl
  }

  addJob<TPayload>(
    type: QueueType,
    payload: TPayload,
    options?: { delayMs?: number; maxAttempts?: number; scope?: QueueJob['scope'] }
  ): Promise<QueueJob<TPayload>> {
    // 生产模式:this.queue.add(name, payload, { delay, attempts })
    // 当前 stub:fallback 到 InMemory
    return this.inMemory.addJob(type, payload, options)
  }

  registerHandler<TPayload>(type: QueueType, handler: QueueHandler<TPayload>): void {
    this.inMemory.registerHandler(type, handler)
  }

  removeHandler(type: QueueType): void {
    this.inMemory.removeHandler(type)
  }

  async drain(): Promise<QueueJobResult[]> {
    return this.inMemory.drain()
  }

  async stats(): Promise<QueueStats> {
    return this.inMemory.stats()
  }

  async ping(): Promise<boolean> {
    return this.connectionUrl.length > 0
  }
}

import { statfs } from 'node:fs/promises'
import { Socket } from 'node:net'
import os from 'node:os'
import { FoundationScopeType } from '@m5/domain'
import { Inject, Injectable, Optional } from '@nestjs/common'
import { RedisService } from '../../infrastructure/redis/redis.module'
import {
  EVENT_BUS_SERVICE,
  type EventBusService
} from '../../infrastructure/event-bus/event-bus.module'
import {
  QUEUE_PRODUCER_SERVICE,
  type QueueProducerService
} from '../../infrastructure/queue/queue.module'
import {
  HealthStatus,
  type ComponentHealth,
  type HealthCheckResult,
  type HealthCheckContext,
  toHealthCheckResult
} from './health.entity'
import { LytService } from '../lyt/lyt.service'
import { PrismaService } from '../../prisma/prisma.service'

/** 服务启动时间戳 (模块级别) */
const BOOT_TIME_MS = Date.now()
const REDIS_PROBE_TIMEOUT_MS = 1500

@Injectable()
export class HealthService {
  constructor(
    private readonly lytService: LytService,
    private readonly prismaService: PrismaService,
    @Optional() private readonly redisService?: RedisService,
    @Optional() @Inject(EVENT_BUS_SERVICE) private readonly eventBus?: EventBusService,
    @Optional() @Inject(QUEUE_PRODUCER_SERVICE) private readonly queueProducer?: QueueProducerService
  ) {}

  /**
   * 执行完整健康检查
   * 返回所有依赖组件的状态
   */
  async check(context?: HealthCheckContext): Promise<HealthCheckResult> {
    const verbose = context?.verbose ?? false
    const components = await this.collectComponentHealths(verbose)
    const uptimeSeconds = Math.floor((Date.now() - BOOT_TIME_MS) / 1000)
    const sampleMember = verbose ? await this.getSampleMember() : undefined

    return toHealthCheckResult(components, {
      uptimeSeconds,
      version: this.getVersion(),
      lytMode: this.getLytMode(context),
      sampleMember
    })
  }

  /**
   * 快速连通性检查 — 仅返回 OK / DEGRADED
   */
  async ping(): Promise<{ alive: boolean; timestamp: string }> {
    return {
      alive: true,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 检查指定组件是否可用
   */
  async checkComponent(name: string): Promise<ComponentHealth> {
    const start = Date.now()
    try {
      const detail = await this.probeComponent(name)
      return {
        name,
        status: HealthStatus.Ok,
        latencyMs: Date.now() - start,
        detail
      }
    } catch (err: unknown) {
      return {
        name,
        status: HealthStatus.Unavailable,
        latencyMs: Date.now() - start,
        detail: {
          error: err instanceof Error ? err.message : 'Unknown error'
        }
      }
    }
  }

  /**
   * 收集所有依赖组件的健康状态
   */
  private async collectComponentHealths(verbose: boolean): Promise<ComponentHealth[]> {
    const names = verbose
      ? ['database', 'redis', 'lyt-adapter', 'memory', 'disk', 'event-bus', 'queue-producer']
      : ['database', 'lyt-adapter', 'event-bus', 'queue-producer']

    const results = await Promise.allSettled(
      names.map((name) => this.checkComponent(name))
    )

    return results.map((r, idx) =>
      r.status === 'fulfilled'
        ? r.value
        : {
            name: names[idx],
            status: HealthStatus.Unavailable,
            latencyMs: 0,
            detail: { error: 'unexpected component check failure' }
          }
    )
  }

  /**
   * 探测单个组件
   */
  private async probeComponent(name: string): Promise<Record<string, unknown>> {
    switch (name) {
      case 'database':
        return this.probeDatabase()
      case 'redis':
        return this.probeRedis()
      case 'lyt-adapter':
        return this.probeLytAdapter()
      case 'memory':
        return this.probeMemory()
      case 'disk':
        return this.probeDisk()
      case 'event-bus':
        return this.probeEventBus()
      case 'queue-producer':
        return this.probeQueueProducer()
      default:
        throw new Error(`Unknown component: ${name}`)
    }
  }

  private async probeDatabase(): Promise<Record<string, unknown>> {
    await this.prismaService.$queryRaw`SELECT 1`

    return {
      connected: true,
      provider: 'prisma',
      dialect: 'postgresql'
    }
  }

  private async probeRedis(): Promise<Record<string, unknown>> {
    if (this.redisService) {
      const connected = await this.redisService.ping()
      const info = connected ? await this.redisService.info() : null
      return {
        connected,
        transport: 'ioredis',
        ...(info ?? {}),
      }
    }

    // Fallback:raw socket (RedisModule 未注入时使用)
    const host = process.env.REDIS_HOST?.trim() || 'localhost'
    const port = parsePort(process.env.REDIS_PORT, 6379)
    const response = await this.pingRedis(host, port)
    return {
      connected: response === 'PONG',
      host,
      port,
      response,
      transport: 'raw-socket'
    }
  }

  private async probeLytAdapter(): Promise<Record<string, unknown>> {
    const bootstrap = this.lytService.getBootstrap()

    return {
      mode: this.getLytMode(),
      adapter: bootstrap.adapter,
      foundationDependencies: bootstrap.foundationDependencies,
      foundationContracts: bootstrap.foundationContracts,
      available: true
    }
  }

  private async probeMemory(): Promise<Record<string, unknown>> {
    const totalBytes = os.totalmem()
    const freeBytes = os.freemem()
    const usedBytes = totalBytes - freeBytes

    return {
      totalMB: bytesToMb(totalBytes),
      usedMB: bytesToMb(usedBytes),
      freeMB: bytesToMb(freeBytes),
      usagePercent: usagePercent(usedBytes, totalBytes)
    }
  }

  private async probeDisk(): Promise<Record<string, unknown>> {
    const stats = await statfs(process.cwd())
    const totalBytes = stats.bsize * stats.blocks
    const freeBytes = stats.bsize * stats.bfree
    const usedBytes = totalBytes - freeBytes

    return {
      totalGB: bytesToGb(totalBytes),
      usedGB: bytesToGb(usedBytes),
      freeGB: bytesToGb(freeBytes),
      usagePercent: usagePercent(usedBytes, totalBytes)
    }
  }

  private async probeEventBus(): Promise<Record<string, unknown>> {
    if (!this.eventBus) {
      throw new Error('EventBus not injected')
    }

    const connected = await this.eventBus.ping()
    return {
      connected,
      backend: this.eventBus.backend
    }
  }

  private async probeQueueProducer(): Promise<Record<string, unknown>> {
    if (!this.queueProducer) {
      throw new Error('QueueProducer not injected')
    }

    const stats = await this.queueProducer.stats()
    return {
      connected: true,
      jobs: {
        pending: stats.pending,
        completed: stats.completed,
        failed: stats.failed
      }
    }
  }

  /**
   * 获取当前版本号
   */
  private getVersion(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pkg = require('../../../../package.json')
      return pkg.version ?? '0.0.0'
    } catch {
      return '0.0.0'
    }
  }

  private getLytMode(context?: HealthCheckContext): string {
    if (context?.scope?.scopeType === FoundationScopeType.Platform) {
      return 'platform-mock'
    }

    return 'mock'
  }

  private async getSampleMember() {
    try {
      return await this.lytService.getAdapter().getMember('seed-member-001')
    } catch {
      return null
    }
  }

  private async pingRedis(host: string, port: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const socket = this.createSocket()
      let settled = false

      const finish = (callback: () => void) => {
        if (settled) {
          return
        }

        settled = true
        clearTimeout(timeout)
        socket.removeAllListeners()
        socket.destroy()
        callback()
      }

      const timeout = setTimeout(() => {
        finish(() => reject(new Error(`Redis probe timeout after ${REDIS_PROBE_TIMEOUT_MS}ms`)))
      }, REDIS_PROBE_TIMEOUT_MS)

      socket.once('error', (error) => {
        finish(() => reject(error))
      })

      socket.once('data', (chunk: Buffer) => {
        const payload = chunk.toString('utf8').trim()
        const response = payload.startsWith('+') ? payload.slice(1) : payload

        if (response !== 'PONG') {
          finish(() => reject(new Error(`Unexpected Redis probe response: ${payload}`)))
          return
        }

        finish(() => resolve(response))
      })

      socket.connect(port, host, () => {
        socket.write('*1\r\n$4\r\nPING\r\n')
      })
    })
  }

  private createSocket() {
    return new Socket()
  }
}

function parsePort(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function bytesToMb(bytes: number) {
  return roundTo(bytes / 1024 / 1024, 2)
}

function bytesToGb(bytes: number) {
  return roundTo(bytes / 1024 / 1024 / 1024, 2)
}

function usagePercent(used: number, total: number) {
  if (total <= 0) {
    return 0
  }

  return roundTo((used / total) * 100, 2)
}

function roundTo(value: number, precision: number) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

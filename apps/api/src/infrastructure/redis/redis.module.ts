/**
 * RedisModule — ioredis 客户端 + 健康检查
 *
 * 设计要点:
 * - 通过 forRootAsync 注入 REDIS_HOST / REDIS_PORT / REDIS_PASSWORD,
 *   使用 getEnv() 读配置 (env-validation 已在启动时校验)。
 * - 提供 IOREDIS_CLIENT token,可被 CacheModule / EventBusModule 复用。
 * - onModuleDestroy 自动 quit,避免连接泄漏。
 * - 测试可注入 IOREDIS_CLIENT_OPTIONS 或 IOREDIS_CLIENT mock token。
 */
import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Logger,
  Module,
  OnModuleDestroy,
  Provider
} from '@nestjs/common'
import Redis, { RedisOptions } from 'ioredis'

export const IOREDIS_CLIENT = Symbol.for('m5.infrastructure.redis.client')
export const IOREDIS_CLIENT_OPTIONS = Symbol.for('m5.infrastructure.redis.options')

export type RedisClient = Redis

export interface RedisModuleOptions {
  host: string
  port: number
  password?: string
  db?: number
  /** 连接超时 (ms),默认 5000 */
  connectTimeout?: number
  /** 命令超时 (ms),默认 3000 */
  commandTimeout?: number
  /** 重试策略,默认指数退避 50ms -> 2000ms,3 次后停止 */
  retryStrategy?: (times: number) => number | null
  /** 启用 ready check,默认 true */
  enableReadyCheck?: boolean
  /** key 前缀,所有 redis 命令透明加 prefix,默认 'm5:' */
  keyPrefix?: string
}

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)

  constructor(
    @Inject(IOREDIS_CLIENT) public readonly client: RedisClient
  ) {}

  async ping(): Promise<boolean> {
    try {
      const reply = await this.client.ping()
      return reply === 'PONG'
    } catch (error) {
      this.logger.warn(`Redis ping failed: ${(error as Error).message}`)
      return false
    }
  }

  async info(): Promise<{ connectedClients: number; usedMemory: string; uptimeSeconds: number } | null> {
    try {
      const raw = await this.client.info('clients')
      const memory = await this.client.info('memory')
      const server = await this.client.info('server')
      const connectedClients = extractInfoNumber(raw, 'connected_clients') ?? 0
      const usedMemory = extractInfoValue(memory, 'used_memory_human') ?? 'unknown'
      const uptimeSeconds = extractInfoNumber(server, 'uptime_in_seconds') ?? 0
      return { connectedClients, usedMemory, uptimeSeconds }
    } catch (error) {
      this.logger.warn(`Redis info failed: ${(error as Error).message}`)
      return null
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit()
    } catch (error) {
      this.logger.warn(`Redis quit failed: ${(error as Error).message}`)
      // force disconnect if quit fails
      this.client.disconnect()
    }
  }
}

const defaultOptions: Pick<RedisOptions, 'retryStrategy' | 'maxRetriesPerRequest' | 'enableReadyCheck'> = {
  retryStrategy: (times: number) => {
    if (times > 3) {
      return null // stop retrying after 3 attempts
    }
    return Math.min(50 * 2 ** times, 2000)
  },
  maxRetriesPerRequest: 1,
  enableReadyCheck: true
}

export const redisClientProvider: Provider = {
  provide: IOREDIS_CLIENT,
  inject: [IOREDIS_CLIENT_OPTIONS],
  useFactory: (options: RedisModuleOptions): RedisClient => {
    const client = new Redis({
      ...defaultOptions,
      host: options.host,
      port: options.port,
      password: options.password,
      db: options.db ?? 0,
      connectTimeout: options.connectTimeout ?? 5000,
      commandTimeout: options.commandTimeout ?? 3000,
      keyPrefix: options.keyPrefix ?? 'm5:',
      lazyConnect: false,
    } as RedisOptions)

    client.on('error', (err: Error) => {
      // swallow error event; callers await commands that reject.
      // eslint-disable-next-line no-console
      console.warn(`[RedisModule] connection error: ${err.message}`)
    })

    return client
  }
}

@Global()
@Module({})
export class RedisModule {
  static forRoot(options: RedisModuleOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: IOREDIS_CLIENT_OPTIONS,
      useValue: options,
    }
    return {
      module: RedisModule,
      providers: [optionsProvider, redisClientProvider, RedisService],
      exports: [IOREDIS_CLIENT, RedisService],
    }
  }

  static forRootAsync(asyncOptions: {
    imports?: any[]
    inject?: any[]
    useFactory: (...args: any[]) => Promise<RedisModuleOptions> | RedisModuleOptions
  }): DynamicModule {
    const optionsProvider: Provider = {
      provide: IOREDIS_CLIENT_OPTIONS,
      useFactory: asyncOptions.useFactory,
      inject: asyncOptions.inject ?? [],
    }
    return {
      module: RedisModule,
      imports: asyncOptions.imports ?? [],
      providers: [optionsProvider, redisClientProvider, RedisService],
      exports: [IOREDIS_CLIENT, RedisService],
    }
  }
}

// ── helpers ────────────────────────────────────────────────────────
function extractInfoNumber(raw: string, key: string): number | null {
  const match = new RegExp(`^${key}:([0-9]+)$`, 'm').exec(raw)
  return match ? Number(match[1]) : null
}

function extractInfoValue(raw: string, key: string): string | null {
  const match = new RegExp(`^${key}:(.*)$`, 'm').exec(raw)
  return match ? match[1] : null
}
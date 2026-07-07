/**
 * env.validation.ts — 环境变量校验与访问
 *
 * 校验必需 keys + 类型 + DATABASE_URL 协议。
 * 校验通过后,导出 `getEnv()` 提供类型安全访问可选 keys (REDIS_PASSWORD、
 * RABBITMQ_URL、MINIO_* 等)。
 */
const requiredStringKeys = [
  'JWT_SECRET',
  'DATABASE_URL',
  'REDIS_HOST',
  'LYT_MODE'
] as const

const requiredNumberKeys = ['API_PORT', 'REDIS_PORT'] as const

export function envValidation(config: Record<string, unknown>) {
  for (const key of requiredStringKeys) {
    const value = config[key]
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Missing required env: ${key}`)
    }
  }

  validateDatabaseUrl(config.DATABASE_URL)
  for (const key of requiredNumberKeys) {
    const value = config[key]
    const parsed = typeof value === 'number' ? value : Number(value)

    if (!Number.isFinite(parsed) || parsed <= 0) {
      throw new Error(`Invalid numeric env: ${key}`)
    }
  }

  return config
}

function validateDatabaseUrl(value: unknown) {
  if (typeof value !== 'string') {
    throw new Error('Missing required env: DATABASE_URL')
  }

  try {
    const url = new URL(value)
    const supportedProtocols = new Set(['postgres:', 'postgresql:'])

    if (!supportedProtocols.has(url.protocol)) {
      throw new Error(`Unsupported DATABASE_URL protocol: ${url.protocol}`)
    }
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message.startsWith('Unsupported DATABASE_URL protocol:')
        ? error.message
        : 'Invalid DATABASE_URL'
    )
  }
}

// ── 访问可选配置 ───────────────────────────────────────────────────────
//
// 这些 keys 是可选的。如果未设置,getEnv() 返回合理的 default。
// 在测试或开发环境,部分 keys 可能缺失;生产环境应该全部设置。

export interface AppEnv {
  // Redis
  REDIS_HOST: string
  REDIS_PORT: number
  REDIS_PASSWORD: string | undefined
  REDIS_DB: number
  REDIS_CACHE_DB: number
  REDIS_BULL_DB: number

  // RabbitMQ
  RABBITMQ_URL: string | undefined
  RABBITMQ_HOST: string
  RABBITMQ_PORT: number
  RABBITMQ_USER: string
  RABBITMQ_PASSWORD: string
  RABBITMQ_VHOST: string

  // MinIO (S3 兼容)
  MINIO_ENDPOINT: string | undefined
  MINIO_PORT: number
  MINIO_USER: string
  MINIO_PASSWORD: string
  MINIO_BUCKET: string
}

let cached: AppEnv | null = null

export function getEnv(): AppEnv {
  if (cached) return cached
  const cfg = process.env
  cached = {
    REDIS_HOST: required(cfg.REDIS_HOST, 'REDIS_HOST'),
    REDIS_PORT: positiveInt(cfg.REDIS_PORT, 'REDIS_PORT'),
    REDIS_PASSWORD: cfg.REDIS_PASSWORD?.trim() || undefined,
    REDIS_DB: positiveInt(cfg.REDIS_DB, 'REDIS_DB', 0),
    REDIS_CACHE_DB: positiveInt(cfg.REDIS_CACHE_DB, 'REDIS_CACHE_DB', 1),
    REDIS_BULL_DB: positiveInt(cfg.REDIS_BULL_DB, 'REDIS_BULL_DB', 2),

    RABBITMQ_URL: cfg.RABBITMQ_URL?.trim() || undefined,
    RABBITMQ_HOST: cfg.RABBITMQ_HOST?.trim() || 'localhost',
    RABBITMQ_PORT: positiveInt(cfg.RABBITMQ_PORT, 'RABBITMQ_PORT', 5672),
    RABBITMQ_USER: cfg.RABBITMQ_USER?.trim() || 'guest',
    RABBITMQ_PASSWORD: cfg.RABBITMQ_PASSWORD?.trim() || 'guest',
    RABBITMQ_VHOST: cfg.RABBITMQ_VHOST?.trim() || '/',

    MINIO_ENDPOINT: cfg.MINIO_ENDPOINT?.trim() || undefined,
    MINIO_PORT: positiveInt(cfg.MINIO_PORT, 'MINIO_PORT', 9000),
    MINIO_USER: cfg.MINIO_USER?.trim() || 'minio',
    MINIO_PASSWORD: cfg.MINIO_PASSWORD?.trim() || 'minio123',
    MINIO_BUCKET: cfg.MINIO_BUCKET?.trim() || 'm5-dev',
  }
  return cached
}

/** 重置缓存 (测试时切 env 后调用) */
export function resetEnvCache(): void {
  cached = null
}

function required(value: string | undefined, key: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing required env: ${key}`)
  }
  return value
}

function positiveInt(value: string | undefined, key: string, fallback?: number): number {
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback
    throw new Error(`Missing required env: ${key}`)
  }
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    throw new Error(`Invalid numeric env: ${key}`)
  }
  return parsed
}
import { SetMetadata } from '@nestjs/common'

export interface RateLimitMetadata {
  limit: number
  windowSeconds: number
  blockSeconds?: number
  prefix?: string
  scopeBy?: Array<'tenant' | 'actor' | 'ip' | 'route'>
}

export const RATE_LIMIT_METADATA_KEY = 'trust-governance:rate-limit'

export const RequireRateLimit = (metadata: RateLimitMetadata) =>
  SetMetadata(RATE_LIMIT_METADATA_KEY, metadata)

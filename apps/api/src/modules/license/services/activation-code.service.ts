/**
 * 付费授权 - 激活码服务 (V9 需求 2 · V10 Day 17 Phase 88)
 *
 * 功能:
 * - 激活码生成 (加密安全随机)
 * - 激活码验证与核销
 * - 防暴力破解 (Redis 限流)
 */

import { Injectable, Inject } from '@nestjs/common'
import { createHash, randomBytes } from 'crypto'
import type { Redis } from 'ioredis'
type RedisClientType = Redis

export interface ActivationCodePayload {
  code: string // 用户输入的激活码 (如: XXXX-XXXX-XXXX-XXXX)
  scope: string
  tenantId: string
  storeId?: string
}

export interface ActivationResult {
  success: boolean
  licenseId?: string
  message: string
  expiresAt?: Date
}

export interface GenerateCodeInput {
  scope: string
  durationDays: number
  quota?: number
  level: 'tenant' | 'store'
  metadata?: Record<string, unknown>
}

@Injectable()
export class ActivationCodeService {
  private readonly CODE_PREFIX = 'LIC'
  private readonly CODE_GROUPS = 4 // XXXX-XXXX-XXXX-XXXX
  private readonly GROUP_LENGTH = 4
  private readonly MAX_ATTEMPTS = 5 // 5分钟内最多5次尝试
  private readonly BLOCK_DURATION = 300 // 5分钟锁定

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: RedisClientType | null,
  ) {}

  /**
   * 生成激活码
   */
  async generateCode(input: GenerateCodeInput): Promise<string> {
    // 生成随机熵
    const entropy = randomBytes(16)
    
    // 构建元数据
    const metadata = {
      scope: input.scope,
      durationDays: input.durationDays,
      quota: input.quota,
      level: input.level,
      createdAt: new Date().toISOString(),
      ...input.metadata,
    }
    
    // 存储到 Redis (设置过期时间)
    const code = this.formatCode(entropy)
    const codeHash = this.hashCode(code)
    
    if (this.redis?.status === 'ready') {
      const key = `activation:code:${codeHash}`
      await this.redis.setex(key, input.durationDays * 86400, JSON.stringify(metadata))
    }
    
    return code
  }

  /**
   * 验证并核销激活码
   */
  async verifyAndActivate(payload: ActivationCodePayload): Promise<ActivationResult> {
    // 1. 防暴力破解检查
    const attemptKey = `activation:attempts:${payload.tenantId}`
    const attempts = await this.getAttempts(attemptKey)
    
    if (attempts >= this.MAX_ATTEMPTS) {
      return {
        success: false,
        message: '尝试次数过多，请5分钟后再试',
      }
    }
    
    // 2. 验证激活码格式
    const codeHash = this.hashCode(payload.code)
    
    // 3. 从 Redis 获取元数据
    if (this.redis?.status !== 'ready') {
      await this.incrementAttempts(attemptKey)
      return {
        success: false,
        message: '激活服务暂时不可用，请稍后重试',
      }
    }
    
    const key = `activation:code:${codeHash}`
    const metadataStr = await this.redis.get(key)
    
    if (!metadataStr) {
      await this.incrementAttempts(attemptKey)
      return {
        success: false,
        message: '激活码无效或已过期',
      }
    }
    
    // 4. 解析并验证元数据
    const metadata = JSON.parse(metadataStr)
    
    if (metadata.scope !== payload.scope) {
      await this.incrementAttempts(attemptKey)
      return {
        success: false,
        message: `激活码不适用于此服务 (需要: ${payload.scope})`,
      }
    }
    
    // 5. 核销激活码 (删除 Redis 记录)
    await this.redis.del(key)
    
    // 6. 生成 license ID
    const licenseId = `lic-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    
    // 7. 清除尝试计数
    await this.clearAttempts(attemptKey)
    
    // 8. 计算过期时间
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + metadata.durationDays)
    
    return {
      success: true,
      licenseId,
      message: '激活成功',
      expiresAt,
    }
  }

  // ========== 私有方法 ==========

  private formatCode(entropy: Buffer): string {
    const hex = entropy.toString('hex').toUpperCase()
    const groups: string[] = []
    
    for (let i = 0; i < this.CODE_GROUPS; i++) {
      const start = i * this.GROUP_LENGTH
      groups.push(hex.substring(start, start + this.GROUP_LENGTH))
    }
    
    // 添加校验前缀
    return `${this.CODE_PREFIX}-${groups.join('-')}`
  }

  private hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex').substring(0, 16)
  }

  private async getAttempts(key: string): Promise<number> {
    if (this.redis?.status !== 'ready') return 0
    const val = await this.redis.get(key)
    return val ? parseInt(val, 10) : 0
  }

  private async incrementAttempts(key: string): Promise<void> {
    if (this.redis?.status !== 'ready') return
    const multi = this.redis.multi()
    multi.incr(key)
    multi.expire(key, this.BLOCK_DURATION)
    await multi.exec()
  }

  private async clearAttempts(key: string): Promise<void> {
    if (this.redis?.status !== 'ready') return
    await this.redis.del(key)
  }

  /**
   * 验证激活码格式
   */
  validateFormat(code: string): boolean {
    // 格式: LIC-XXXX-XXXX-XXXX-XXXX
    const pattern = new RegExp(
      `^${this.CODE_PREFIX}-[A-Z0-9]{${this.GROUP_LENGTH}}(-[A-Z0-9]{${this.GROUP_LENGTH}}){${this.CODE_GROUPS - 1}}$`
    )
    return pattern.test(code)
  }
}

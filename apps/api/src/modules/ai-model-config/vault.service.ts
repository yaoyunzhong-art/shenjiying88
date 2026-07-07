/**
 * Vault 密钥管理服务 (V9 需求 1 · V10 Day 2)
 *
 * 用途: 生产环境从 Vault 获取加密密钥
 * 回退: 开发环境使用 env 变量
 * 安全: 密钥永不在代码中硬编码
 */

import { Injectable, Logger } from '@nestjs/common'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'

// 开发环境回退密钥 (仅用于开发!)
const DEV_FALLBACK_KEY = process.env.AI_MODEL_ENCRYPTION_KEY || 'dev-key-32-chars-long-for-testing-only'

@Injectable()
export class VaultService {
  private readonly logger = new Logger(VaultService.name)
  private cachedKey: string | null = null
  private keyFetchedAt: Date | null = null
  private readonly CACHE_TTL_MS = 5 * 60 * 1000 // 5分钟缓存

  /**
   * 获取加密密钥
   * - 生产: 从 Vault 获取
   * - 开发: 使用 env 变量回退
   */
  async getEncryptionKey(): Promise<string> {
    // 检查缓存
    if (this.cachedKey && this.keyFetchedAt) {
      const age = Date.now() - this.keyFetchedAt.getTime()
      if (age < this.CACHE_TTL_MS) {
        this.logger.debug('Using cached encryption key')
        return this.cachedKey
      }
    }

    // 尝试从 Vault 获取
    try {
      const vaultKey = await this.fetchFromVault()
      this.cachedKey = vaultKey
      this.keyFetchedAt = new Date()
      this.logger.log('Successfully fetched encryption key from Vault')
      return vaultKey
    } catch(error: any){
      this.logger.warn(`Failed to fetch from Vault: ${error.message}`)
      
      // 检查环境
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Vault unavailable in production - cannot start without encryption key')
      }
      
      // 开发环境使用回退
      this.logger.warn('Using development fallback key - DO NOT USE IN PRODUCTION')
      this.cachedKey = DEV_FALLBACK_KEY
      this.keyFetchedAt = new Date()
      return DEV_FALLBACK_KEY
    }
  }

  /**
   * 从 Vault 获取密钥
   * (这里实现Vault API调用)
   */
  private async fetchFromVault(): Promise<string> {
    // 检查 Vault 是否配置
    const vaultAddr = process.env.VAULT_ADDR
    const vaultToken = process.env.VAULT_TOKEN
    const vaultPath = process.env.VAULT_SECRET_PATH || 'secret/data/ai-model-config'

    if (!vaultAddr || !vaultToken) {
      throw new Error('Vault not configured (VAULT_ADDR or VAULT_TOKEN missing)')
    }

    // 调用 Vault API
    const response = await fetch(`${vaultAddr}/v1/${vaultPath}`, {
      method: 'GET',
      headers: {
        'X-Vault-Token': vaultToken,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Vault API error: ${response.status} ${response.statusText}`)
    }

    const data: any = await response.json()
    const key = data.data?.data?.encryption_key || data.data?.encryption_key

    if (!key) {
      throw new Error('Encryption key not found in Vault response')
    }

    return key
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ ok: boolean; source: string }> {
    try {
      const key = await this.getEncryptionKey()
      return {
        ok: !!key,
        source: key === DEV_FALLBACK_KEY ? 'dev-fallback' : 'vault',
      }
    } catch(error: any){
      return { ok: false, source: 'error' }
    }
  }
}

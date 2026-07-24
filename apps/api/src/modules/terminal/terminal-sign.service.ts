/**
 * terminal-sign.service.ts — 终端签名验签服务
 *
 * WP-12A: 终端三合一底座 — 签名验签基础逻辑
 * - HMAC-SHA256 签名生成
 * - 签名验证
 * - 时间戳防重放攻击
 * - 终端请求签名
 *
 * 注意: 当前为基于密钥对的对称签名（HMAC-SHA256）。
 * 实际生产环境应升级为 RSA/ECDSA 非对称签名。
 */

import { Injectable, Logger } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'node:crypto'

// ── 常量 ──
const DEFAULT_SIGN_ALGORITHM = 'sha256'
const DEFAULT_REPLAY_WINDOW_MS = 5 * 60 * 1000 // 5 分钟
const TERMINAL_SIGN_VERSION = 'v1'

// ── 密钥存储（内存，生产应替换为密钥管理服务） ──
const terminalSecrets = new Map<string, string>()

/**
 * 签名结果
 */
export interface SignResult {
  signature: string
  timestamp: number
  version: string
  algorithm: string
}

/**
 * 验签结果
 */
export interface VerifyResult {
  valid: boolean
  reason?: string
}

@Injectable()
export class TerminalSignService {
  private readonly logger = new Logger(TerminalSignService.name)

  // ═══════════════════════════════════════════════════════════════════
  // 密钥管理
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 设置终端密钥
   * 每个终端应有独立密钥
   */
  setTerminalSecret(terminalId: string, secret: string): void {
    if (secret.length < 16) {
      throw new Error('Terminal secret must be at least 16 characters')
    }
    terminalSecrets.set(terminalId, secret)
    this.logger.log(`Secret set for terminal: ${terminalId}`)
  }

  /**
   * 删除终端密钥
   */
  removeTerminalSecret(terminalId: string): boolean {
    return terminalSecrets.delete(terminalId)
  }

  /**
   * 检查终端是否有密钥
   */
  hasTerminalSecret(terminalId: string): boolean {
    return terminalSecrets.has(terminalId)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 签名生成
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 生成终端请求签名
   *
   * @param terminalId 终端 ID
   * @param payload 请求载荷（JSON 序列化后的字符串）
   * @param timestamp 时间戳（毫秒）, 默认当前时间
   * @returns 签名结果
   */
  signRequest(
    terminalId: string,
    payload: string,
    timestamp?: number,
  ): SignResult {
    const secret = terminalSecrets.get(terminalId)
    if (!secret) {
      throw new Error(`No secret configured for terminal: ${terminalId}`)
    }

    const ts = timestamp ?? Date.now()
    const message = `${terminalId}:${ts}:${payload}`
    const signature = createHmac(DEFAULT_SIGN_ALGORITHM, secret)
      .update(message)
      .digest('hex')

    return {
      signature,
      timestamp: ts,
      version: TERMINAL_SIGN_VERSION,
      algorithm: `HMAC-${DEFAULT_SIGN_ALGORITHM.toUpperCase()}`,
    }
  }

  /**
   * 生成心跳签名（简化的 payload）
   */
  signHeartbeat(terminalId: string, latencyMs: number): SignResult {
    const payload = JSON.stringify({ terminalId, latencyMs })
    return this.signRequest(terminalId, payload)
  }

  /**
   * 生成队列操作签名
   */
  signQueueOperation(
    terminalId: string,
    operation: string,
    queueEntryId: string,
  ): SignResult {
    const payload = JSON.stringify({ operation, queueEntryId })
    return this.signRequest(terminalId, payload)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 签名验证
  // ═══════════════════════════════════════════════════════════════════

  /**
   * 验证终端请求签名
   *
   * @param terminalId 终端 ID
   * @param payload 原始请求载荷
   * @param signature 签名值
   * @param timestamp 签名时的时间戳
   * @param replayWindowMs 防重放时间窗口（默认 5 分钟）
   * @returns 验证结果
   */
  verifyRequest(
    terminalId: string,
    payload: string,
    signature: string,
    timestamp: number,
    replayWindowMs: number = DEFAULT_REPLAY_WINDOW_MS,
  ): VerifyResult {
    // 1. 检查终端密钥是否存在
    const secret = terminalSecrets.get(terminalId)
    if (!secret) {
      return { valid: false, reason: 'No secret configured for terminal' }
    }

    // 2. 防重放攻击：检查时间戳是否在有效窗口内
    const now = Date.now()
    if (timestamp > now + 30000) {
      // 允许 30 秒的未来偏差（时钟同步误差）
      return { valid: false, reason: 'Timestamp is in the future' }
    }
    if (now - timestamp > replayWindowMs) {
      return {
        valid: false,
        reason: `Signature expired (window: ${replayWindowMs}ms)`,
      }
    }

    // 3. 重新计算签名
    const message = `${terminalId}:${timestamp}:${payload}`
    const expectedSignature = createHmac(DEFAULT_SIGN_ALGORITHM, secret)
      .update(message)
      .digest('hex')

    // 4. 常量时间比较，防止时序攻击
    if (signature.length !== expectedSignature.length) {
      return { valid: false, reason: 'Signature length mismatch' }
    }

    try {
      const expectedBuf = Buffer.from(expectedSignature, 'hex')
      const actualBuf = Buffer.from(signature, 'hex')
      const match = timingSafeEqual(expectedBuf, actualBuf)
      return match
        ? { valid: true }
        : { valid: false, reason: 'Signature mismatch' }
    } catch {
      return { valid: false, reason: 'Invalid signature encoding' }
    }
  }

  /**
   * 验证心跳签名
   */
  verifyHeartbeat(
    terminalId: string,
    latencyMs: number,
    signature: string,
    timestamp: number,
  ): VerifyResult {
    const payload = JSON.stringify({ terminalId, latencyMs })
    return this.verifyRequest(terminalId, payload, signature, timestamp)
  }

  /**
   * 清除所有密钥（测试用）
   */
  resetForTests(): void {
    terminalSecrets.clear()
  }
}

/**
 * AES-256-GCM 加密工具 (V9 需求 1)
 *
 * 用途：加密存储 API 密钥、endpoint URL
 * 算法：AES-256-GCM (authenticated encryption)
 * Key 来源：Vault / env 变量 (生产环境 Vault)
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 12
const SALT_LENGTH = 16
const AUTH_TAG_LENGTH = 16

/**
 * 派生加密密钥
 * @param password 主密码 (从 Vault / env 获取)
 * @param salt 盐
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH)
}

/**
 * 获取加密主密钥
 * - 生产环境从 Vault 获取 (AI_MODEL_ENCRYPTION_KEY)
 * - 开发/测试环境从环境变量 fallback
 *
 * Phase-FP P0-C1 修复: 生产环境必须设置 env 变量, 不允许 fallback 到硬编码 dev key
 * 防止密钥泄露到 GitHub 后被攻击者利用解密所有租户的 secret 字段
 */
function getMasterKey(): string {
  const explicit = process.env.AI_MODEL_ENCRYPTION_KEY || process.env.VAULT_AI_MODEL_KEY
  if (explicit) return explicit

  // 生产环境强制要求 env 变量
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[encryption] FATAL: AI_MODEL_ENCRYPTION_KEY must be set in production (refuse to use dev fallback key)',
    )
  }
  // 测试/开发环境允许 fallback (便于跑 vitest)
  return 'dev-only-key-DO-NOT-USE-IN-PROD-shenjiying88-2026'
}

/**
 * 加密敏感字段
 * @param plaintext 明文
 * @returns Base64 编码的密文 (salt:iv:authTag:ciphertext)
 */
export function encryptField(plaintext: string): string {
  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = deriveKey(getMasterKey(), salt)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  // 拼接: salt (16) + iv (12) + authTag (16) + ciphertext
  const combined = Buffer.concat([salt, iv, authTag, encrypted])
  return combined.toString('base64')
}

/**
 * 解密敏感字段
 * @param ciphertext Base64 编码的密文
 * @returns 明文
 */
export function decryptField(ciphertext: string): string {
  const combined = Buffer.from(ciphertext, 'base64')

  const salt = combined.subarray(0, SALT_LENGTH)
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const authTag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH,
  )
  const encrypted = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH)

  const key = deriveKey(getMasterKey(), salt)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ])
  return decrypted.toString('utf8')
}

/**
 * 脱敏 API 密钥 (用于 API 响应)
 * @param ciphertext 密文
 * @returns 脱敏后的展示 (sk-***-xxxx)
 */
export function maskApiKey(ciphertext: string): string {
  return `sk-***-${ciphertext.slice(-4)}`
}
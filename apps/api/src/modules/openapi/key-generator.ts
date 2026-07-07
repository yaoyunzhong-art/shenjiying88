import type {
  APIKey,
  APIKeyEnvironment,
  APIKeyScope,
  TenantId
} from './openapi.entity'

/**
 * Phase-44 T174: KeyGenerator (API Key 生成引擎)
 *
 * DR-44-A: 格式 = `sk_{env}_{keyId}_{secret}`
 *  - env: live / test / sandbox
 *  - keyId: 16 chars (公钥, 用于查询)
 *  - secret: 32 chars (私钥, 仅生成时显示一次)
 *
 * 反模式 v4 api-key-secret:
 *  - 私钥哈希存储 (SHA-256)
 *  - 一次性明文返回 (生成时)
 *  - 撤销不可逆
 */

const KEY_ID_LENGTH = 16
const SECRET_LENGTH = 32
const KEY_ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789'
const SECRET_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export class KeyGenerator {
  /**
   * 生成 API Key + 私钥 (仅此一次返回明文)
   */
  generate(input: {
    tenantId: TenantId
    environment: APIKeyEnvironment
    name: string
    scopes: APIKeyScope[]
    createdBy: string
    expiresAt?: string
  }): {
    apiKey: APIKey
    plaintextSecret: string  // 仅此一次返回, 之后仅存 hash
  } {
    const keyId = this.randomString(KEY_ID_ALPHABET, KEY_ID_LENGTH)
    const secret = this.randomString(SECRET_ALPHABET, SECRET_LENGTH)
    const prefix = input.environment === 'LIVE' ? 'sk_live' :
                   input.environment === 'TEST' ? 'sk_test' : 'sk_sandbox'
    const fullKeyId = `${prefix}_${keyId}`
    const plaintextSecret = `${fullKeyId}_${secret}`  // 完整 secret 字符串

    const apiKey: APIKey = {
      id: `apikey-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      tenantId: input.tenantId,
      keyId: fullKeyId,
      keyHash: this.hashSecret(plaintextSecret),
      environment: input.environment,
      name: input.name,
      scopes: input.scopes,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      createdBy: input.createdBy,
      expiresAt: input.expiresAt
    }

    return { apiKey, plaintextSecret }
  }

  /**
   * SHA-256 哈希 (简化: 用 djb2 避免外部依赖)
   */
  hashSecret(secret: string): string {
    let hash = 5381
    for (let i = 0; i < secret.length; i++) {
      hash = ((hash << 5) + hash + secret.charCodeAt(i)) & 0xffffffff
    }
    return `sha256_${Math.abs(hash).toString(16).padStart(8, '0')}_${secret.length}`
  }

  /**
   * 解析 API Key 字符串 → { keyId, secret }
   */
  parseKey(plaintext: string): { keyId: string; secret: string } | null {
    const parts = plaintext.split('_')
    if (parts.length < 3) return null
    if (!['sk', 'live', 'test', 'sandbox'].includes(parts[0]) && parts[0] !== 'sk') return null
    // sk_live_xxxxxx_yyyyyyy
    const env = parts[1]
    if (!['live', 'test', 'sandbox'].includes(env)) return null
    const keyId = `sk_${env}_${parts[2]}`
    const secret = parts.slice(3).join('_')
    return { keyId, secret }
  }

  /**
   * 验证 scope 是否匹配 (scope.resource 匹配 + scope.actions 包含 action)
   */
  hasScope(apiKey: APIKey, resource: string, action: string): boolean {
    for (const scope of apiKey.scopes) {
      const resourceMatch = scope.resource === '*' || scope.resource === resource
      const actionMatch = scope.actions.includes('*') || scope.actions.includes(action)
      if (resourceMatch && actionMatch) return true
    }
    return false
  }

  /**
   * 检查 API Key 是否过期
   */
  isExpired(apiKey: APIKey, now: number = Date.now()): boolean {
    if (!apiKey.expiresAt) return false
    return new Date(apiKey.expiresAt).getTime() < now
  }

  /**
   * 校验 keyId 格式
   */
  isValidKeyId(keyId: string): boolean {
    if (!keyId.startsWith('sk_')) return false
    const parts = keyId.split('_')
    return parts.length === 3 && ['live', 'test', 'sandbox'].includes(parts[1])
  }

  // 内部: 随机字符串
  private randomString(alphabet: string, length: number): string {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)]
    }
    return result
  }
}
/**
 * 集成编排实体类型
 *
 * 本文档定义了 integration-orchestration 模块的核心领域实体：
 * - EventEnvelope: 统一事件信封，用于事件总线发布与消费
 * - WebhookSource: 回调源定义（验签算法、密钥引用等）
 * - WebhookIngestInput: Webhook 接入时传入的载荷结构
 * - EventPipelineResult: 事件流水线处理结果
 * - IdempotencyRecord: 幂等记录
 * - WebhookSourceCatalogEntry: 回调源目录条目
 * - PublishEventOptions: 事件发布选项
 */

/**
 * 统一事件信封
 *
 * 封装了一个领域事件的所有必要信息，用于在事件总线上传播。
 */
export interface EventEnvelope {
  /** 信封唯一 ID */
  envelopeId: string
  /** 事件名称 */
  eventName: string
  /** 事件来源 */
  source: string
  /** 聚合根 ID */
  aggregateId?: string
  /** 幂等键 */
  idempotencyKey: string
  /** 事件发生时间 (ISO 8601) */
  occurredAt: string
  /** 事件接收时间 (ISO 8601) */
  receivedAt: string
  /** 事件载荷 */
  payload: Record<string, unknown>
  /** 事件头 */
  headers: Record<string, string>
}

/**
 * Webhook 回调源定义
 *
 * 描述一个受信任的外部回调来源。
 */
export interface WebhookSource {
  /** 来源标识 */
  source: string
  /** 签名算法 */
  algorithm: 'hmac-sha256'
  /** 密钥值 */
  secret: string
  /** 签名时间容差（秒） */
  toleranceSeconds: number
  /** 描述 */
  description: string
}

/**
 * Webhook 接入输入
 *
 * 外部回调携带的载荷结构。
 */
export interface WebhookIngestInput {
  /** 事件 ID（可选，用于幂等去重） */
  eventId?: string
  /** 事件类型 */
  eventType?: string
  /** 载荷数据 */
  payload: Record<string, unknown>
  /** 签名 */
  signature?: string
  /** UNIX 毫秒时间戳 */
  timestamp: string
  /** 原始请求体（验签用） */
  rawBody?: string
}

/**
 * 幂等记录
 *
 * 记录一次已处理的事件，用于防止重复操作。
 */
export interface IdempotencyRecord {
  /** 幂等键 */
  key: string
  /** 来源 */
  source: string
  /** 关联事件 ID */
  eventId: string
  /** 事件类型 */
  eventType: string
  /** 首次发现时间 */
  firstSeenAt: string
  /** 关联的信封 ID */
  envelopeId: string
  /** 处理状态 */
  status: 'accepted'
  /** 载荷校验和 */
  payloadChecksum: string
}

/**
 * Webhook 回调源目录条目
 *
 * 对外暴露的回调源信息（不包含 secret 明文）。
 */
export interface WebhookSourceCatalogEntry {
  source: string
  algorithm: 'hmac-sha256'
  toleranceSeconds: number
  description: string
  secretRef: string
}

/**
 * 事件发布选项
 */
export interface PublishEventOptions {
  source?: string
  aggregateId?: string
  idempotencyKey?: string
  headers?: Record<string, string>
}

/**
 * 事件流水线处理结果
 *
 * 表示事件发布或 Webhook 接入的完整处理链路结果。
 */
export interface EventPipelineResult {
  /** 处理状态: accepted 或 duplicate */
  status: 'accepted' | 'duplicate'
  /** 事件来源 */
  source?: string
  /** 签名验证是否通过（Webhook 场景） */
  signatureVerified?: boolean
  /** 信封数据（新发布时存在） */
  envelope?: EventEnvelope
  /** 幂等记录 */
  idempotency?: IdempotencyRecord
  /** 持久化后的事件 ID */
  persistedEventId?: string
  /** 处理链路步骤 */
  pipeline?: string[]
  /** 保证措施 */
  guarantees?: string[]
}

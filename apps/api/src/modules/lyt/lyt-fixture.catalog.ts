export type LytFixtureKey =
  | 'member-query'
  | 'order-query'
  | 'payment-success-webhook'
  | 'gate-pass-webhook'
  | 'device-status-query'

export type LytFixtureTransport = 'api' | 'webhook'
export type LytFixtureCapability = 'member' | 'order' | 'payment' | 'gate' | 'device'
export type LytFixtureValidationStatus = 'ready-for-rehearsal' | 'needs-sample-completion'
export type LytFixtureRiskLevel = 'high' | 'medium'

export interface LytFixtureCatalogItem {
  key: LytFixtureKey
  title: string
  transport: LytFixtureTransport
  capability: LytFixtureCapability
  riskLevel: LytFixtureRiskLevel
  method: 'GET' | 'POST'
  path: string
  recommendedUsage: string
  eventType?: string
  mappingVersion: string
  requiredRawFields: string[]
  recommendedRawFields: string[]
  requiredHeaders: string[]
  recommendedHeaders: string[]
  requiredQueryParams: string[]
  recommendedQueryParams: string[]
  standardFieldChecklist: string[]
  schemaChecklist: string[]
  archiveChecklist: string[]
  samplePayload: Record<string, unknown>
  sampleHeaders: Record<string, string>
  sampleQueryParams: Record<string, string>
}

const LYT_MAPPING_VERSION = 'lyt-field-mapping-spec-v1'
const LYT_ARCHIVE_CHECKLIST = [
  'source',
  'tenantId',
  'brandId',
  'storeId',
  'requestId',
  'signatureStatus',
  'idempotencyKey',
  'occurredAt',
  'receivedAt',
  'rawPayload',
  'mappingVersion'
] as const

const FIXTURE_CATALOG: LytFixtureCatalogItem[] = [
  {
    key: 'member-query',
    title: '会员查询样例',
    transport: 'api',
    capability: 'member',
    riskLevel: 'medium',
    method: 'GET',
    path: '/members/{memberId}',
    recommendedUsage: '对照会员查询字段映射与身份字段保留策略',
    mappingVersion: LYT_MAPPING_VERSION,
    requiredRawFields: ['tenantId', 'brandId', 'storeId', 'member_id', 'mobile', 'updated_at'],
    recommendedRawFields: ['member_code', 'nick_name', 'level_code'],
    requiredHeaders: ['authorization'],
    recommendedHeaders: ['x-request-id'],
    requiredQueryParams: [],
    recommendedQueryParams: [],
    standardFieldChecklist: ['externalMemberId', 'memberCode', 'mobile', 'nickname', 'levelCode', 'updatedAt'],
    schemaChecklist: ['method', 'path-param:memberId', 'headers', 'response-body'],
    archiveChecklist: [...LYT_ARCHIVE_CHECKLIST],
    samplePayload: {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-demo-001',
      member_id: 'member-001',
      member_code: 'M-001',
      mobile: '13800000000',
      nick_name: '体验会员',
      level_code: 'GOLD',
      updated_at: '2026-06-14T10:00:00.000Z'
    },
    sampleHeaders: {
      authorization: 'Bearer fixture-member-token'
    },
    sampleQueryParams: {}
  },
  {
    key: 'order-query',
    title: '订单查询样例',
    transport: 'api',
    capability: 'order',
    riskLevel: 'medium',
    method: 'GET',
    path: '/orders/{orderId}',
    recommendedUsage: '对照订单状态、金额与支付时间的标准化规则',
    mappingVersion: LYT_MAPPING_VERSION,
    requiredRawFields: ['tenantId', 'brandId', 'storeId', 'order_id', 'order_no', 'amount', 'status'],
    recommendedRawFields: ['member_id', 'discount_amount', 'paid_at'],
    requiredHeaders: ['authorization'],
    recommendedHeaders: ['x-request-id'],
    requiredQueryParams: [],
    recommendedQueryParams: [],
    standardFieldChecklist: ['externalOrderId', 'orderNo', 'memberId', 'amount', 'payableAmount', 'status', 'paidAt'],
    schemaChecklist: ['method', 'path-param:orderId', 'headers', 'response-body'],
    archiveChecklist: [...LYT_ARCHIVE_CHECKLIST],
    samplePayload: {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-demo-001',
      order_id: 'order-001',
      order_no: 'SO-20260614-001',
      member_id: 'member-001',
      amount: 128,
      discount_amount: 20,
      payable_amount: 108,
      status: 'SUCCESS',
      paid_at: '2026-06-14T10:05:00.000Z'
    },
    sampleHeaders: {
      authorization: 'Bearer fixture-order-token'
    },
    sampleQueryParams: {}
  },
  {
    key: 'payment-success-webhook',
    title: '支付成功回调样例',
    transport: 'webhook',
    capability: 'payment',
    riskLevel: 'high',
    method: 'POST',
    path: '/webhooks/payment-success',
    recommendedUsage: '用于 payment.success 标准化事件演练与 raw payload 归档',
    eventType: 'payment.success',
    mappingVersion: LYT_MAPPING_VERSION,
    requiredRawFields: ['tenantId', 'brandId', 'storeId', 'requestId', 'occurredAt', 'paymentId', 'orderId', 'transactionNo', 'amount'],
    recommendedRawFields: ['currency'],
    requiredHeaders: ['signature', 'timestamp'],
    recommendedHeaders: ['x-lyt-source'],
    requiredQueryParams: [],
    recommendedQueryParams: ['traceId'],
    standardFieldChecklist: ['externalPaymentId', 'externalOrderId', 'paymentStatus', 'transactionNo', 'amount', 'occurredAt'],
    schemaChecklist: ['headers', 'event-metadata', 'payload-body', 'signature-validation'],
    archiveChecklist: [...LYT_ARCHIVE_CHECKLIST],
    samplePayload: {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-demo-001',
      requestId: 'req-pay-001',
      occurredAt: '2026-06-14T10:06:00.000Z',
      paymentId: 'payment-001',
      orderId: 'order-001',
      transactionNo: 'txn-001',
      amount: 108,
      currency: 'CNY'
    },
    sampleHeaders: {
      signature: 'fixture:payment-success-webhook',
      timestamp: '2026-06-14T10:06:30.000Z'
    },
    sampleQueryParams: {}
  },
  {
    key: 'gate-pass-webhook',
    title: '门闸通行回调样例',
    transport: 'webhook',
    capability: 'gate',
    riskLevel: 'high',
    method: 'POST',
    path: '/webhooks/gate-pass',
    recommendedUsage: '用于 gate.pass 标准化事件演练与现场通行记录归档',
    eventType: 'gate.pass',
    mappingVersion: LYT_MAPPING_VERSION,
    requiredRawFields: ['tenantId', 'brandId', 'storeId', 'requestId', 'occurredAt', 'gateId', 'memberId', 'passCode', 'passResult'],
    recommendedRawFields: ['deviceId'],
    requiredHeaders: ['signature', 'timestamp'],
    recommendedHeaders: ['x-lyt-source'],
    requiredQueryParams: [],
    recommendedQueryParams: ['traceId'],
    standardFieldChecklist: ['externalGateId', 'externalMemberId', 'passCode', 'passResult', 'occurredAt', 'requestId'],
    schemaChecklist: ['headers', 'event-metadata', 'payload-body', 'signature-validation'],
    archiveChecklist: [...LYT_ARCHIVE_CHECKLIST],
    samplePayload: {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-demo-001',
      requestId: 'req-gate-001',
      occurredAt: '2026-06-14T10:08:00.000Z',
      gateId: 'gate-a',
      memberId: 'member-001',
      passCode: 'PASS-001',
      passResult: 'ALLOWED'
    },
    sampleHeaders: {
      signature: 'fixture:gate-pass-webhook',
      timestamp: '2026-06-14T10:08:30.000Z'
    },
    sampleQueryParams: {}
  },
  {
    key: 'device-status-query',
    title: '设备状态查询样例',
    transport: 'api',
    capability: 'device',
    riskLevel: 'medium',
    method: 'GET',
    path: '/devices/{deviceId}/status',
    recommendedUsage: '对照设备在线状态、心跳与固件版本映射',
    mappingVersion: LYT_MAPPING_VERSION,
    requiredRawFields: ['tenantId', 'brandId', 'storeId', 'device_id', 'device_status', 'last_heartbeat_at'],
    recommendedRawFields: ['device_type', 'firmware_version'],
    requiredHeaders: ['authorization'],
    recommendedHeaders: ['x-request-id'],
    requiredQueryParams: [],
    recommendedQueryParams: [],
    standardFieldChecklist: ['externalDeviceId', 'deviceStatus', 'deviceType', 'firmwareVersion', 'lastHeartbeatAt'],
    schemaChecklist: ['method', 'path-param:deviceId', 'headers', 'response-body'],
    archiveChecklist: [...LYT_ARCHIVE_CHECKLIST],
    samplePayload: {
      tenantId: 'tenant-demo',
      brandId: 'brand-demo',
      storeId: 'store-demo-001',
      device_id: 'device-001',
      device_status: 'ONLINE',
      device_type: 'GATE_READER',
      firmware_version: '1.0.3',
      last_heartbeat_at: '2026-06-14T10:09:00.000Z'
    },
    sampleHeaders: {
      authorization: 'Bearer fixture-device-token'
    },
    sampleQueryParams: {}
  }
]

function cloneFixture(item: LytFixtureCatalogItem): LytFixtureCatalogItem {
  return {
    ...item,
    requiredRawFields: [...item.requiredRawFields],
    recommendedRawFields: [...item.recommendedRawFields],
    requiredHeaders: [...item.requiredHeaders],
    recommendedHeaders: [...item.recommendedHeaders],
    requiredQueryParams: [...item.requiredQueryParams],
    recommendedQueryParams: [...item.recommendedQueryParams],
    standardFieldChecklist: [...item.standardFieldChecklist],
    schemaChecklist: [...item.schemaChecklist],
    archiveChecklist: [...item.archiveChecklist],
    samplePayload: { ...item.samplePayload },
    sampleHeaders: { ...item.sampleHeaders },
    sampleQueryParams: { ...item.sampleQueryParams }
  }
}

export function evaluateLytFixtureValidation(item: LytFixtureCatalogItem): {
  validationStatus: LytFixtureValidationStatus
  missingSampleFields: string[]
  missingChecklistItems: string[]
} {
  const missingSampleFields = getMissingFixtureFields(item, item.samplePayload)
  const missingSampleHeaders = getMissingFixtureHeaders(item, item.sampleHeaders)
  const missingSampleQueryParams = getMissingFixtureQueryParams(item, item.sampleQueryParams)
  const missingChecklistItems = [
    ...missingSampleFields.map((field) => `payload:${field}`),
    ...missingSampleHeaders.map((field) => `headers:${field}`),
    ...missingSampleQueryParams.map((field) => `query:${field}`)
  ]

  return {
    validationStatus: missingChecklistItems.length > 0 ? 'needs-sample-completion' : 'ready-for-rehearsal',
    missingSampleFields,
    missingChecklistItems
  }
}

function getMissingRequiredKeys(requiredKeys: string[], payload: Record<string, unknown>): string[] {
  return requiredKeys.filter((field) => {
    const value = payload[field]
    return value === undefined || value === null || value === ''
  })
}

export function getMissingFixtureFields(
  item: Pick<LytFixtureCatalogItem, 'requiredRawFields'>,
  payload: Record<string, unknown>
): string[] {
  return getMissingRequiredKeys(item.requiredRawFields, payload)
}

export function getMissingFixtureHeaders(
  item: Pick<LytFixtureCatalogItem, 'requiredHeaders'>,
  headers: Record<string, unknown>
): string[] {
  return getMissingRequiredKeys(item.requiredHeaders, headers)
}

export function getMissingFixtureQueryParams(
  item: Pick<LytFixtureCatalogItem, 'requiredQueryParams'>,
  query: Record<string, unknown>
): string[] {
  return getMissingRequiredKeys(item.requiredQueryParams, query)
}

export function getLytFixtureCatalog(filters?: {
  transport?: LytFixtureTransport
  capability?: LytFixtureCapability
}): LytFixtureCatalogItem[] {
  return FIXTURE_CATALOG
    .filter((item) => (filters?.transport ? item.transport === filters.transport : true))
    .filter((item) => (filters?.capability ? item.capability === filters.capability : true))
    .map(cloneFixture)
}

export function getLytFixtureByKey(key: string): LytFixtureCatalogItem | null {
  const fixture = FIXTURE_CATALOG.find((item) => item.key === key)
  if (!fixture) {
    return null
  }

  return cloneFixture(fixture)
}

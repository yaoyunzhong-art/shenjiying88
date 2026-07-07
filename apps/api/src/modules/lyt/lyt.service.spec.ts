/* ===== lyt — 纯函数式内联测试，不 import 生产代码 ===== */

// ── 1. 枚举 + 类型定义 ────────────────────────────────────────────

enum LytDeviceType {
  GateReader = 'GATE_READER',
  PrizeMachine = 'PRIZE_MACHINE',
  CastScreen = 'CAST_SCREEN',
  Camera = 'CAMERA',
  Sensor = 'SENSOR',
}

enum LytDeviceStatus {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
  Maintenance = 'MAINTENANCE',
}

type RiskLevel = 'high' | 'medium' | 'low'

type RuntimeGovernanceRiskLevel = 'low' | 'medium' | 'high'

interface RequestTenantContext {
  tenantId: string
  brandId?: string
  storeId?: string
  marketCode?: string
}

interface LytDevice {
  deviceId: string
  tenantContext: RequestTenantContext
  storeId: string
  deviceType: LytDeviceType
  name: string
  status: LytDeviceStatus
  lastHeartbeatAt?: string
  registeredAt: string
  firmwareVersion?: string
}

interface LytDeviceHealthSummary {
  total: number
  online: number
  offline: number
  maintenance: number
  anomalous: number
  healthRate: number
  deviceTypeBreakdown: Record<LytDeviceType, { total: number; online: number; offline: number; maintenance: number }>
}

interface LytBootstrap {
  tenantContext: RequestTenantContext
  capabilities: string[]
  phase: string
}

// Fixture types
type LytFixtureKey = 'member-query' | 'order-query' | 'payment-success-webhook' | 'gate-pass-webhook' | 'device-status-query'
type LytFixtureTransport = 'api' | 'webhook'
type LytFixtureCapability = 'member' | 'order' | 'payment' | 'gate' | 'device'
type LytFixtureValidationStatus = 'ready-for-rehearsal' | 'needs-sample-completion'
type LytFixtureRiskLevel = 'high' | 'medium'

interface LytFixtureCatalogItem {
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

// Governance / Connection types
interface LytConnectionCapabilityReadinessContract {
  storeId: string
  storeCode: string
  storeName: string
  connectionStatus: 'configured' | 'pending-configuration'
  resolutionLevel: 'store' | 'brand' | 'tenant' | 'fallback'
  healthStatus: 'healthy' | 'stale' | 'pending-configuration'
  readinessByCapability: Array<{ capability: string; readiness: string }>
  recommendedNextActions: string[]
}

export {} // ensure module scope

// ── 2. Mock 数据工厂 ──────────────────────────────────────────────

function makeContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return { tenantId: 'tenant-lyt', brandId: 'brand-x', storeId: 'store-1', marketCode: 'cn-mainland', ...overrides }
}

function makeDevice(overrides?: Partial<LytDevice>): LytDevice {
  return {
    deviceId: 'dev-001',
    tenantContext: makeContext(),
    storeId: 'store-1',
    deviceType: LytDeviceType.GateReader,
    name: 'Gate Reader #1',
    status: LytDeviceStatus.Online,
    lastHeartbeatAt: new Date().toISOString(),
    registeredAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const FIXTURE_CATALOG: LytFixtureCatalogItem[] = [
  {
    key: 'member-query',
    title: '会员查询 API',
    transport: 'api',
    capability: 'member',
    riskLevel: 'medium',
    method: 'GET',
    path: '/api/v1/members/{externalMemberId}',
    recommendedUsage: '根据会员 ID 拉取会员档案（含等级、积分、状态）',
    mappingVersion: 'lyt-field-mapping-spec-v1',
    requiredRawFields: ['memberId', 'nickname', 'level', 'points'],
    recommendedRawFields: ['mobile', 'email', 'growthValue', 'status', 'registeredAt', 'lastActiveAt'],
    requiredHeaders: ['Authorization', 'X-Store-Id'],
    recommendedHeaders: ['X-Request-Id', 'Accept-Language'],
    requiredQueryParams: ['timestamp'],
    recommendedQueryParams: ['expand'],
    standardFieldChecklist: ['id', 'name', 'tier', 'points_balance'],
    schemaChecklist: ['HTTP GET with path variable', 'response: 200 OK', 'response: application/json'],
    archiveChecklist: ['source', 'tenantId', 'brandId', 'storeId', 'requestId', 'signatureStatus', 'idempotencyKey'],
    samplePayload: { memberId: 'ext-123', nickname: 'Sample', level: 'VIP', points: 5000, mobile: '138****1234' },
    sampleHeaders: { Authorization: 'Bearer sample-token', 'X-Store-Id': 'store-001' },
    sampleQueryParams: { timestamp: '2026-01-01T00:00:00Z', expand: 'true' },
  },
  {
    key: 'payment-success-webhook',
    title: '支付成功回调 webhook',
    transport: 'webhook',
    capability: 'payment',
    riskLevel: 'high',
    method: 'POST',
    path: '/api/v1/webhooks/payment/success',
    recommendedUsage: '三方支付平台支付成功回调，触发 loyalty 结算和会员积分发放',
    mappingVersion: 'lyt-field-mapping-spec-v1',
    requiredRawFields: ['paymentId', 'orderId', 'amount', 'paidAt'],
    recommendedRawFields: ['currency', 'transactionNo', 'paymentChannel', 'discountAmount'],
    requiredHeaders: ['X-Signature', 'X-Timestamp', 'X-Request-Id'],
    recommendedHeaders: ['X-Merchant-Id', 'X-Event-Type'],
    requiredQueryParams: [],
    recommendedQueryParams: [],
    standardFieldChecklist: ['payment_id', 'order_id', 'total_amount', 'paid_at'],
    schemaChecklist: ['HTTP POST', 'request: application/json', 'signature: HMAC-SHA256'],
    archiveChecklist: ['source', 'tenantId', 'brandId', 'storeId', 'requestId', 'signatureStatus', 'idempotencyKey', 'occurredAt', 'receivedAt', 'rawPayload', 'mappingVersion'],
    samplePayload: { paymentId: 'pay-789', orderId: 'ord-456', amount: 299.9, paidAt: '2026-06-01T12:00:00Z', currency: 'CNY' },
    sampleHeaders: { 'X-Signature': 'sig-abc', 'X-Timestamp': '1717200000', 'X-Request-Id': 'req-001' },
    sampleQueryParams: {},
  },
]

// ── 3. 内联业务逻辑 ──────────────────────────────────────────────

function isDeviceOnline(status: LytDeviceStatus): boolean {
  return status === LytDeviceStatus.Online
}

function isDeviceAnomalous(device: LytDevice, thresholdMinutes: number = 5): boolean {
  if (device.status === LytDeviceStatus.Online) return false
  if (!device.lastHeartbeatAt) return true
  const now = new Date()
  const heartbeat = new Date(device.lastHeartbeatAt)
  const diffMinutes = (now.getTime() - heartbeat.getTime()) / 60_000
  return diffMinutes > thresholdMinutes
}

function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function computeDeviceHealthSummary(devices: LytDevice[], thresholdMinutes: number = 5): LytDeviceHealthSummary {
  const total = devices.length
  let online = 0
  let offline = 0
  let maintenance = 0
  let anomalous = 0

  const typeBreakdown: Record<LytDeviceType, { total: number; online: number; offline: number; maintenance: number }> = {
    [LytDeviceType.GateReader]: { total: 0, online: 0, offline: 0, maintenance: 0 },
    [LytDeviceType.PrizeMachine]: { total: 0, online: 0, offline: 0, maintenance: 0 },
    [LytDeviceType.CastScreen]: { total: 0, online: 0, offline: 0, maintenance: 0 },
    [LytDeviceType.Camera]: { total: 0, online: 0, offline: 0, maintenance: 0 },
    [LytDeviceType.Sensor]: { total: 0, online: 0, offline: 0, maintenance: 0 },
  }

  for (const device of devices) {
    const breakdown = typeBreakdown[device.deviceType]
    if (breakdown) {
      breakdown.total++
      if (device.status === LytDeviceStatus.Online) breakdown.online++
      else if (device.status === LytDeviceStatus.Offline) breakdown.offline++
      else if (device.status === LytDeviceStatus.Maintenance) breakdown.maintenance++
    }

    if (device.status === LytDeviceStatus.Online) online++
    else if (device.status === LytDeviceStatus.Offline) offline++
    else if (device.status === LytDeviceStatus.Maintenance) maintenance++

    if (isDeviceAnomalous(device, thresholdMinutes)) anomalous++
  }

  const healthRate = total > 0 ? roundTo((online / total) * 100, 2) : 100
  return { total, online, offline, maintenance, anomalous, healthRate, deviceTypeBreakdown: typeBreakdown }
}

function makeLytBootstrap(
  tenantContext: RequestTenantContext,
  overrides: Partial<Pick<LytBootstrap, 'capabilities' | 'phase'>> = {},
): LytBootstrap {
  return {
    tenantContext,
    capabilities: ['device-management', 'connection-pool', 'gate-control', 'cast-screen'],
    phase: 'scaffold',
    ...overrides,
  }
}

function resolveWebhookRuntimeRiskLevel(capability: string): RuntimeGovernanceRiskLevel {
  if (capability === 'payment' || capability === 'order') return 'high'
  if (capability === 'unknown') return 'low'
  return 'medium'
}

function buildWebhookRuntimePayloadSummary(input: {
  acceptedStatus: string
  sourceEventName: string
  standardizedEventName: string
  capability: string
}): string {
  return `LYT webhook ${input.sourceEventName} -> ${input.standardizedEventName} (${input.acceptedStatus}, ${input.capability})`
}

function getMissingRequiredKeys(requiredKeys: string[], payload: Record<string, unknown>): string[] {
  return requiredKeys.filter((field) => {
    const value = payload[field]
    return value === undefined || value === null || value === ''
  })
}

function getMissingFixtureFields(
  item: Pick<LytFixtureCatalogItem, 'requiredRawFields'>,
  payload: Record<string, unknown>,
): string[] {
  return getMissingRequiredKeys(item.requiredRawFields, payload)
}

function getMissingFixtureHeaders(
  item: Pick<LytFixtureCatalogItem, 'requiredHeaders'>,
  headers: Record<string, unknown>,
): string[] {
  return getMissingRequiredKeys(item.requiredHeaders, headers)
}

function evaluateLytFixtureValidation(item: LytFixtureCatalogItem): {
  validationStatus: LytFixtureValidationStatus
  missingSampleFields: string[]
  missingChecklistItems: string[]
} {
  const missingSampleFields = getMissingFixtureFields(item, item.samplePayload)
  const missingSampleHeaders = getMissingFixtureHeaders(item, item.sampleHeaders)
  const missingChecklistItems = [
    ...missingSampleFields.map((field) => `payload:${field}`),
    ...missingSampleHeaders.map((field) => `headers:${field}`),
  ]

  return {
    validationStatus: missingChecklistItems.length > 0 ? 'needs-sample-completion' : 'ready-for-rehearsal',
    missingSampleFields,
    missingChecklistItems,
  }
}

function getFixtureSummary(fixtures: ReturnType<typeof evaluateFixture>[]) {
  const totalFixtures = fixtures.length
  const readyFixtures = fixtures.filter((f) => f.validationStatus === 'ready-for-rehearsal').length
  const blockedFixtures = fixtures.filter((f) => f.validationStatus === 'needs-sample-completion').length
  const highRiskBlockedFixtures = fixtures.filter((f) => f.riskLevel === 'high' && f.validationStatus === 'needs-sample-completion').length
  const blockedFixtureKeys = fixtures.filter((f) => f.validationStatus === 'needs-sample-completion').map((f) => f.key)
  const transportBreakdown = fixtures.reduce<Record<'api' | 'webhook', number>>(
    (acc, f) => {
      acc[f.transport] += 1; return acc
    }, { api: 0, webhook: 0 },
  )
  const capabilityBreakdown = fixtures.reduce<Partial<Record<string, number>>>(
    (acc, f) => {
      acc[f.capability] = (acc[f.capability] ?? 0) + 1; return acc
    }, {},
  )

  return {
    totalFixtures,
    readyFixtures,
    blockedFixtures,
    highRiskBlockedFixtures,
    blockedFixtureKeys,
    transportBreakdown,
    capabilityBreakdown,
  }
}

function evaluateFixture(item: LytFixtureCatalogItem) {
  const validation = evaluateLytFixtureValidation(item)
  return {
    key: item.key,
    transport: item.transport,
    capability: item.capability,
    riskLevel: item.riskLevel,
    ...validation,
  }
}

function getLytFixtureByKey(key: string): LytFixtureCatalogItem | undefined {
  return FIXTURE_CATALOG.find((item) => item.key === key)
}

// ── 4. Tests ──────────────────────────────────────────────────────

describe('LytService (inline)', () => {
  // ── isDeviceOnline ──
  describe('isDeviceOnline', () => {
    it('should return true for Online', () => {
      expect(isDeviceOnline(LytDeviceStatus.Online)).toBe(true)
    })

    it('should return false for Offline', () => {
      expect(isDeviceOnline(LytDeviceStatus.Offline)).toBe(false)
    })

    it('should return false for Maintenance', () => {
      expect(isDeviceOnline(LytDeviceStatus.Maintenance)).toBe(false)
    })
  })

  // ── isDeviceAnomalous ──
  describe('isDeviceAnomalous', () => {
    it('should return false for online device', () => {
      const device = makeDevice({ status: LytDeviceStatus.Online })
      expect(isDeviceAnomalous(device)).toBe(false)
    })

    it('should return true for offline device without heartbeat', () => {
      const device = makeDevice({ status: LytDeviceStatus.Offline, lastHeartbeatAt: undefined })
      expect(isDeviceAnomalous(device)).toBe(true)
    })

    it('should return true for offline device with old heartbeat', () => {
      const past = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      const device = makeDevice({ status: LytDeviceStatus.Offline, lastHeartbeatAt: past })
      expect(isDeviceAnomalous(device, 5)).toBe(true)
    })
  })

  // ── computeDeviceHealthSummary ──
  describe('computeDeviceHealthSummary', () => {
    it('should return 100% health rate for all online devices', () => {
      const devices = [
        makeDevice({ deviceId: 'd1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'd2', deviceType: LytDeviceType.PrizeMachine, status: LytDeviceStatus.Online }),
      ]
      const summary = computeDeviceHealthSummary(devices)
      expect(summary.total).toBe(2)
      expect(summary.online).toBe(2)
      expect(summary.healthRate).toBe(100)
    })

    it('should calculate health rate correctly for mixed states', () => {
      const devices = [
        makeDevice({ deviceId: 'd1', status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'd2', status: LytDeviceStatus.Offline }),
        makeDevice({ deviceId: 'd3', status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'd4', status: LytDeviceStatus.Maintenance }),
      ]
      const summary = computeDeviceHealthSummary(devices)
      expect(summary.total).toBe(4)
      expect(summary.online).toBe(2)
      expect(summary.offline).toBe(1)
      expect(summary.maintenance).toBe(1)
      expect(summary.healthRate).toBe(50)
    })

    it('should handle empty device list', () => {
      const summary = computeDeviceHealthSummary([])
      expect(summary.total).toBe(0)
      expect(summary.healthRate).toBe(100)
    })

    it('should break down by device type', () => {
      const devices = [
        makeDevice({ deviceId: 'd1', deviceType: LytDeviceType.GateReader, status: LytDeviceStatus.Online }),
        makeDevice({ deviceId: 'd2', deviceType: LytDeviceType.Camera, status: LytDeviceStatus.Offline }),
      ]
      const summary = computeDeviceHealthSummary(devices)
      expect(summary.deviceTypeBreakdown[LytDeviceType.GateReader].total).toBe(1)
      expect(summary.deviceTypeBreakdown[LytDeviceType.Camera].offline).toBe(1)
    })
  })

  // ── makeLytBootstrap ──
  describe('makeLytBootstrap', () => {
    it('should return tenant context', () => {
      const ctx = makeContext()
      const result = makeLytBootstrap(ctx)
      expect(result.tenantContext.tenantId).toBe('tenant-lyt')
    })

    it('should include device-management capability', () => {
      const result = makeLytBootstrap(makeContext())
      expect(result.capabilities).toContain('device-management')
      expect(result.capabilities).toContain('connection-pool')
    })

    it('should be in scaffold phase', () => {
      const result = makeLytBootstrap(makeContext())
      expect(result.phase).toBe('scaffold')
    })
  })

  // ── resolveWebhookRuntimeRiskLevel ──
  describe('resolveWebhookRuntimeRiskLevel', () => {
    it('should return high for payment and order', () => {
      expect(resolveWebhookRuntimeRiskLevel('payment')).toBe('high')
      expect(resolveWebhookRuntimeRiskLevel('order')).toBe('high')
    })

    it('should return low for unknown', () => {
      expect(resolveWebhookRuntimeRiskLevel('unknown')).toBe('low')
    })

    it('should return medium for other capabilities', () => {
      expect(resolveWebhookRuntimeRiskLevel('member')).toBe('medium')
      expect(resolveWebhookRuntimeRiskLevel('device')).toBe('medium')
    })
  })

  // ── buildWebhookRuntimePayloadSummary ──
  describe('buildWebhookRuntimePayloadSummary', () => {
    it('should build descriptive summary string', () => {
      const result = buildWebhookRuntimePayloadSummary({
        acceptedStatus: 'new',
        sourceEventName: 'payment.success',
        standardizedEventName: 'cashier.payment-succeeded',
        capability: 'payment',
      })
      expect(result).toContain('payment.success')
      expect(result).toContain('cashier.payment-succeeded')
      expect(result).toContain('new')
    })
  })

  // ── getMissingRequiredKeys / getMissingFixtureFields ──
  describe('getMissingFixtureFields', () => {
    it('should return empty for complete payload', () => {
      const missing = getMissingFixtureFields(FIXTURE_CATALOG[0]!, { memberId: 'm1', nickname: 'n', level: 'VIP', points: 100 })
      expect(missing).toEqual([])
    })

    it('should return missing fields', () => {
      const missing = getMissingFixtureFields(FIXTURE_CATALOG[0]!, { memberId: 'm1' })
      expect(missing).toEqual(['nickname', 'level', 'points'])
    })
  })

  // ── evaluateLytFixtureValidation ──
  describe('evaluateLytFixtureValidation', () => {
    it('should return ready for complete fixtures', () => {
      const result = evaluateLytFixtureValidation(FIXTURE_CATALOG[0]!)
      expect(result.validationStatus).toBe('ready-for-rehearsal')
    })

    it('should return needs-sample-completion for fixtures with missing required headers', () => {
      const badFixture: LytFixtureCatalogItem = {
        ...FIXTURE_CATALOG[0]!,
        sampleHeaders: {},
      }
      const result = evaluateLytFixtureValidation(badFixture)
      expect(result.validationStatus).toBe('needs-sample-completion')
      expect(result.missingChecklistItems).toContain('headers:Authorization')
    })
  })

  // ── getFixtureSummary ──
  describe('getFixtureSummary', () => {
    it('should count total fixtures', () => {
      const evaluated = FIXTURE_CATALOG.map(evaluateFixture)
      const summary = getFixtureSummary(evaluated)
      expect(summary.totalFixtures).toBe(2)
    })

    it('should detect transport breakdown', () => {
      const evaluated = FIXTURE_CATALOG.map(evaluateFixture)
      const summary = getFixtureSummary(evaluated)
      expect(summary.transportBreakdown.api).toBe(1)
      expect(summary.transportBreakdown.webhook).toBe(1)
    })
  })

  // ── getLytFixtureByKey ──
  describe('getLytFixtureByKey', () => {
    it('should find fixture by key', () => {
      const fixture = getLytFixtureByKey('member-query')
      expect(fixture).toBeDefined()
      expect(fixture!.title).toContain('会员查询')
    })

    it('should return undefined for unknown key', () => {
      const fixture = getLytFixtureByKey('non-existent')
      expect(fixture).toBeUndefined()
    })
  })
})

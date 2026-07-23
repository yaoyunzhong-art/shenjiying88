import { Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';
import type {
  ILytAdapter,
  LytCallbackEvent,
  LytDecryptRequest,
  LytDecryptResult,
  LytDeviceInfo,
  LytErrorInfo,
  LytMemberInfo,
  LytOperationRequest,
  LytOperationResult,
  LytOrderInfo,
  LytPollTask,
  LytQueryFilter,
  LytQueryRequest,
  LytQueryResult,
  LytSignResult,
  LytTimeoutDowngradeConfig,
  LytValidationResult,
  LytVenue,
} from '../interfaces/lyt-adapter.interface';
import { LytConnectionStatus } from '../interfaces/lyt-adapter.interface';

/**
 * Mock 场地数据
 */
const MOCK_VENUES: LytVenue[] = [
  {
    venueId: 'venue-arcade-01',
    name: '趣玩馆-扭蛋区',
    storeId: 'store-hk-01',
    venueType: 'arcade',
    areaSqm: 85,
    deviceCapacity: 24,
    onlineDeviceCount: 22,
    status: 'OPEN',
    businessHours: { open: '10:00', close: '22:00' },
  },
  {
    venueId: 'venue-sport-01',
    name: '趣玩馆-运动区',
    storeId: 'store-hk-01',
    venueType: 'digital-sport',
    areaSqm: 120,
    deviceCapacity: 16,
    onlineDeviceCount: 14,
    status: 'OPEN',
    businessHours: { open: '10:00', close: '22:00' },
  },
  {
    venueId: 'venue-mixed-01',
    name: '旗舰馆-综合区',
    storeId: 'store-sz-01',
    venueType: 'mixed',
    areaSqm: 200,
    deviceCapacity: 40,
    onlineDeviceCount: 38,
    status: 'OPEN',
    businessHours: { open: '09:00', close: '23:00' },
  },
];

/**
 * Mock 设备数据
 */
const MOCK_DEVICES: Record<string, LytDeviceInfo[]> = {
  'venue-arcade-01': [
    { deviceId: 'dev-gacha-01', name: '扭蛋机 A1', deviceType: 'prize-machine', venueId: 'venue-arcade-01', status: 'ONLINE', firmwareVersion: 'v2.1.0', serialNumber: 'SN-GA-001', lastHeartbeatAt: new Date().toISOString(), todayRevenueCents: 35000 },
    { deviceId: 'dev-gacha-02', name: '扭蛋机 A2', deviceType: 'prize-machine', venueId: 'venue-arcade-01', status: 'ONLINE', firmwareVersion: 'v2.1.0', serialNumber: 'SN-GA-002', lastHeartbeatAt: new Date().toISOString(), todayRevenueCents: 28000 },
    { deviceId: 'dev-gacha-03', name: '扭蛋机 A3', deviceType: 'prize-machine', venueId: 'venue-arcade-01', status: 'OFFLINE', firmwareVersion: 'v2.0.9', serialNumber: 'SN-GA-003', lastHeartbeatAt: new Date(Date.now() - 7200000).toISOString(), todayRevenueCents: 15000 },
    { deviceId: 'dev-gate-01', name: '入口闸机', deviceType: 'gate-reader', venueId: 'venue-arcade-01', status: 'ONLINE', firmwareVersion: 'v1.5.2', serialNumber: 'SN-GT-001', lastHeartbeatAt: new Date().toISOString() },
  ],
  'venue-sport-01': [
    { deviceId: 'dev-screen-01', name: 'AR 投屏-左', deviceType: 'cast-screen', venueId: 'venue-sport-01', status: 'ONLINE', firmwareVersion: 'v3.0.1', serialNumber: 'SN-CS-001', lastHeartbeatAt: new Date().toISOString(), todayRevenueCents: 58000 },
    { deviceId: 'dev-screen-02', name: 'AR 投屏-右', deviceType: 'cast-screen', venueId: 'venue-sport-01', status: 'MAINTENANCE', firmwareVersion: 'v3.0.1', serialNumber: 'SN-CS-002', lastHeartbeatAt: new Date(Date.now() - 3600000).toISOString(), todayRevenueCents: 0 },
    { deviceId: 'dev-cam-01', name: '动捕摄像头 1', deviceType: 'camera', venueId: 'venue-sport-01', status: 'ONLINE', firmwareVersion: 'v1.2.3', serialNumber: 'SN-CM-001', lastHeartbeatAt: new Date().toISOString() },
  ],
  'venue-mixed-01': [
    { deviceId: 'dev-coin-01', name: '兑币机 F1', deviceType: 'coin-machine', venueId: 'venue-mixed-01', status: 'ONLINE', firmwareVersion: 'v2.3.0', serialNumber: 'SN-CN-001', lastHeartbeatAt: new Date().toISOString(), todayRevenueCents: 120000 },
    { deviceId: 'dev-gacha-04', name: '扭蛋机 B1', deviceType: 'prize-machine', venueId: 'venue-mixed-01', status: 'ONLINE', firmwareVersion: 'v2.2.0', serialNumber: 'SN-GA-004', lastHeartbeatAt: new Date().toISOString(), todayRevenueCents: 42000 },
    { deviceId: 'dev-gacha-05', name: '扭蛋机 B2', deviceType: 'prize-machine', venueId: 'venue-mixed-01', status: 'ERROR', firmwareVersion: 'v2.2.0', serialNumber: 'SN-GA-005', lastHeartbeatAt: new Date(Date.now() - 1800000).toISOString(), todayRevenueCents: 0 },
  ],
};

/**
 * Mock 会员数据池
 */
const MOCK_MEMBER_POOL: Record<string, LytMemberInfo> = {
  'member-active-01': {
    memberId: 'member-active-01',
    externalMemberId: 'lyt-ext-001',
    mobile: '13800138001',
    nickname: '小明',
    levelName: '黄金会员',
    levelCode: 'GOLD',
    points: 12500,
    growthValue: 6800,
    totalSpentCents: 1500000,
    registeredAt: '2025-06-01T10:00:00Z',
    status: 'ACTIVE',
  },
  'member-active-02': {
    memberId: 'member-active-02',
    externalMemberId: 'lyt-ext-002',
    mobile: '13800138002',
    nickname: '张三',
    levelName: 'SVIP 种子',
    levelCode: 'SVIP',
    points: 52000,
    growthValue: 25000,
    totalSpentCents: 5000000,
    registeredAt: '2024-12-15T08:30:00Z',
    status: 'ACTIVE',
  },
  'member-frozen-01': {
    memberId: 'member-frozen-01',
    externalMemberId: 'lyt-ext-003',
    mobile: '13800138003',
    nickname: '冻结用户',
    levelName: '普通会员',
    levelCode: 'BASIC',
    points: 300,
    growthValue: 200,
    totalSpentCents: 50000,
    registeredAt: '2025-03-10T14:00:00Z',
    status: 'FROZEN',
  },
};

/**
 * Mock 订单数据池
 */
const MOCK_ORDERS: Record<string, LytOrderInfo> = {
  'order-paid-01': {
    orderId: 'order-paid-01',
    externalOrderId: 'ext-order-001',
    memberId: 'member-active-01',
    totalAmount: 50000,
    payableAmount: 45000,
    discountAmount: 5000,
    status: 'PAID',
    paidAt: new Date(Date.now() - 86400000).toISOString(),
    paymentMethod: 'wechat',
    paymentTxnId: 'wx-txn-001',
    items: [
      { skuId: 'gacha-toy-01', name: '盲盒 A', quantity: 2, price: 15000 },
      { skuId: 'gacha-toy-02', name: '盲盒 B', quantity: 1, price: 20000 },
    ],
  },
  'order-created-01': {
    orderId: 'order-created-01',
    externalOrderId: 'ext-order-002',
    memberId: 'member-active-02',
    totalAmount: 30000,
    status: 'CREATED',
    items: [
      { skuId: 'gacha-toy-03', name: '限量款 C', quantity: 1, price: 30000 },
    ],
  },
  'order-refunded-01': {
    orderId: 'order-refunded-01',
    externalOrderId: 'ext-order-003',
    memberId: 'member-active-01',
    totalAmount: 10000,
    payableAmount: 10000,
    status: 'REFUNDED',
    paidAt: new Date(Date.now() - 172800000).toISOString(),
    items: [
      { skuId: 'gacha-toy-01', name: '盲盒 A', quantity: 1, price: 10000 },
    ],
  },
};

@Injectable()
export class MockLytAdapter implements ILytAdapter {
  readonly adapterName = 'MockLytAdapter';
  readonly adapterMode = 'mock' as const;

  /** Mock 连接的会话存储 */
  private activeSessions: Map<string, { endpoint: string; connectedAt: string; lastActivity: string }> = new Map();
  /** Mock 轮询任务存储 */
  private pollTasks: Map<string, LytPollTask> = new Map();
  /** Mock 缓存（用于降级测试） */
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();

  private readonly downgradeConfig: LytTimeoutDowngradeConfig = {
    connectTimeoutMs: 3000,
    readTimeoutMs: 5000,
    useCacheOnTimeout: true,
    cacheTtlMs: 60000,
    useFallbackOnTimeout: true,
    downgradeLogLevel: 'warn',
  };

  // ──────────────────────────────────────────────
  // 1. 连接 / 断开
  // ──────────────────────────────────────────────

  async connect(endpoint: string, credentials: Record<string, unknown>): Promise<{
    sessionId: string;
    status: LytConnectionStatus;
    connectedAt: string;
    metadata?: Record<string, unknown>;
  }> {
    const sessionId = `mock-session-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    this.activeSessions.set(sessionId, { endpoint, connectedAt: now, lastActivity: now });
    return {
      sessionId,
      status: LytConnectionStatus.Connected,
      connectedAt: now,
      metadata: { endpoint, credentialType: credentials.type ?? 'mock' },
    };
  }

  async disconnect(sessionId: string): Promise<{
    success: boolean;
    sessionId: string;
    disconnectedAt: string;
  }> {
    this.activeSessions.delete(sessionId);
    return { success: true, sessionId, disconnectedAt: new Date().toISOString() };
  }

  async getConnectionStatus(sessionId?: string): Promise<{
    status: LytConnectionStatus;
    sessionId?: string;
    connectedAt?: string;
    lastActivityAt?: string;
  }> {
    if (!sessionId) {
      return { status: LytConnectionStatus.Disconnected };
    }
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      return { status: LytConnectionStatus.Disconnected, sessionId };
    }
    return {
      status: LytConnectionStatus.Connected,
      sessionId,
      connectedAt: session.connectedAt,
      lastActivityAt: session.lastActivity,
    };
  }

  // ──────────────────────────────────────────────
  // 2. 查询 / 操作 / 校验
  // ──────────────────────────────────────────────

  async getMember(memberId: string): Promise<LytMemberProfile> {
    const member = MOCK_MEMBER_POOL[memberId] ?? {
      memberId,
      nickname: 'Mock Member',
      levelName: 'SVIP Seed',
    };
    return { memberId: member.memberId, nickname: member.nickname, levelName: member.levelName };
  }

  async createOrder(payload: LytOrderPayload): Promise<LytOrderResult> {
    const totalAmount = payload.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const orderId = `mock-${Date.now()}-${randomUUID().slice(0, 6)}`;
    return { orderId, totalAmount, status: 'CREATED' };
  }

  async applyDiscount(orderId: string, couponCode: string): Promise<{ orderId: string; couponCode: string }> {
    return { orderId, couponCode };
  }

  async syncGateEvent(storeId: string, passCode: string): Promise<{ accepted: boolean; storeId: string }> {
    void passCode;
    return { accepted: true, storeId };
  }

  async getDeviceStatus(deviceId: string): Promise<{ deviceId: string; status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR' }> {
    // Search in all device lists
    for (const devices of Object.values(MOCK_DEVICES)) {
      const device = devices.find((d) => d.deviceId === deviceId);
      if (device) {
        return { deviceId, status: device.status };
      }
    }
    return { deviceId, status: 'ONLINE' };
  }

  async updateMember(payload: {
    memberId: string;
    tier?: string;
    [k: string]: unknown;
  }): Promise<{ status: 'UPDATED' | 'NOOP'; memberId: string }> {
    const existing = MOCK_MEMBER_POOL[payload.memberId];
    if (!existing) {
      return { status: 'NOOP', memberId: payload.memberId };
    }
    // Simulate update — in mock we just return UPDATED
    return { status: 'UPDATED', memberId: payload.memberId };
  }

  async query(request: LytQueryRequest): Promise<LytQueryResult<Record<string, unknown>>> {
    let data: Record<string, unknown>[] = [];

    switch (request.entityType) {
      case 'member':
        data = Object.values(MOCK_MEMBER_POOL).map((m) => ({ ...m }));
        break;
      case 'order':
        data = Object.values(MOCK_ORDERS).map((o) => ({ ...o }));
        break;
      case 'device':
        data = Object.values(MOCK_DEVICES).flat().map((d) => ({ ...d }));
        break;
      case 'venue':
        data = MOCK_VENUES.map((v) => ({ ...v }));
        break;
      case 'inventory':
        data = [
          { skuId: 'gacha-toy-01', name: '盲盒 A', stock: 120, price: 15000 },
          { skuId: 'gacha-toy-02', name: '盲盒 B', stock: 85, price: 20000 },
          { skuId: 'gacha-toy-03', name: '限量款 C', stock: 5, price: 30000 },
        ];
        break;
    }

    // Apply filters
    if (request.filters && request.filters.length > 0) {
      data = data.filter((item) =>
        request.filters!.every((f) => this.evaluateFilter(item, f)),
      );
    }

    // Apply field selection
    if (request.fields && request.fields.length > 0) {
      data = data.map((item) => {
        const selected: Record<string, unknown> = {};
        for (const field of request.fields!) {
          if (field in item) {
            selected[field] = item[field];
          }
        }
        return selected;
      });
    }

    // Apply sorting
    if (request.sort && request.sort.length > 0) {
      for (const s of request.sort) {
        data.sort((a, b) => {
          const av = a[s.field];
          const bv = b[s.field];
          if (typeof av === 'string' && typeof bv === 'string') {
            return s.order === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
          }
          const cmp = Number(av) - Number(bv);
          return s.order === 'asc' ? cmp : -cmp;
        });
      }
    }

    // Apply pagination
    const page = request.pagination?.page ?? 1;
    const pageSize = request.pagination?.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const pagedData = data.slice(start, start + pageSize);

    return {
      data: pagedData,
      total: data.length,
      page,
      pageSize,
      hasMore: start + pageSize < data.length,
    };
  }

  async operate(request: LytOperationRequest): Promise<LytOperationResult> {
    const operationId = `mock-op-${Date.now()}`;
    return {
      success: true,
      operationId,
      entityId: request.entityId,
      message: `Mock ${request.operation} on ${request.entityType} succeeded`,
      data: { request, mockResult: 'simulated' },
    };
  }

  async validate(entityType: string, data: Record<string, unknown>): Promise<LytValidationResult> {
    const checks: LytValidationResult['checks'] = [
      { name: 'required-fields', passed: Object.keys(data).length > 0, message: 'Data payload is non-empty', severity: 'error' },
      { name: 'entity-type-check', passed: ['member', 'order', 'device', 'venue'].includes(entityType), message: `Entity type "${entityType}" recognized`, severity: 'error' },
      { name: 'field-types', passed: true, message: 'All field types are valid', severity: 'warning' },
    ];
    return {
      valid: checks.every((c) => c.passed || c.severity === 'warning'),
      checks,
    };
  }

  // ──────────────────────────────────────────────
  // 3. 场地与设备业务查询
  // ──────────────────────────────────────────────

  async getVenues(storeId?: string): Promise<LytVenue[]> {
    if (storeId) {
      return MOCK_VENUES.filter((v) => v.storeId === storeId);
    }
    return [...MOCK_VENUES];
  }

  async getDevices(venueId?: string): Promise<LytDeviceInfo[]> {
    if (venueId) {
      return MOCK_DEVICES[venueId] ?? [];
    }
    return Object.values(MOCK_DEVICES).flat();
  }

  async getMemberInfo(memberId: string): Promise<LytMemberInfo> {
    return MOCK_MEMBER_POOL[memberId] ?? {
      memberId,
      nickname: 'Mock Member',
      levelName: 'SVIP Seed',
      status: 'ACTIVE',
    };
  }

  async getOrderInfo(orderId: string): Promise<LytOrderInfo> {
    return MOCK_ORDERS[orderId] ?? {
      orderId,
      totalAmount: 0,
      status: 'CREATED',
    };
  }

  // ──────────────────────────────────────────────
  // 4. 签名 / 解密
  // ──────────────────────────────────────────────

  async sign(method: string, path: string, body?: string, timestamp?: string): Promise<LytSignResult> {
    const ts = timestamp ?? new Date().toISOString();
    const nonce = randomUUID().replace(/-/g, '').slice(0, 16);
    const raw = [this.adapterMode, method.toUpperCase(), path, ts, body ?? '', 'mock-secret'].join(':');
    const signature = createHash('sha256').update(raw).digest('hex');
    return { signature, algorithm: 'sha256', timestamp: ts, nonce };
  }

  async verifySignature(signature: string, payload: string, timestamp: string): Promise<boolean> {
    // Mock verification — in real impl would check the actual signing secret
    const raw = [this.adapterMode, 'POST', '/webhooks/callback', timestamp, payload, 'mock-secret'].join(':');
    const expected = createHash('sha256').update(raw).digest('hex');
    return signature === expected;
  }

  async decrypt(request: LytDecryptRequest): Promise<LytDecryptResult> {
    // Mock decrypt — return placeholder
    return { plaintext: Buffer.from(request.ciphertext, 'base64').toString('utf8'), algorithm: request.algorithm };
  }

  // ──────────────────────────────────────────────
  // 5. 轮询 / 回调
  // ──────────────────────────────────────────────

  async startPoll(taskType: LytPollTask['taskType'], entityId: string, params?: Record<string, unknown>): Promise<LytPollTask> {
    const taskId = `mock-poll-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const task: LytPollTask = {
      taskId,
      taskType,
      entityId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    this.pollTasks.set(taskId, task);

    // Simulate async completion after a short delay
    setTimeout(() => {
      const existing = this.pollTasks.get(taskId);
      if (existing && existing.status === 'PENDING') {
        this.pollTasks.set(taskId, {
          ...existing,
          status: 'COMPLETED',
          progress: 100,
          result: params ?? {},
          updatedAt: new Date().toISOString(),
        });
      }
    }, 500);

    return task;
  }

  async getPollStatus(taskId: string): Promise<LytPollTask> {
    const task = this.pollTasks.get(taskId);
    if (!task) {
      return {
        taskId,
        taskType: 'order-status',
        status: 'FAILED',
        error: 'Task not found',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return { ...task };
  }

  async cancelPoll(taskId: string): Promise<{ success: boolean; taskId: string }> {
    const task = this.pollTasks.get(taskId);
    if (task) {
      this.pollTasks.set(taskId, { ...task, status: 'FAILED', updatedAt: new Date().toISOString() });
    }
    return { success: true, taskId };
  }

  async handleCallback(event: LytCallbackEvent): Promise<{
    accepted: boolean;
    eventId: string;
    processedBy: string;
  }> {
    return { accepted: true, eventId: event.eventId, processedBy: this.adapterName };
  }

  // ──────────────────────────────────────────────
  // 6. 错误处理与降级
  // ──────────────────────────────────────────────

  wrapError(error: unknown, context?: { path?: string; requestId?: string }): LytErrorInfo {
    const requestId = context?.requestId ?? 'unknown';
    const path = context?.path ?? 'unknown';

    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return {
          code: 'LYT_TIMEOUT',
          category: 'network',
          message: `${this.adapterName} request timed out on path ${path}`,
          retryable: true,
          cause: error,
          adapterName: this.adapterName,
          requestId,
        };
      }
      if (error.name === 'AbortError' || error.message.includes('abort')) {
        return {
          code: 'LYT_ABORTED',
          category: 'network',
          message: `${this.adapterName} request aborted on path ${path}`,
          retryable: true,
          cause: error,
          adapterName: this.adapterName,
          requestId,
        };
      }
      if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        return {
          code: 'LYT_CONNECTION_REFUSED',
          category: 'network',
          message: `${this.adapterName} connection refused on endpoint ${path}`,
          retryable: true,
          cause: error,
          adapterName: this.adapterName,
          requestId,
        };
      }
      // Protocol errors — JSON parse failures, invalid response format
      if (error.message.includes('parse') || error.message.includes('Unexpected token') || error.message.includes('JSON')) {
        return {
          code: 'LYT_PROTOCOL_ERROR',
          category: 'protocol',
          message: `${this.adapterName} protocol error on path ${path}: ${error.message}`,
          retryable: false,
          cause: error,
          adapterName: this.adapterName,
          requestId,
        };
      }
      // Business errors
      if (error.message.includes('invalid') || error.message.includes('rejected') || error.message.includes('denied') || error.message.includes('not found')) {
        return {
          code: 'LYT_BUSINESS_ERROR',
          category: 'business',
          message: error.message,
          retryable: false,
          cause: error,
          adapterName: this.adapterName,
          requestId,
        };
      }
      // Unknown errors
      return {
        code: 'LYT_UNKNOWN',
        category: 'unknown',
        message: error.message,
        retryable: false,
        cause: error,
        adapterName: this.adapterName,
        requestId,
      };
    }

    return {
      code: 'LYT_UNKNOWN',
      category: 'unknown',
      message: String(error),
      retryable: false,
      adapterName: this.adapterName,
      requestId,
    };
  }

  isRetryable(error: LytErrorInfo): boolean {
    return error.retryable;
  }

  getTimeoutDowngradeConfig(): LytTimeoutDowngradeConfig {
    return { ...this.downgradeConfig };
  }

  // ──────────────────────────────────────────────
  // 私有辅助方法
  // ──────────────────────────────────────────────

  private evaluateFilter(item: Record<string, unknown>, filter: LytQueryFilter): boolean {
    const value = item[filter.field];
    switch (filter.operator) {
      case 'eq':
        return String(value) === String(filter.value);
      case 'neq':
        return String(value) !== String(filter.value);
      case 'gt':
        return Number(value) > Number(filter.value);
      case 'gte':
        return Number(value) >= Number(filter.value);
      case 'lt':
        return Number(value) < Number(filter.value);
      case 'lte':
        return Number(value) <= Number(filter.value);
      case 'in':
        return Array.isArray(filter.value) && filter.value.includes(value);
      case 'contains':
        return String(value).includes(String(filter.value));
      case 'startsWith':
        return String(value).startsWith(String(filter.value));
      default:
        return true;
    }
  }
}

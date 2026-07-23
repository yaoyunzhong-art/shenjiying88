import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';

/**
 * 连接状态枚举
 */
export enum LytConnectionStatus {
  /** 已连接 */
  Connected = 'CONNECTED',
  /** 连接中 */
  Connecting = 'CONNECTING',
  /** 已断开 */
  Disconnected = 'DISCONNECTED',
  /** 连接失败 */
  Failed = 'FAILED',
  /** 超时 */
  Timeout = 'TIMEOUT',
}

/**
 * 适配器操作模式
 */
export type LytAdapterMode = 'mock' | 'sandbox' | 'real';

/**
 * LYT 场地信息
 */
export interface LytVenue {
  /** 场地唯一标识 */
  venueId: string;
  /** 场地名称 */
  name: string;
  /** 所属门店 ID */
  storeId: string;
  /** 场地类型 */
  venueType: 'arcade' | 'digital-sport' | 'mixed';
  /** 场地面积 (平方米) */
  areaSqm?: number;
  /** 设备容量 */
  deviceCapacity: number;
  /** 当前在线设备数 */
  onlineDeviceCount: number;
  /** 营业状态 */
  status: 'OPEN' | 'CLOSED' | 'MAINTENANCE';
  /** 营业时间 */
  businessHours?: {
    open: string;
    close: string;
  };
}

/**
 * LYT 设备信息（扩展）
 */
export interface LytDeviceInfo {
  /** 设备唯一标识 */
  deviceId: string;
  /** 设备名称 */
  name: string;
  /** 设备类型 */
  deviceType: 'prize-machine' | 'gate-reader' | 'cast-screen' | 'camera' | 'sensor' | 'coin-machine';
  /** 所属场地 ID */
  venueId: string;
  /** 设备状态 */
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR';
  /** 固件版本 */
  firmwareVersion?: string;
  /** 序列号 */
  serialNumber?: string;
  /** 最后心跳时间 (ISO8601) */
  lastHeartbeatAt?: string;
  /** 今日营收 (分) */
  todayRevenueCents?: number;
}

/**
 * LYT 会员信息（扩展）
 */
export interface LytMemberInfo {
  /** 会员唯一标识 */
  memberId: string;
  /** 外部会员 ID（LYT 侧） */
  externalMemberId?: string;
  /** 手机号 */
  mobile?: string;
  /** 昵称 */
  nickname?: string;
  /** 会员等级名称 */
  levelName?: string;
  /** 会员等级编码 */
  levelCode?: string;
  /** 可用积分 */
  points?: number;
  /** 成长值 */
  growthValue?: number;
  /** 累计消费金额 (分) */
  totalSpentCents?: number;
  /** 注册时间 (ISO8601) */
  registeredAt?: string;
  /** 会员状态 */
  status: 'ACTIVE' | 'FROZEN' | 'EXPIRED';
}

/**
 * LYT 订单信息（扩展）
 */
export interface LytOrderInfo {
  /** 订单唯一标识 */
  orderId: string;
  /** 外部订单 ID（M5 侧） */
  externalOrderId?: string;
  /** 会员 ID */
  memberId?: string;
  /** 订单总金额 (分) */
  totalAmount: number;
  /** 实付金额 (分) */
  payableAmount?: number;
  /** 优惠金额 (分) */
  discountAmount?: number;
  /** 订单状态 */
  status: 'CREATED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED' | 'CANCELLED';
  /** 支付时间 (ISO8601) */
  paidAt?: string;
  /** 支付方式 */
  paymentMethod?: string;
  /** 支付流水号 */
  paymentTxnId?: string;
  /** 商品明细 */
  items?: Array<{
    skuId: string;
    name?: string;
    quantity: number;
    price: number;
  }>;
}

/**
 * 查询操作符
 */
export interface LytQueryFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'startsWith';
  value: unknown;
}

/**
 * 查询请求
 */
export interface LytQueryRequest {
  /** 查询实体类型 */
  entityType: 'member' | 'order' | 'device' | 'venue' | 'inventory';
  /** 过滤条件 */
  filters?: LytQueryFilter[];
  /** 排序 */
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>;
  /** 分页 */
  pagination?: { page: number; pageSize: number };
  /** 需要返回的字段列表 */
  fields?: string[];
}

/**
 * 查询结果
 */
export interface LytQueryResult<T = unknown> {
  /** 数据列表 */
  data: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 是否有下一页 */
  hasMore: boolean;
}

/**
 * 操作请求
 */
export interface LytOperationRequest {
  /** 操作类型 */
  operation: 'create' | 'update' | 'delete' | 'enable' | 'disable' | 'reset' | 'sync';
  /** 实体类型 */
  entityType: string;
  /** 实体 ID */
  entityId?: string;
  /** 操作数据 */
  data?: Record<string, unknown>;
}

/**
 * 操作结果
 */
export interface LytOperationResult {
  /** 操作是否成功 */
  success: boolean;
  /** 操作 ID */
  operationId: string;
  /** 实体 ID */
  entityId?: string;
  /** 操作消息 */
  message?: string;
  /** 操作后的数据 */
  data?: Record<string, unknown>;
}

/**
 * 验证结果
 */
export interface LytValidationResult {
  /** 是否通过验证 */
  valid: boolean;
  /** 验证项结果列表 */
  checks: Array<{
    name: string;
    passed: boolean;
    message?: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

/**
 * 签名信息
 */
export interface LytSignResult {
  /** 签名值 (hex) */
  signature: string;
  /** 签名算法 */
  algorithm: string;
  /** 时间戳 (ISO8601) */
  timestamp: string;
  /** 随机 nonce */
  nonce: string;
}

/**
 * 解密请求
 */
export interface LytDecryptRequest {
  /** 密文 (base64) */
  ciphertext: string;
  /** 加密算法 */
  algorithm: string;
  /** 关联的密钥 ID */
  keyId?: string;
  /** IV 向量 (base64) */
  iv?: string;
}

/**
 * 解密结果
 */
export interface LytDecryptResult {
  /** 明文 */
  plaintext: string;
  /** 使用的算法 */
  algorithm: string;
}

/**
 * 轮询任务信息
 */
export interface LytPollTask {
  /** 任务 ID */
  taskId: string;
  /** 任务类型 */
  taskType: 'order-status' | 'device-status' | 'sync-progress' | 'batch-operation';
  /** 关联实体 ID */
  entityId?: string;
  /** 任务状态 */
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT';
  /** 进度 (0-100) */
  progress?: number;
  /** 结果数据 */
  result?: Record<string, unknown>;
  /** 错误信息 */
  error?: string;
  /** 创建时间 (ISO8601) */
  createdAt: string;
  /** 最后更新时间 (ISO8601) */
  updatedAt: string;
}

/**
 * 回调事件
 */
export interface LytCallbackEvent {
  /** 事件 ID */
  eventId: string;
  /** 事件类型 */
  eventType: string;
  /** 回调来源 */
  source: string;
  /** 关联实体 ID */
  entityId?: string;
  /** 事件数据 */
  payload: Record<string, unknown>;
  /** 事件时间 (ISO8601) */
  occurredAt: string;
  /** 签名 */
  signature?: string;
  /** 幂等键 */
  idempotencyKey?: string;
}

/**
 * LYT 统一错误包装
 */
export interface LytErrorInfo {
  /** 错误码 */
  code: string;
  /** 错误类型 */
  category: 'network' | 'protocol' | 'business' | 'unknown';
  /** 错误消息 */
  message: string;
  /** 是否可重试 */
  retryable: boolean;
  /** 原始错误 */
  cause?: Error;
  /** HTTP 状态码 (如果适用) */
  statusCode?: number;
  /** 适配器名称 */
  adapterName: string;
  /** 请求 ID */
  requestId?: string;
}

/**
 * 超时降级策略配置
 */
export interface LytTimeoutDowngradeConfig {
  /** 连接超时 (ms) */
  connectTimeoutMs: number;
  /** 读取超时 (ms) */
  readTimeoutMs: number;
  /** 降级后是否使用缓存数据 */
  useCacheOnTimeout: boolean;
  /** 缓存 TTL (ms) */
  cacheTtlMs: number;
  /** 降级后是否返回 fallback 数据 */
  useFallbackOnTimeout: boolean;
  /** 降级日志级别 */
  downgradeLogLevel: 'warn' | 'error';
}

/**
 * LYT 适配器全量接口
 *
 * 覆盖连接/断开、查询/操作/校验、签名/解密、轮询/回调 全生命周期。
 */
export interface ILytAdapter {
  /** 适配器名称 */
  readonly adapterName: string;

  /** 适配器操作模式 */
  readonly adapterMode: LytAdapterMode;

  // ──────────────────────────────────────────────
  // 1. 连接 / 断开
  // ──────────────────────────────────────────────

  /**
   * 连接到 LYT 后端
   * @param endpoint 连接端点
   * @param credentials 认证凭据 (JSON 对象)
   * @returns 连接会话信息
   * @throws LytErrorInfo 连接失败时抛出网络/协议错误
   */
  connect(endpoint: string, credentials: Record<string, unknown>): Promise<{
    sessionId: string;
    status: LytConnectionStatus;
    connectedAt: string;
    metadata?: Record<string, unknown>;
  }>;

  /**
   * 断开与 LYT 后端的连接
   * @param sessionId 要断开的会话 ID
   * @returns 断开结果
   */
  disconnect(sessionId: string): Promise<{
    success: boolean;
    sessionId: string;
    disconnectedAt: string;
  }>;

  /**
   * 检查当前连接状态
   * @param sessionId 会话 ID (可选)
   * @returns 连接状态
   */
  getConnectionStatus(sessionId?: string): Promise<{
    status: LytConnectionStatus;
    sessionId?: string;
    connectedAt?: string;
    lastActivityAt?: string;
  }>;

  // ──────────────────────────────────────────────
  // 2. 查询 / 操作 / 校验
  // ──────────────────────────────────────────────

  /**
   * 获取会员资料
   * @param memberId 会员 ID
   * @returns 会员资料
   */
  getMember(memberId: string): Promise<LytMemberProfile>;

  /**
   * 创建订单
   * @param payload 订单数据
   * @returns 订单创建结果
   */
  createOrder(payload: LytOrderPayload): Promise<LytOrderResult>;

  /**
   * 应用折扣/优惠券
   * @param orderId 订单 ID
   * @param couponCode 优惠券码
   * @returns 折扣应用结果
   */
  applyDiscount(orderId: string, couponCode: string): Promise<{ orderId: string; couponCode: string }>;

  /**
   * 同步门禁事件
   * @param storeId 门店 ID
   * @param passCode 通行码
   * @returns 门禁事件结果
   */
  syncGateEvent(storeId: string, passCode: string): Promise<{ accepted: boolean; storeId: string }>;

  /**
   * 获取设备状态
   * @param deviceId 设备 ID
   * @returns 设备状态
   */
  getDeviceStatus(deviceId: string): Promise<{ deviceId: string; status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR' }>;

  /**
   * 会员升级 / 资料更新 (可选 — 真实底座才需要, mock 可不实现)
   * cashier-to-lyt 桥接在 member.tier-upgrade 事件触发
   */
  updateMember?(payload: {
    memberId: string;
    tier?: string;
    [k: string]: unknown;
  }): Promise<{ status: 'UPDATED' | 'NOOP'; memberId: string }>;

  /**
   * 通用查询（支持过滤/排序/分页/字段选择）
   * @param request 查询请求
   * @returns 查询结果
   */
  query(request: LytQueryRequest): Promise<LytQueryResult<Record<string, unknown>>>;

  /**
   * 通用操作（创建/更新/删除/启用/禁用/重置/同步）
   * @param request 操作请求
   * @returns 操作结果
   */
  operate(request: LytOperationRequest): Promise<LytOperationResult>;

  /**
   * 验证数据完整性或合规性
   * @param entityType 实体类型
   * @param data 待验证的数据
   * @returns 验证结果
   */
  validate(entityType: string, data: Record<string, unknown>): Promise<LytValidationResult>;

  // ──────────────────────────────────────────────
  // 3. 场地与设备业务查询
  // ──────────────────────────────────────────────

  /**
   * 获取场地列表
   * @param storeId 门店 ID (可选)
   * @returns 场地列表
   */
  getVenues(storeId?: string): Promise<LytVenue[]>;

  /**
   * 获取设备列表（含扩展信息）
   * @param venueId 场地 ID (可选)
   * @returns 设备列表
   */
  getDevices(venueId?: string): Promise<LytDeviceInfo[]>;

  /**
   * 获取扩展会员信息
   * @param memberId 会员 ID
   * @returns 扩展会员信息
   */
  getMemberInfo(memberId: string): Promise<LytMemberInfo>;

  /**
   * 获取扩展订单信息
   * @param orderId 订单 ID
   * @returns 扩展订单信息
   */
  getOrderInfo(orderId: string): Promise<LytOrderInfo>;

  // ──────────────────────────────────────────────
  // 4. 签名 / 解密
  // ──────────────────────────────────────────────

  /**
   * 对请求进行签名
   * @param method HTTP 方法
   * @param path 请求路径
   * @param body 请求体 (可选)
   * @param timestamp 时间戳 (可选, 自动生成)
   * @returns 签名信息
   */
  sign(method: string, path: string, body?: string, timestamp?: string): Promise<LytSignResult>;

  /**
   * 验证回调签名
   * @param signature 待验证的签名
   * @param payload 原始负载
   * @param timestamp 时间戳
   * @returns 签名是否有效
   */
  verifySignature(signature: string, payload: string, timestamp: string): Promise<boolean>;

  /**
   * 解密来自 LYT 的加密数据
   * @param request 解密请求
   * @returns 解密结果
   */
  decrypt(request: LytDecryptRequest): Promise<LytDecryptResult>;

  // ──────────────────────────────────────────────
  // 5. 轮询 / 回调
  // ──────────────────────────────────────────────

  /**
   * 发起一个轮询任务
   * @param taskType 任务类型
   * @param entityId 关联实体 ID
   * @param params 附加参数
   * @returns 轮询任务信息
   */
  startPoll(taskType: LytPollTask['taskType'], entityId: string, params?: Record<string, unknown>): Promise<LytPollTask>;

  /**
   * 查询轮询任务状态
   * @param taskId 任务 ID
   * @returns 轮询任务信息
   */
  getPollStatus(taskId: string): Promise<LytPollTask>;

  /**
   * 取消轮询任务
   * @param taskId 任务 ID
   * @returns 是否成功取消
   */
  cancelPoll(taskId: string): Promise<{ success: boolean; taskId: string }>;

  /**
   * 处理来自 LYT 的回调事件
   * @param event 回调事件数据
   * @returns 处理结果
   */
  handleCallback(event: LytCallbackEvent): Promise<{
    accepted: boolean;
    eventId: string;
    processedBy: string;
  }>;

  // ──────────────────────────────────────────────
  // 6. 错误处理与降级
  // ──────────────────────────────────────────────

  /**
   * 包装原始错误为统一错误信息
   * @param error 原始错误
   * @param context 错误上下文
   * @returns 统一错误信息
   */
  wrapError(error: unknown, context?: { path?: string; requestId?: string }): LytErrorInfo;

  /**
   * 判断错误是否可重试
   * @param error 错误信息
   * @returns 是否可重试
   */
  isRetryable(error: LytErrorInfo): boolean;

  /**
   * 获取超时降级配置
   * @returns 当前降级策略配置
   */
  getTimeoutDowngradeConfig(): LytTimeoutDowngradeConfig;
}

// open-platform.entity.ts · WP-07 开放平台与ISV
// BS-0100~BS-0113

// ────────── 基础枚举 ──────────

/** ISV 应用状态 */
export type IsvAppStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'listed' | 'unlisted';

/** 开发者状态 */
export type IsvDeveloperStatus = 'active' | 'suspended' | 'closed';

/** SLA 状态 */
export type SlaStatus = 'active' | 'breached' | 'terminated';

/** 账单状态 */
export type BillingStatus = 'pending' | 'settled' | 'overdue' | 'cancelled';

/** API 版本状态 */
export type ApiVersionStatus = 'active' | 'deprecated' | 'sunset';

/** SDK 语言 */
export type SdkLanguage = 'javascript' | 'python' | 'java' | 'go' | 'csharp' | 'php';

// ────────── 核心实体 ──────────

// ════════════════════════════════════════════════════════════
// BS-0100: ISV 应用注册
// ════════════════════════════════════════════════════════════

export interface IsvApp {
  id: string;
  name: string;
  description: string;
  /** 所属开发者 ID */
  developerId: string;
  /** 应用状态 */
  status: IsvAppStatus;
  /** API 密钥公钥 */
  apiKey: string;
  /** API 密钥密文 */
  apiSecret: string;
  /** 每日配额 */
  quota: number;
  /** API 版本 (例: 'v1', 'v2') */
  apiVersion: string;
  /** 应用图标 URL */
  iconUrl?: string;
  /** 应用市场分类 */
  category?: string;
  /** 应用市场售价 (分) */
  price?: number;
  /** 应用下载量 */
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
  /** 审核人 */
  reviewedBy?: string;
  /** 审核时间 */
  reviewedAt?: Date;
  /** 审核备注 */
  reviewNote?: string;
}

// ════════════════════════════════════════════════════════════
// BS-0112: ISV 开发者
// ════════════════════════════════════════════════════════════

export interface IsvDeveloper {
  id: string;
  name: string;
  email: string;
  /** 账户余额 (分) */
  balance: number;
  /** 累计收入 (分) */
  totalEarned: number;
  status: IsvDeveloperStatus;
  /** 开发者简介 */
  bio?: string;
  /** 开发者官网 */
  website?: string;
  /** 联系电话 */
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ════════════════════════════════════════════════════════════
// BS-0101: API 密钥管理
// ════════════════════════════════════════════════════════════

export interface ApiKeyRecord {
  id: string;
  appId: string;
  /** 环境: test / live */
  environment: 'test' | 'live';
  /** 密钥公钥 (展示用) */
  apiKey: string;
  /** 密钥密文 (仅创建时返回) */
  apiSecret?: string;
  /** 密钥哈希 (用于校验) */
  apiSecretHash: string;
  status: 'active' | 'rotated' | 'revoked';
  /** 创建者 */
  createdBy: string;
  /** 轮换后的新密钥 ID */
  rotatedToId?: string;
  /** 吊销原因 */
  revokeReason?: string;
  createdAt: Date;
  rotatedAt?: Date;
  revokedAt?: Date;
}

// ════════════════════════════════════════════════════════════
// BS-0108: API 调用记录（计费基础）
// ════════════════════════════════════════════════════════════

export interface ApiCallRecord {
  id: string;
  appId: string;
  /** 开发者 ID */
  developerId: string;
  /** 请求端点 */
  endpoint: string;
  /** 调用时间 */
  timestamp: Date;
  /** 调用消耗 (分) */
  cost: number;
  /** HTTP 状态码 */
  statusCode: number;
  /** 请求签名 */
  signature: string;
  /** 请求 IP */
  ipAddress?: string;
  /** 请求耗时 (ms) */
  durationMs: number;
}

// ════════════════════════════════════════════════════════════
// BS-0109: SLA 合同
// ════════════════════════════════════════════════════════════

export interface SlaContract {
  id: string;
  appId: string;
  /** SLA 等级名称 */
  tierName: string;
  /** 承诺可用率 (0~1) */
  uptimeGuarantee: number;
  /** 违约罚金比例 (0~1) */
  penaltyRate: number;
  /** 月度调用量承诺 */
  monthlyCallCommitment: number;
  /** 超出部分单价 (分) */
  overageUnitPrice: number;
  status: SlaStatus;
  startDate: Date;
  endDate?: Date;
  /** 当月可用率 */
  currentUptime: number;
  /** 当月调用量 */
  currentCalls: number;
  /** 当月违约次数 */
  breachCount: number;
  /** 已扣罚金总额 (分) */
  totalPenalty: number;
  createdAt: Date;
  updatedAt: Date;
}

// ════════════════════════════════════════════════════════════
// BS-0110: 账单
// ════════════════════════════════════════════════════════════

export interface BillingRecord {
  id: string;
  developerId: string;
  appId: string;
  /** 账单月份 (YYYY-MM) */
  billingMonth: string;
  /** 调用总次数 */
  totalCalls: number;
  /** 总费用 (分) */
  totalAmount: number;
  /** SLA 罚金 (分) */
  slaPenalty: number;
  /** 最终结算金额 (分, totalAmount - slaPenalty) */
  settleAmount: number;
  status: BillingStatus;
  /** 调用明细 */
  callDetails?: ApiCallRecord[];
  /** 结算时间 */
  settledAt?: Date;
  createdAt: Date;
}

// ════════════════════════════════════════════════════════════
// BS-0106: API 版本
// ════════════════════════════════════════════════════════════

export interface ApiVersion {
  id: string;
  version: string;  // 'v1', 'v2'
  basePath: string; // '/api/v1', '/api/v2'
  status: ApiVersionStatus;
  /** 发布说明 */
  changelog?: string;
  /** 废弃时间 */
  deprecatedAt?: Date;
  /** 完全下线时间 */
  sunsetAt?: Date;
  /** 迁移建议 */
  migrationGuide?: string;
  createdAt: Date;
}

// ════════════════════════════════════════════════════════════
// BS-0104: SDK 版本
// ════════════════════════════════════════════════════════════

export interface SdkVersion {
  id: string;
  appId: string;
  language: SdkLanguage;
  version: string;          // semver
  downloadUrl: string;
  /** SDK 文档内容 (Markdown) */
  docContent?: string;
  /** 是否兼容最新 API */
  isLatest: boolean;
  changelog?: string;
  createdAt: Date;
}

// ════════════════════════════════════════════════════════════
// BS-0113: 应用市场商品
// ════════════════════════════════════════════════════════════

export interface MarketplaceItem {
  id: string;
  appId: string;
  /** 展示名称 */
  displayName: string;
  /** 简短描述 */
  summary: string;
  /** 详细描述 */
  description: string;
  /** 分类标签 */
  tags: string[];
  /** 价格 (分, 0 表示免费) */
  price: number;
  /** 截图 URL 列表 */
  screenshots: string[];
  /** 是否为官方推荐 */
  isFeatured: boolean;
  /** 评分 (0~5) */
  rating: number;
  /** 评价数 */
  reviewCount: number;
  /** 上架时间 */
  listedAt: Date;
  updatedAt: Date;
}

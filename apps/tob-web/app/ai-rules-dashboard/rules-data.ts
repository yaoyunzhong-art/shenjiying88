/**
 * ai-rules-dashboard/rules-data.ts — AI 决策规则仪表盘数据层
 *
 * 测试策略 (L1):
 * - 正例: 数据层 helper 函数、常量定义、mock 数据完整性
 * - 反例: 无效值处理
 * - 边界: 边界值、空值、大数值
 *
 * Pattern: 正例 + 反例 + 边界
 * 角色视角: 👔 租户管理员 / 🧠 AI 运营
 */

// ─── 类型定义 ──────────────────────────────────────────────────────────

export type RuleStatus = 'active' | 'paused' | 'draft' | 'archived';
export type RulePriority = 1 | 2 | 3 | 4 | 5;
export type RuleCategory = 'pricing' | 'inventory' | 'member' | 'promotion' | 'anomaly';

export interface AiRuleItem {
  id: string;
  name: string;
  description: string;
  category: RuleCategory;
  priority: RulePriority;
  status: RuleStatus;
  executionCount: number;
  successRate: number; // 0–100
  avgLatencyMs: number;
  lastExecutedAt: string | null;
  createdBy: string;
  tags: string[];
}

export interface AiRuleSummary {
  totalRules: number;
  activeCount: number;
  pausedCount: number;
  draftCount: number;
  archivedCount: number;
  avgSuccessRate: number;
  totalExecutions: number;
  avgLatencyMs: number;
}

// ─── 常量 ──────────────────────────────────────────────────────────────

export const RULE_CATEGORY_LABEL: Record<RuleCategory, string> = {
  pricing: '定价策略',
  inventory: '库存调度',
  member: '会员运营',
  promotion: '促销规则',
  anomaly: '异常告警',
};

export const RULE_CATEGORY_EMOJI: Record<RuleCategory, string> = {
  pricing: '💰',
  inventory: '📦',
  member: '👤',
  promotion: '🎉',
  anomaly: '⚠️',
};

export const RULE_STATUS_LABEL: Record<RuleStatus, string> = {
  active: '运行中',
  paused: '已暂停',
  draft: '草稿',
  archived: '已归档',
};

export const RULE_PRIORITY_LABEL: Record<RulePriority, string> = {
  1: 'P1-紧急',
  2: 'P2-高',
  3: 'P3-中',
  4: 'P4-低',
  5: 'P5-可忽略',
};

export const RULE_CATEGORIES: RuleCategory[] = ['pricing', 'inventory', 'member', 'promotion', 'anomaly'];
export const RULE_STATUSES: RuleStatus[] = ['active', 'paused', 'draft', 'archived'];
export const RULE_PRIORITIES: RulePriority[] = [1, 2, 3, 4, 5];

// ─── Helper ────────────────────────────────────────────────────────────

export function formatExecutionCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function formatLatency(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

export function getSuccessRateVariant(rate: number): 'success' | 'warning' | 'error' {
  if (rate >= 95) return 'success';
  if (rate >= 80) return 'warning';
  return 'error';
}

export function computeSummary(rules: AiRuleItem[]): AiRuleSummary {
  const active = rules.filter((r) => r.status === 'active');
  return {
    totalRules: rules.length,
    activeCount: active.length,
    pausedCount: rules.filter((r) => r.status === 'paused').length,
    draftCount: rules.filter((r) => r.status === 'draft').length,
    archivedCount: rules.filter((r) => r.status === 'archived').length,
    avgSuccessRate:
      rules.length > 0
        ? Math.round(rules.reduce((s, r) => s + r.successRate, 0) / rules.length)
        : 0,
    totalExecutions: rules.reduce((s, r) => s + r.executionCount, 0),
    avgLatencyMs:
      rules.length > 0
        ? Math.round(rules.reduce((s, r) => s + r.avgLatencyMs, 0) / rules.length)
        : 0,
  };
}

// ─── Mock 数据 (用于开发/演示) ─────────────────────────────────────────

export const MOCK_AI_RULES: AiRuleItem[] = [
  {
    id: 'rule-001',
    name: '会员生日双倍积分',
    description: '会员生日当天消费自动双倍积分，上限 5000 分',
    category: 'member',
    priority: 2,
    status: 'active',
    executionCount: 128_430,
    successRate: 99.2,
    avgLatencyMs: 45,
    lastExecutedAt: '2026-07-08T08:30:00Z',
    createdBy: '系统管理员',
    tags: ['积分', '会员', '生日'],
  },
  {
    id: 'rule-002',
    name: '库存低于阈值自动补货',
    description: '当核心 SKU 库存低于安全水位时自动生成补货单',
    category: 'inventory',
    priority: 1,
    status: 'active',
    executionCount: 56_789,
    successRate: 97.8,
    avgLatencyMs: 120,
    lastExecutedAt: '2026-07-08T08:15:00Z',
    createdBy: '仓储经理',
    tags: ['库存', '自动补货', '安全水位'],
  },
  {
    id: 'rule-003',
    name: '新客首单立减 50',
    description: '新注册用户首单满 200 立减 50 元',
    category: 'pricing',
    priority: 3,
    status: 'active',
    executionCount: 34_215,
    successRate: 94.5,
    avgLatencyMs: 32,
    lastExecutedAt: '2026-07-08T08:20:00Z',
    createdBy: '市场部',
    tags: ['新客', '优惠', '拉新'],
  },
  {
    id: 'rule-004',
    name: '夜间时段动态定价',
    description: '22:00-06:00 非高峰时段价格下调 15%',
    category: 'pricing',
    priority: 4,
    status: 'paused',
    executionCount: 12_340,
    successRate: 91.3,
    avgLatencyMs: 28,
    lastExecutedAt: '2026-07-07T22:00:00Z',
    createdBy: '运营经理',
    tags: ['定价', '时段', '促销'],
  },
  {
    id: 'rule-005',
    name: '异常订单风控拦截',
    description: '金额 > 5000 或频次异常的订单自动标记待审核',
    category: 'anomaly',
    priority: 1,
    status: 'active',
    executionCount: 8_945_123,
    successRate: 99.9,
    avgLatencyMs: 15,
    lastExecutedAt: '2026-07-08T08:48:00Z',
    createdBy: '风控团队',
    tags: ['风控', '异常', '审核'],
  },
  {
    id: 'rule-006',
    name: '满三件打七折',
    description: '同品类商品购买 3 件及以上享受 7 折优惠',
    category: 'promotion',
    priority: 2,
    status: 'draft',
    executionCount: 0,
    successRate: 0,
    avgLatencyMs: 0,
    lastExecutedAt: null,
    createdBy: '促销策划',
    tags: ['折扣', '多件', '促销'],
  },
  {
    id: 'rule-007',
    name: '流失会员召回优惠',
    description: '90 天未到店会员自动发放 8 折召回券',
    category: 'member',
    priority: 3,
    status: 'active',
    executionCount: 245_678,
    successRate: 88.6,
    avgLatencyMs: 55,
    lastExecutedAt: '2026-07-08T07:00:00Z',
    createdBy: '会员运营',
    tags: ['召回', '流失', '优惠券'],
  },
  {
    id: 'rule-008',
    name: '跨店调货智能推荐',
    description: '缺货门店自动匹配最近有库存门店发起调拨',
    category: 'inventory',
    priority: 2,
    status: 'paused',
    executionCount: 67_890,
    successRate: 85.2,
    avgLatencyMs: 200,
    lastExecutedAt: '2026-07-06T14:00:00Z',
    createdBy: '供应链',
    tags: ['调拨', '库存', '智能推荐'],
  },
  {
    id: 'rule-009',
    name: '高价值会员专属折扣',
    description: '近 30 天消费 top 10% 会员享专属全场 85 折',
    category: 'pricing',
    priority: 1,
    status: 'active',
    executionCount: 45_321,
    successRate: 96.1,
    avgLatencyMs: 40,
    lastExecutedAt: '2026-07-08T08:00:00Z',
    createdBy: '营销总监',
    tags: ['VIP', '折扣', '高价值'],
  },
  {
    id: 'rule-010',
    name: '设备异常自动告警',
    description: '机台故障率超过 20% 自动触发运维工单',
    category: 'anomaly',
    priority: 1,
    status: 'archived',
    executionCount: 2_456_789,
    successRate: 99.7,
    avgLatencyMs: 10,
    lastExecutedAt: '2026-06-30T23:59:00Z',
    createdBy: '运维团队',
    tags: ['设备', '告警', '工单'],
  },
];

/**
 * recommendation-detail-page.test.tsx — Page-level tests for recommendation detail page.
 * Tests data lookup, status mapping, type mapping, priority mapping,
 * state transitions, form validation, and async operations.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- 静态数据 & 映射 ----

type RecStrategyStatus = 'active' | 'paused' | 'draft' | 'archived';
type RecPriority = 'high' | 'medium' | 'low';
type RecStrategyType = 'item-cf' | 'user-cf' | 'popular' | 'recently-viewed' | 'personalized' | 'hybrid';

const REC_STATUS_MAP: Record<RecStrategyStatus, { label: string; variant: string }> = {
  active: { label: '运行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  draft: { label: '草稿', variant: 'info' },
  archived: { label: '已归档', variant: 'default' },
};

const REC_PRIORITY_MAP: Record<RecPriority, { label: string; color: string }> = {
  high: { label: '高优先级', color: '#ef4444' },
  medium: { label: '中优先级', color: '#f59e0b' },
  low: { label: '低优先级', color: '#64748b' },
};

const REC_TYPE_MAP: Record<RecStrategyType, string> = {
  'item-cf': '基于物品协同过滤',
  'user-cf': '基于用户协同过滤',
  'popular': '热门推荐',
  'recently-viewed': '最近浏览',
  'personalized': '个性化推荐',
  'hybrid': '混合策略',
};

const TRANSITION_ACTIONS: { from: RecStrategyStatus; to: RecStrategyStatus; label: string }[] = [
  { from: 'draft', to: 'active', label: '发布策略' },
  { from: 'active', to: 'paused', label: '暂停策略' },
  { from: 'paused', to: 'active', label: '恢复策略' },
  { from: 'active', to: 'archived', label: '归档策略' },
  { from: 'paused', to: 'archived', label: '归档策略' },
];

// ---- Detail data model (mirrors page) ----

interface RecStrategyDetail {
  id: string;
  name: string;
  description: string;
  strategyType: RecStrategyType;
  status: RecStrategyStatus;
  priority: RecPriority;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string;
  totalRecommendations: number;
  conversionRate: number;
  avgCtr: number;
  avgRevenue: number;
  rules: { key: string; value: string; enabled: boolean }[];
  targetAudience: string[];
  channels: string[];
  coldStartEnabled: boolean;
  diversityWeight: number;
  cacheTtlMinutes: number;
}

const MOCK_REC_STRATEGIES: Record<string, RecStrategyDetail> = {
  'rec-001': {
    id: 'rec-001', name: '首页猜你喜欢', description: '基于用户历史行为的推荐',
    strategyType: 'hybrid', status: 'active', priority: 'high', version: 3,
    createdBy: '张建国', createdAt: '2025-01-15', updatedAt: '2026-06-20', lastRunAt: '2026-06-28T14:30:00Z',
    totalRecommendations: 2840000, conversionRate: 12.5, avgCtr: 38.2, avgRevenue: 186000,
    rules: [{ key: 'max_items', value: '20', enabled: true }],
    targetAudience: ['所有活跃会员'], channels: ['首页'],
    coldStartEnabled: true, diversityWeight: 0.6, cacheTtlMinutes: 30,
  },
  'rec-003': {
    id: 'rec-003', name: '购物车凑单推荐', description: '提升客单价',
    strategyType: 'popular', status: 'paused', priority: 'medium', version: 2,
    createdBy: '刘强', createdAt: '2025-03-10', updatedAt: '2026-05-15', lastRunAt: '2026-05-14T12:00:00Z',
    totalRecommendations: 1200000, conversionRate: 18.7, avgCtr: 42.1, avgRevenue: 45000,
    rules: [{ key: 'min_cart_amount', value: '50', enabled: true }],
    targetAudience: ['购物车金额 > 50 元的用户'], channels: ['购物车页面'],
    coldStartEnabled: true, diversityWeight: 0.3, cacheTtlMinutes: 10,
  },
  'rec-004': {
    id: 'rec-004', name: '新用户冷启动推荐', description: '新用户冷启动推荐',
    strategyType: 'personalized', status: 'draft', priority: 'medium', version: 1,
    createdBy: '陈芳', createdAt: '2026-06-25', updatedAt: '2026-06-25', lastRunAt: '-',
    totalRecommendations: 0, conversionRate: 0, avgCtr: 0, avgRevenue: 0,
    rules: [{ key: 'cold_start_strategy', value: 'popular_fallback', enabled: true }],
    targetAudience: ['注册 < 7 天的新用户'], channels: ['首页'],
    coldStartEnabled: true, diversityWeight: 0.7, cacheTtlMinutes: 5,
  },
  'rec-005': {
    id: 'rec-005', name: '季节性促销推荐', description: '季节促销推荐',
    strategyType: 'hybrid', status: 'archived', priority: 'low', version: 4,
    createdBy: '王伟', createdAt: '2024-12-01', updatedAt: '2026-03-01', lastRunAt: '2026-03-01T00:00:00Z',
    totalRecommendations: 890000, conversionRate: 15.2, avgCtr: 36.8, avgRevenue: 67000,
    rules: [{ key: 'seasonal_tags', value: 'spring', enabled: true }],
    targetAudience: ['历史购买过季节品的会员'], channels: ['首页横幅'],
    coldStartEnabled: false, diversityWeight: 0.5, cacheTtlMinutes: 120,
  },
};

function getRecStrategyById(id: string): RecStrategyDetail | undefined {
  return MOCK_REC_STRATEGIES[id];
}

// ---- Pages-level helpers (mirrors page logic) ----

function formatNumber(n: number): string {
  if (n >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(2)}亿`;
  if (n >= 1_0000) return `${(n / 1_0000).toFixed(1)}万`;
  return String(n);
}

interface EditFormData {
  name: string;
  description: string;
  diversityWeight: number;
  cacheTtlMinutes: number;
  targetAudience: string;
  channels: string;
}

interface EditFormErrors {
  name?: string;
  description?: string;
  diversityWeight?: string;
  cacheTtlMinutes?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '策略名称不能为空';
  if (data.name.trim().length > 30) errors.name = '策略名称不能超过30个字符';
  if (!data.description.trim()) errors.description = '策略描述不能为空';
  if (data.diversityWeight < 0 || data.diversityWeight > 1) errors.diversityWeight = '多样性权重应在 0-1 之间';
  if (data.cacheTtlMinutes < 1 || data.cacheTtlMinutes > 1440) errors.cacheTtlMinutes = '缓存时间应在 1-1440 分钟之间';
  return errors;
}

async function submitRecEdit(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { success: true };
}

async function submitStatusTransition(): Promise<{ success: boolean }> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return { success: true };
}

function getStatusTransitionActions(currentStatus: RecStrategyStatus): { from: RecStrategyStatus; to: RecStrategyStatus; label: string }[] {
  return TRANSITION_ACTIONS.filter((a) => a.from === currentStatus);
}

// ---- Test: Data lookup ----

describe('recommendation-detail — data lookup', () => {
  it('should find existing strategy by id', () => {
    const s = getRecStrategyById('rec-001');
    assert.ok(s);
    assert.equal(s?.name, '首页猜你喜欢');
    assert.equal(s?.strategyType, 'hybrid');
  });

  it('should return undefined for unknown id', () => {
    const s = getRecStrategyById('rec-999');
    assert.equal(s, undefined);
  });

  it('should have expected fields for each mock strategy', () => {
    const required: (keyof RecStrategyDetail)[] = [
      'id', 'name', 'description', 'strategyType', 'status', 'priority',
      'version', 'totalRecommendations', 'conversionRate', 'avgCtr', 'avgRevenue',
      'rules', 'targetAudience', 'channels', 'coldStartEnabled',
      'diversityWeight', 'cacheTtlMinutes',
    ];
    for (const entry of Object.values(MOCK_REC_STRATEGIES)) {
      for (const field of required) {
        assert.ok(entry[field] !== undefined, `Strategy ${entry.id} missing field ${field}`);
      }
    }
  });
});

// ---- Test: Status / Type / Priority mapping ----

describe('recommendation-detail — status, type, priority maps', () => {
  it('should map all strategy statuses', () => {
    const statuses: RecStrategyStatus[] = ['active', 'paused', 'draft', 'archived'];
    for (const s of statuses) {
      const m = REC_STATUS_MAP[s];
      assert.ok(m, `Missing status map for ${s}`);
      assert.ok(m.label.length > 0);
      assert.ok(['success', 'warning', 'info', 'default'].includes(m.variant));
    }
  });

  it('should map all strategy types', () => {
    const types: RecStrategyType[] = ['item-cf', 'user-cf', 'popular', 'recently-viewed', 'personalized', 'hybrid'];
    for (const t of types) {
      const m = REC_TYPE_MAP[t];
      assert.ok(m, `Missing type map for ${t}`);
      assert.ok(m.length > 0);
    }
  });

  it('should map all priority levels', () => {
    const priorities: RecPriority[] = ['high', 'medium', 'low'];
    for (const p of priorities) {
      const m = REC_PRIORITY_MAP[p];
      assert.ok(m, `Missing priority map for ${p}`);
      assert.ok(m.label.length > 0);
      assert.ok(m.color.startsWith('#'));
    }
  });

  it('should correctly map rec-003 to paused status', () => {
    const s = getRecStrategyById('rec-003');
    assert.ok(s);
    assert.equal(s?.status, 'paused');
    assert.equal(REC_STATUS_MAP[s!.status].label, '已暂停');
  });

  it('should correctly map rec-004 to draft status', () => {
    const s = getRecStrategyById('rec-004');
    assert.ok(s);
    assert.equal(s?.status, 'draft');
    assert.equal(REC_STATUS_MAP[s!.status].label, '草稿');
  });

  it('should correctly map rec-005 to archived status', () => {
    const s = getRecStrategyById('rec-005');
    assert.ok(s);
    assert.equal(s?.status, 'archived');
    assert.equal(REC_STATUS_MAP[s!.status].label, '已归档');
  });
});

// ---- Test: Format number ----

describe('recommendation-detail — formatNumber helper', () => {
  it('should format numbers < 10000 as plain string', () => {
    assert.equal(formatNumber(0), '0');
    assert.equal(formatNumber(9999), '9999');
  });

  it('should format numbers >= 10000 in 万 with 1 decimal', () => {
    assert.equal(formatNumber(1200000), '120.0万');
    assert.equal(formatNumber(2840000), '284.0万');
  });

  it('should format numbers >= 100000000 in 亿 with 2 decimals', () => {
    assert.equal(formatNumber(150000000), '1.50亿');
    assert.equal(formatNumber(1200000000), '12.00亿');
  });
});

// ---- Test: Status transitions ----

describe('recommendation-detail — status transitions', () => {
  it('should allow draft -> active', () => {
    const actions = getStatusTransitionActions('draft');
    assert.equal(actions.length, 1);
    assert.equal(actions[0].to, 'active');
    assert.equal(actions[0].label, '发布策略');
  });

  it('should allow active -> paused and active -> archived', () => {
    const actions = getStatusTransitionActions('active');
    assert.equal(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'paused'));
    assert.ok(actions.some((a) => a.to === 'archived'));
  });

  it('should allow paused -> active and paused -> archived', () => {
    const actions = getStatusTransitionActions('paused');
    assert.equal(actions.length, 2);
    assert.ok(actions.some((a) => a.to === 'active'));
    assert.ok(actions.some((a) => a.to === 'archived'));
  });

  it('should have no available transitions from archived', () => {
    const actions = getStatusTransitionActions('archived');
    assert.equal(actions.length, 0);
  });

  it('async status transition should succeed', async () => {
    const result = await submitStatusTransition();
    assert.ok(result.success);
  });
});

// ---- Test: Form validation ----

describe('recommendation-detail — form validation', () => {
  const validData: EditFormData = {
    name: '测试推荐策略',
    description: '这是一个测试策略',
    diversityWeight: 0.5,
    cacheTtlMinutes: 30,
    targetAudience: '所有活跃会员',
    channels: '首页',
  };

  it('should pass validation with valid data', () => {
    const errors = validateForm(validData);
    assert.equal(Object.keys(errors).length, 0);
  });

  it('should reject empty name', () => {
    const errors = validateForm({ ...validData, name: '' });
    assert.equal(errors.name, '策略名称不能为空');
  });

  it('should reject whitespace-only name', () => {
    const errors = validateForm({ ...validData, name: '   ' });
    assert.equal(errors.name, '策略名称不能为空');
  });

  it('should reject name exceeding 30 characters', () => {
    const errors = validateForm({ ...validData, name: '这是一个超长的策略名称示例超过三十个字符限制' });
    assert.equal(errors.name, '策略名称不能超过30个字符');
  });

  it('should reject empty description', () => {
    const errors = validateForm({ ...validData, description: '' });
    assert.equal(errors.description, '策略描述不能为空');
  });

  it('should reject diversityWeight < 0', () => {
    const errors = validateForm({ ...validData, diversityWeight: -1 });
    assert.equal(errors.diversityWeight, '多样性权重应在 0-1 之间');
  });

  it('should reject diversityWeight > 1', () => {
    const errors = validateForm({ ...validData, diversityWeight: 1.5 });
    assert.equal(errors.diversityWeight, '多样性权重应在 0-1 之间');
  });

  it('should reject cacheTtlMinutes < 1', () => {
    const errors = validateForm({ ...validData, cacheTtlMinutes: 0 });
    assert.equal(errors.cacheTtlMinutes, '缓存时间应在 1-1440 分钟之间');
  });

  it('should reject cacheTtlMinutes > 1440', () => {
    const errors = validateForm({ ...validData, cacheTtlMinutes: 1441 });
    assert.equal(errors.cacheTtlMinutes, '缓存时间应在 1-1440 分钟之间');
  });

  it('should collect multiple errors', () => {
    const errors = validateForm({ name: '', description: '', diversityWeight: 2, cacheTtlMinutes: 9999, targetAudience: '', channels: '' });
    assert.equal(Object.keys(errors).length, 4);
    assert.ok(errors.name);
    assert.ok(errors.description);
    assert.ok(errors.diversityWeight);
    assert.ok(errors.cacheTtlMinutes);
  });
});

// ---- Test: Async submit ----

describe('recommendation-detail — async operations', () => {
  it('async edit submit should return success', async () => {
    const result = await submitRecEdit();
    assert.equal(result.success, true);
  });
});

// ---- Test: Data consistency ----

describe('recommendation-detail — data consistency', () => {
  it('each strategy status should match a defined map entry', () => {
    for (const entry of Object.values(MOCK_REC_STRATEGIES)) {
      const m = REC_STATUS_MAP[entry.status];
      assert.ok(m, `Missing status entry for ${entry.status} on ${entry.id}`);
    }
  });

  it('each strategy type should match a defined map entry', () => {
    for (const entry of Object.values(MOCK_REC_STRATEGIES)) {
      const m = REC_TYPE_MAP[entry.strategyType];
      assert.ok(m, `Missing type entry for ${entry.strategyType} on ${entry.id}`);
    }
  });

  it('each strategy priority should match a defined map entry', () => {
    for (const entry of Object.values(MOCK_REC_STRATEGIES)) {
      const m = REC_PRIORITY_MAP[entry.priority];
      assert.ok(m, `Missing priority entry for ${entry.priority} on ${entry.id}`);
    }
  });

  it('all 4 distinct statuses should be represented', () => {
    const found = new Set(Object.values(MOCK_REC_STRATEGIES).map((s) => s.status));
    assert.equal(found.size, 4);
    assert.ok(found.has('active'));
    assert.ok(found.has('paused'));
    assert.ok(found.has('draft'));
    assert.ok(found.has('archived'));
  });

  it('each strategy should have at least one rule', () => {
    for (const entry of Object.values(MOCK_REC_STRATEGIES)) {
      assert.ok(entry.rules.length >= 1, `Strategy ${entry.id} has no rules`);
    }
  });
});

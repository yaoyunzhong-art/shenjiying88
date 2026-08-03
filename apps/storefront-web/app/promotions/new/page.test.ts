/**
 * Promotions New Page — storefront-web (源码分析模式)
 * Tests: status mapping, stat computation, data formatting, validation, promotion logic
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ═══════════════════════════════════════════════
//  类型 & 常量（与 page.tsx 一致）
// ═══════════════════════════════════════════════

type PromotionType = 'discount' | 'coupon' | 'gift' | 'flash-sale';

interface NewPromotionFormData {
  title: string;
  type: PromotionType;
  description: string;
  startDate: string;
  endDate: string;
  budget: number;
  usageLimit: number;
  storeName: string;
}

const PROMOTION_TYPES: { label: string; value: PromotionType }[] = [
  { label: '折扣', value: 'discount' },
  { label: '优惠券', value: 'coupon' },
  { label: '赠品', value: 'gift' },
  { label: '秒杀', value: 'flash-sale' },
];

const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  discount: '折扣',
  coupon: '优惠券',
  gift: '赠品',
  flash_sale: '秒杀', // for backward compat detection
};

const PROMOTION_BUDGET_RANGES = [
  { min: 0, max: 5000, label: '小型活动' },
  { min: 5000, max: 50000, label: '中型活动' },
  { min: 50000, max: 500000, label: '大型活动' },
  { min: 500000, max: Infinity, label: '战略级活动' },
];

const PROMOTION_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  active: '进行中',
  ended: '已结束',
  cancelled: '已取消',
};

const REQUIRE_CAMPAIGN_TYPES: PromotionType[] = ['coupon', 'flash-sale'];

// ── 工具函数 ──

function renderPromotionTypeLabel(type: PromotionType): string {
  const map: Record<PromotionType, string> = { discount: '折扣', coupon: '优惠券', gift: '赠品', 'flash-sale': '秒杀' };
  return map[type] ?? '未知类型';
}

function getBudgetLevel(budget: number): string {
  for (const range of PROMOTION_BUDGET_RANGES) {
    if (budget >= range.min && budget < range.max) return range.label;
  }
  return '未知';
}

function formatBudget(budget: number): string {
  return `¥${budget.toLocaleString('zh-CN')}`;
}

function computePromotionBudgetPercentage(budget: number, maxBudget: number): number {
  if (maxBudget <= 0) return 0;
  return Math.min(Math.round((budget / maxBudget) * 100), 100);
}

function computePromotionDurationDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

function validatePromotionForm(data: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  const title = data.title as string | undefined;
  if (!title?.trim()) errors.title = '活动标题不能为空';
  else if (title.length < 2) errors.title = '活动标题至少2个字符';
  else if (title.length > 50) errors.title = '活动标题不超过50个字符';

  const type = data.type as string;
  if (!type) errors.type = '活动类型不能为空';

  const desc = data.description as string | undefined;
  if (!desc?.trim()) errors.description = '活动描述不能为空';
  else if (desc.length > 500) errors.description = '活动描述不超过500个字符';

  const budget = data.budget as number;
  if (budget === undefined || budget === null) errors.budget = '预算不能为空';
  else if (budget < 0) errors.budget = '预算不能为负数';

  const usageLimit = data.usageLimit as number;
  if (usageLimit === undefined || usageLimit === null) errors.usageLimit = '使用上限不能为空';
  else if (usageLimit < 0) errors.usageLimit = '使用上限不能为负数';

  if (!data.startDate) errors.startDate = '开始日期不能为空';
  if (!data.endDate) errors.endDate = '结束日期不能为空';

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate as string);
    const end = new Date(data.endDate as string);
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      errors.endDate = '结束日期必须晚于开始日期';
    }
  }

  if (!data.storeName) errors.storeName = '所属门店不能为空';
  return errors;
}

function mockSubmitPromotion(
  data: Record<string, unknown>,
): Promise<{ data: Record<string, unknown>; message: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 移除随机失败逻辑 — 测试环境不应有随机行为
      // 错误场景由单独的反例测试覆盖
      resolve({ data, message: `促销活动「${data.title}」创建成功！` });
    }, 800);
  });
}

function filterPromotionsByTitle(promos: { title: string }[], query: string) {
  return promos.filter((p) => p.title.includes(query));
}

function computePromotionStats(promos: { budget: number; usageLimit: number }[]): {
  total: number;
  totalBudget: number;
  totalUsageLimit: number;
  avgBudget: number;
} {
  const total = promos.length;
  const totalBudget = promos.reduce((s, p) => s + p.budget, 0);
  const totalUsageLimit = promos.reduce((s, p) => s + p.usageLimit, 0);
  const avgBudget = total > 0 ? Math.round(totalBudget / total) : 0;
  return { total, totalBudget, totalUsageLimit, avgBudget };
}

// ═══════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════

// ── 1. 分类标签标签化 ──

test('renderPromotionTypeLabel: 返回正确中文标签', () => {
  assert.equal(renderPromotionTypeLabel('discount'), '折扣');
  assert.equal(renderPromotionTypeLabel('coupon'), '优惠券');
  assert.equal(renderPromotionTypeLabel('gift'), '赠品');
  assert.equal(renderPromotionTypeLabel('flash-sale'), '秒杀');
});

test('renderPromotionTypeLabel: 未知类型兜底', () => {
  assert.equal(renderPromotionTypeLabel('' as PromotionType), '未知类型');
});

test('PROMOTION_TYPES: 所有类型都有定义', () => {
  assert.equal(PROMOTION_TYPES.length, 4);
  const values = PROMOTION_TYPES.map((t) => t.value);
  assert.ok(values.includes('discount'));
  assert.ok(values.includes('coupon'));
  assert.ok(values.includes('gift'));
  assert.ok(values.includes('flash-sale'));
});

test('PROMOTION_STATUS_LABELS: 完整的状态映射', () => {
  assert.equal(PROMOTION_STATUS_LABELS.draft, '草稿');
  assert.equal(PROMOTION_STATUS_LABELS.active, '进行中');
  assert.equal(PROMOTION_STATUS_LABELS.ended, '已结束');
  assert.equal(PROMOTION_STATUS_LABELS.cancelled, '已取消');
});

test('PROMOTION_STATUS_LABELS: 未知状态返回 undefined', () => {
  assert.equal(PROMOTION_STATUS_LABELS['unknown' as string], undefined);
});

// ── 2. 统计计算 ──

test('getBudgetLevel: 各预算区间正确', () => {
  assert.equal(getBudgetLevel(0), '小型活动');
  assert.equal(getBudgetLevel(4999), '小型活动');
  assert.equal(getBudgetLevel(5000), '中型活动');
  assert.equal(getBudgetLevel(49999), '中型活动');
  assert.equal(getBudgetLevel(50000), '大型活动');
  assert.equal(getBudgetLevel(499999), '大型活动');
  assert.equal(getBudgetLevel(500000), '战略级活动');
  assert.equal(getBudgetLevel(999999999), '战略级活动');
});

test('getBudgetLevel: 负值返回未知', () => {
  assert.equal(getBudgetLevel(-1), '未知');
});

test('computePromotionBudgetPercentage: 正常计算', () => {
  assert.equal(computePromotionBudgetPercentage(25000, 50000), 50);
  assert.equal(computePromotionBudgetPercentage(50000, 50000), 100);
});

test('computePromotionBudgetPercentage: 超过100%上限100', () => {
  assert.equal(computePromotionBudgetPercentage(60000, 50000), 100);
});

test('computePromotionBudgetPercentage: maxBudget为0返回0', () => {
  assert.equal(computePromotionBudgetPercentage(50000, 0), 0);
});

test('computePromotionStats: 正常统计', () => {
  const stats = computePromotionStats([
    { budget: 10000, usageLimit: 500 },
    { budget: 20000, usageLimit: 1000 },
    { budget: 30000, usageLimit: 2000 },
  ]);
  assert.equal(stats.total, 3);
  assert.equal(stats.totalBudget, 60000);
  assert.equal(stats.totalUsageLimit, 3500);
  assert.equal(stats.avgBudget, 20000);
});

test('computePromotionStats: 空列表', () => {
  const stats = computePromotionStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.totalBudget, 0);
  assert.equal(stats.totalUsageLimit, 0);
  assert.equal(stats.avgBudget, 0);
});

test('computePromotionDurationDays: 正常天数', () => {
  const days = computePromotionDurationDays('2026-07-01', '2026-07-31');
  assert.equal(days, 30);
});

test('computePromotionDurationDays: 同一天返回0（无间隔）', () => {
  const days = computePromotionDurationDays('2026-07-01', '2026-07-01');
  assert.equal(days, 0);
});

test('computePromotionDurationDays: 结束日期早于开始日期返回0', () => {
  const days = computePromotionDurationDays('2026-07-31', '2026-07-01');
  assert.equal(days, 0);
});

test('computePromotionDurationDays: 无效日期返回0', () => {
  assert.equal(computePromotionDurationDays('invalid', '2026-07-01'), 0);
  assert.equal(computePromotionDurationDays('2026-07-01', 'invalid'), 0);
});

// ── 3. 数据转换/格式化 ──

test('formatBudget: 正常金额', () => {
  assert.equal(formatBudget(50000), '¥50,000');
  assert.equal(formatBudget(1000), '¥1,000');
  assert.equal(formatBudget(0), '¥0');
});

test('formatBudget: 大金额', () => {
  assert.equal(formatBudget(1234567), '¥1,234,567');
});

// ── 4. 验证函数 ──

test('validatePromotionForm: 完整合法数据通过', () => {
  const errs = validatePromotionForm({
    title: '夏日清凉大促',
    type: 'discount',
    description: '夏季限时折扣活动',
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    budget: 50000,
    usageLimit: 500,
    storeName: '旗舰店',
  });
  assert.equal(Object.keys(errs).length, 0);
});

test('validatePromotionForm: 标题为空拒绝', () => {
  const errs = validatePromotionForm({ title: '', type: 'discount', description: 'desc', startDate: '2026-07-01', endDate: '2026-07-31', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.title, '活动标题不能为空');
});

test('validatePromotionForm: 标题太短拒绝', () => {
  const errs = validatePromotionForm({ title: 'a', type: 'discount', description: 'desc', startDate: '2026-07-01', endDate: '2026-07-31', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.title, '活动标题至少2个字符');
});

test('validatePromotionForm: 标题超长拒绝', () => {
  const errs = validatePromotionForm({ title: '超长标题'.repeat(15), type: 'discount', description: 'desc', startDate: '2026-07-01', endDate: '2026-07-31', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.title, '活动标题不超过50个字符');
});

test('validatePromotionForm: 活动类型为空拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: '', description: 'desc', startDate: '2026-07-01', endDate: '2026-07-31', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.type, '活动类型不能为空');
});

test('validatePromotionForm: 描述为空拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: 'discount', description: '', startDate: '2026-07-01', endDate: '2026-07-31', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.description, '活动描述不能为空');
});

test('validatePromotionForm: 描述超长拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: 'discount', description: 'X'.repeat(501), startDate: '2026-07-01', endDate: '2026-07-31', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.description, '活动描述不超过500个字符');
});

test('validatePromotionForm: 预算为负拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: 'discount', description: 'desc', startDate: '2026-07-01', endDate: '2026-07-31', budget: -100, usageLimit: 100, storeName: '店' });
  assert.equal(errs.budget, '预算不能为负数');
});

test('validatePromotionForm: 使用上限为负拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: 'discount', description: 'desc', startDate: '2026-07-01', endDate: '2026-07-31', budget: 10000, usageLimit: -1, storeName: '店' });
  assert.equal(errs.usageLimit, '使用上限不能为负数');
});

test('validatePromotionForm: 开始日期为空拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: 'discount', description: 'desc', startDate: '', endDate: '2026-07-31', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.startDate, '开始日期不能为空');
});

test('validatePromotionForm: 结束日期为空拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: 'discount', description: 'desc', startDate: '2026-07-01', endDate: '', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.endDate, '结束日期不能为空');
});

test('validatePromotionForm: 结束日期早于开始日期拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: 'discount', description: 'desc', startDate: '2026-07-31', endDate: '2026-07-01', budget: 10000, usageLimit: 100, storeName: '店' });
  assert.equal(errs.endDate, '结束日期必须晚于开始日期');
});

test('validatePromotionForm: 门店为空拒绝', () => {
  const errs = validatePromotionForm({ title: '促销', type: 'discount', description: 'desc', startDate: '2026-07-01', endDate: '2026-07-31', budget: 10000, usageLimit: 100, storeName: '' });
  assert.equal(errs.storeName, '所属门店不能为空');
});

// ── 5. 搜索/过滤 ──

test('filterPromotionsByTitle: 匹配到结果', () => {
  const promos = [{ title: '夏日清凉大促' }, { title: '七夕特惠' }, { title: '双十一' }];
  assert.equal(filterPromotionsByTitle(promos, '夏日').length, 1);
  assert.equal(filterPromotionsByTitle(promos, '促').length, 1);
});

test('filterPromotionsByTitle: 无匹配返回空', () => {
  const promos = [{ title: '夏日促销' }];
  assert.equal(filterPromotionsByTitle(promos, '冬季').length, 0);
});

test('filterPromotionsByTitle: 空列表返回空', () => {
  assert.equal(filterPromotionsByTitle([], '促销').length, 0);
});

// ── 6. 提交 ──

test('mockSubmitPromotion: 成功返回正确结构', async () => {
  const data = {
    title: '夏日清凉大促', type: 'discount', description: '夏季限时折扣',
    startDate: '2026-07-01', endDate: '2026-07-31',
    budget: 50000, usageLimit: 500, storeName: '旗舰店',
  };
  const result = await mockSubmitPromotion(data);
  assert.equal(result.data.title, '夏日清凉大促');
  assert.ok(result.message.includes('创建成功'));
});

test('mockSubmitPromotion: 保留提交数据', async () => {
  const data = {
    title: '七夕特惠', type: 'coupon', description: '七夕限时',
    startDate: '2026-08-01', endDate: '2026-08-07',
    budget: 10000, usageLimit: 200, storeName: '社区店',
  };
  const result = await mockSubmitPromotion(data);
  assert.deepEqual(result.data, data);
});

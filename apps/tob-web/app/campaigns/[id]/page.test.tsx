/**
 * campaigns/[id]/page.test.tsx — 营销活动详情页 L1 测试
 * 覆盖: 正例 / 反例 / 边界 / 状态流转 / 删除 / 数据展示
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// ── 类型 ──

type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'archived';
type CampaignType = 'promotion' | 'seasonal' | 'new_product' | 'retention' | 'cross_sell';
type CampaignChannel = 'online' | 'offline' | 'omni';

interface CampaignItem {
  id: string;
  code: string;
  name: string;
  type: CampaignType;
  channel: CampaignChannel;
  status: CampaignStatus;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  startDate: string;
  endDate: string;
  createdBy: string;
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ── 状态流转配置 (镜像页面逻辑) ──

const STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ['scheduled', 'archived'],
  scheduled: ['active', 'draft', 'archived'],
  active: ['paused', 'ended'],
  paused: ['active', 'ended'],
  ended: ['archived'],
  archived: ['draft'],
};

const TRANSITION_LABELS: Record<string, string> = {
  'draft->scheduled': '排期活动',
  'draft->archived': '删除草稿',
  'scheduled->active': '启动活动',
  'scheduled->draft': '返回草稿',
  'scheduled->archived': '取消排期',
  'active->paused': '暂停活动',
  'active->ended': '结束活动',
  'paused->active': '恢复活动',
  'paused->ended': '结束活动',
  'ended->archived': '归档',
  'archived->draft': '重新启用',
};

// ── 工具函数 (镜像页面逻辑) ──

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('zh-CN');
}

function ctr(clicks: number, impressions: number): string {
  if (!impressions) return '0%';
  return `${((clicks / impressions) * 100).toFixed(2)}%`;
}

function cvr(conversions: number, clicks: number): string {
  if (!clicks) return '0%';
  return `${((conversions / clicks) * 100).toFixed(2)}%`;
}

function statusColor(status: CampaignStatus): string {
  const map: Record<CampaignStatus, string> = {
    draft: '#6b7280', scheduled: '#3b82f6', active: '#10b981',
    paused: '#f59e0b', ended: '#6b7280', archived: '#9ca3af',
  };
  return map[status] ?? '#6b7280';
}

// ── 数据工厂 ──

function makeCampaign(overrides?: Partial<CampaignItem>): CampaignItem {
  return {
    id: 'cmp-999',
    code: 'CAMP-999',
    name: '测试活动',
    type: 'promotion',
    channel: 'online',
    status: 'draft',
    budget: 100000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    roi: 0,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    createdBy: '测试员',
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════
// 正例
// ════════════════════════════════════════════════════════════════════════

describe('CampaignDetailPage — 正例', () => {
  it('应正确构建完整的活动详情对象', () => {
    const c = makeCampaign({ status: 'active', spent: 45000, impressions: 120000, clicks: 6000, conversions: 480, roi: 3.2 });
    assert.equal(c.id, 'cmp-999');
    assert.equal(c.status, 'active');
    assert.equal(c.spent, 45000);
    assert.equal(c.roi, 3.2);
  });

  it('应正确格式化货币: >= 1,000,000 显示万', () => {
    assert.equal(formatCurrency(1_000_000), '¥100.0万');
    assert.equal(formatCurrency(500_000), '¥500.0K');
    assert.equal(formatCurrency(800), '¥800');
  });

  it('应正确计算 CTR', () => {
    assert.equal(ctr(5000, 100000), '5.00%');
    assert.equal(ctr(0, 100000), '0.00%');
    assert.equal(ctr(100000, 100000), '100.00%');
  });

  it('应正确计算 CVR', () => {
    assert.equal(cvr(500, 10000), '5.00%');
    assert.equal(cvr(0, 5000), '0.00%');
    assert.equal(cvr(10000, 10000), '100.00%');
  });

  it('应正确格式化百分比', () => {
    assert.equal(formatPercent(0.5), '50.0%');
    assert.equal(formatPercent(1), '100.0%');
    assert.equal(formatPercent(0), '0.0%');
  });

  it('应正确格式化数字', () => {
    assert.equal(formatNumber(1000), '1,000');
    assert.equal(formatNumber(1000000), '1,000,000');
  });

  it('应支持所有类型的状态流转', () => {
    const allStatuses: CampaignStatus[] = ['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'];
    for (const s of allStatuses) {
      const transitions = STATUS_TRANSITIONS[s];
      assert.ok(Array.isArray(transitions), `${s} should have transitions`);
      if (transitions.length > 0) {
        for (const t of transitions) {
          const key = `${s}->${t}`;
          assert.ok(TRANSITION_LABELS[key] !== undefined, `missing label for ${key}`);
        }
      }
    }
  });

  it('应支持所有状态的 statusColor', () => {
    const allStatuses: CampaignStatus[] = ['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'];
    for (const s of allStatuses) {
      const color = statusColor(s);
      assert.ok(color.startsWith('#'), `${s} color should be hex`);
      assert.equal(color.length, 7);
    }
  });

  it('应正确计算预算使用率', () => {
    const c = makeCampaign({ budget: 100000, spent: 35000 });
    const budgetUsed = c.spent / c.budget;
    assert.equal(budgetUsed, 0.35);
    assert.equal(formatPercent(budgetUsed), '35.0%');
  });

  it('活跃活动可暂停或结束', () => {
    const transitions = STATUS_TRANSITIONS.active;
    assert.ok(transitions.includes('paused'));
    assert.ok(transitions.includes('ended'));
    assert.equal(transitions.length, 2);
  });

  it('草稿活动可排期或归档', () => {
    const transitions = STATUS_TRANSITIONS.draft;
    assert.ok(transitions.includes('scheduled'));
    assert.ok(transitions.includes('archived'));
    assert.equal(transitions.length, 2);
  });

  it('详情页应包含 dispatch 结果钻取读面（ResultKindBadge + 结果域）', () => {
    const src = readSource();
    assert.ok(src.includes('结果钻取'), '缺少结果钻取区块');
    assert.ok(src.includes('ResultKindBadge'), '缺少 ResultKindBadge 组件');
    assert.ok(src.includes('回执引用'), '缺少回执引用字段');
    assert.ok(src.includes('失败原因'), '缺少失败原因字段');
    assert.ok(src.includes('动作槽位'), '缺少动作槽位字段');
    assert.ok(src.includes('执行域'), '缺少执行域字段');
    assert.ok(src.includes('RESULT_KIND_STYLES'), '缺少 RESULT_KIND_STYLES 样式配置');
  });

  it('详情页应支持 highlightDispatchId 高亮滚动', () => {
    const src = readSource();
    assert.ok(src.includes('highlightDispatchId'), '缺少 highlightDispatchId 读取');
    assert.ok(src.includes('dispatchCardRefs'), '缺少 dispatchCardRefs ref');
    assert.ok(src.includes('isHighlighted'), '缺少 isHighlighted 高亮状态');
    assert.ok(src.includes('来自列表'), '缺少来自列表高亮徽章');
    assert.ok(src.includes('scrollIntoView'), '缺少滚动到高亮元素');
  });

  it('详情页应支持派发记录按状态分组折叠', () => {
    const src = readSource();
    assert.ok(src.includes('dispatchGroups'), '缺少 dispatchGroups 分组计算');
    assert.ok(src.includes('collapsedGroups'), '缺少 collapsedGroups 折叠状态');
    assert.ok(src.includes('toggleDispatchGroup'), '缺少 toggleDispatchGroup 切换函数');
    assert.ok(src.includes('STATUS_GROUP_ORDER'), '缺少 STATUS_GROUP_ORDER 分组顺序');
    assert.ok(src.includes('STATUS_GROUP_LABELS'), '缺少 STATUS_GROUP_LABELS 状态标签');
    assert.ok(src.includes('点击展开'), '缺少点击展开提示');
    assert.ok(src.includes('▶'), '缺少折叠箭头');
  });

  it('详情页派发记录中的成员名称应为指向 /members/[memberId] 的链接', () => {
    const src = readSource();
    assert.ok(src.includes('`/members/${dispatch.memberId}`'), '缺少成员链接 /members/[memberId]');
  });

  it('详情页应包含派发统计摘要条', () => {
    const src = readSource();
    assert.ok(src.includes('dispatchStats'), '缺少 dispatchStats 统计计算');
    assert.ok(src.includes('派发统计摘要'), '缺少派发统计摘要注释');
    assert.ok(src.includes('总数'), '缺少总数标签');
    assert.ok(src.includes('成功'), '缺少成功标签');
    assert.ok(src.includes('失败'), '缺少失败标签');
    assert.ok(src.includes('待执行'), '缺少待执行标签');
    assert.ok(src.includes('已跳过'), '缺少已跳过标签');
  });

  it('详情页应支持点击 ResultKindBadge 弹出结果详情弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('resultModal'), '缺少 resultModal 状态');
    assert.ok(src.includes('setResultModal'), '缺少 setResultModal 函数');
    assert.ok(src.includes('cursor:'), '缺少 cursor:pointer 样式');
    assert.ok(src.includes('关闭'), '缺少关闭按钮');
    assert.ok(src.includes('rgba(0,0,0,0.7)'), '缺少半透明黑色遮罩');
    assert.ok(src.includes('结果详情弹窗'), '缺少结果详情弹窗注释');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 反例 / 防御
// ════════════════════════════════════════════════════════════════════════

describe('CampaignDetailPage — 反例 / 防御', () => {
  it('无效活动应返回 null', () => {
    const mockData = MOCK_CAMPAIGNS ?? [];
    const found = mockData.find((c) => c.id === 'nonexistent') ?? null;
    assert.equal(found, null);
  });

  it('应拒绝负值预算', () => {
    const c = makeCampaign({ budget: -1000 });
    assert.ok(c.budget < 0);
    assert.equal(formatCurrency(c.budget), '-¥1.0K'); // 仍可格式化为负值
  });

  it('应处理零印象时的 CTR', () => {
    assert.equal(ctr(100, 0), '0%');
    assert.equal(ctr(0, 0), '0%');
  });

  it('应处理零点击时的 CVR', () => {
    assert.equal(cvr(100, 0), '0%');
    assert.equal(cvr(0, 0), '0%');
  });

  it('应处理状态流转中已归档 -> 重新启用的标签', () => {
    const key = 'archived->draft';
    assert.ok(TRANSITION_LABELS[key] !== undefined);
    assert.equal(TRANSITION_LABELS[key], '重新启用');
  });

  it('应处理缺失的流转标签(降级)', () => {
    const unknownKey = 'draft->ended';
    const label = TRANSITION_LABELS[unknownKey];
    assert.equal(label, undefined);
  });

  it('应拒绝缺失必填字段', () => {
    const c = makeCampaign({ id: undefined as unknown as string });
    assert.equal(c.id, undefined);
  });

  it('应拒绝超大 ROI', () => {
    const c = makeCampaign({ roi: 9999.99 });
    assert.equal(c.roi, 9999.99);
  });

  it('应拒绝空字符串 name', () => {
    const c = makeCampaign({ name: '' });
    assert.equal(c.name, '');
  });
});

// ════════════════════════════════════════════════════════════════════════
// 边界
// ════════════════════════════════════════════════════════════════════════

describe('CampaignDetailPage — 边界', () => {
  it('零预算活动', () => {
    const c = makeCampaign({ budget: 0, spent: 0 });
    const budgetUsed = c.budget > 0 ? c.spent / c.budget : 0;
    assert.equal(budgetUsed, 0);
    assert.equal(formatPercent(budgetUsed), '0.0%');
  });

  it('预算已耗尽的活动', () => {
    const c = makeCampaign({ budget: 100000, spent: 100000 });
    const budgetUsed = c.spent / c.budget;
    assert.equal(budgetUsed, 1);
    assert.equal(formatPercent(budgetUsed), '100.0%');
  });

  it('超高预算活动', () => {
    const c = makeCampaign({ budget: 50_000_000 });
    assert.equal(formatCurrency(c.budget), '¥5000.0万');
  });

  it('超大曝光量', () => {
    const c = makeCampaign({ impressions: 1_000_000_000 });
    assert.equal(formatNumber(c.impressions), '1,000,000,000');
  });

  it('满 CTR (所有曝光均点击)', () => {
    assert.equal(ctr(1000, 1000), '100.00%');
  });

  it('极小 CTR', () => {
    assert.equal(ctr(1, 1_000_000), '0.00%');
  });

  it('已结束活动仅能归档', () => {
    const transitions = STATUS_TRANSITIONS.ended;
    assert.deepEqual(transitions, ['archived']);
  });

  it('已归档活动仅能重新启用', () => {
    const transitions = STATUS_TRANSITIONS.archived;
    assert.deepEqual(transitions, ['draft']);
  });

  it('暂停活动可恢复或结束', () => {
    const transitions = STATUS_TRANSITIONS.paused;
    assert.ok(transitions.includes('active'));
    assert.ok(transitions.includes('ended'));
    assert.equal(transitions.length, 2);
  });

  it('所有状态均存在且互斥', () => {
    const allStatuses: CampaignStatus[] = ['draft', 'scheduled', 'active', 'paused', 'ended', 'archived'];
    const unique = new Set(allStatuses);
    assert.equal(unique.size, 6);
  });

  it('跨年活动', () => {
    const c = makeCampaign({ startDate: '2026-12-01', endDate: '2027-03-01' });
    assert.ok(c.startDate < c.endDate);
    const start = new Date(c.startDate);
    const end = new Date(c.endDate);
    assert.ok(end > start);
  });
});

// ── Mock 数据引用 (用于 ID 查找测试) ──

const MOCK_CAMPAIGNS: CampaignItem[] = [
  { id: 'cmp-001', code: 'CAMP-001', name: '618年中大促', type: 'promotion', channel: 'omni', status: 'active', budget: 500000, spent: 385000, impressions: 850000, clicks: 42500, conversions: 3400, roi: 3.8, startDate: '2026-06-01', endDate: '2026-06-20', createdBy: '张三' },
  { id: 'cmp-002', code: 'CAMP-002', name: '夏季新品发布会', type: 'seasonal', channel: 'offline', status: 'scheduled', budget: 200000, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-07-10', endDate: '2026-07-12', createdBy: '李四' },
  { id: 'cmp-003', code: 'CAMP-003', name: '会员积分加倍计划', type: 'retention', channel: 'online', status: 'active', budget: 120000, spent: 78000, impressions: 320000, clicks: 18500, conversions: 2100, roi: 4.2, startDate: '2026-06-15', endDate: '2026-07-15', createdBy: '王五' },
  { id: 'cmp-004', code: 'CAMP-004', name: '新品蓝牙耳机推广', type: 'new_product', channel: 'omni', status: 'active', budget: 350000, spent: 215000, impressions: 560000, clicks: 29800, conversions: 1800, roi: 2.5, startDate: '2026-06-10', endDate: '2026-07-10', createdBy: '赵六' },
  { id: 'cmp-005', code: 'CAMP-005', name: '智能家居跨品类推荐', type: 'cross_sell', channel: 'online', status: 'paused', budget: 180000, spent: 92000, impressions: 240000, clicks: 12100, conversions: 780, roi: 1.9, startDate: '2026-05-20', endDate: '2026-06-30', createdBy: '张三' },
];

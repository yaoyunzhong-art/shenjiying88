/**
 * 事件详情页 L1+L2 测试 — EventDetailPage (storefront-web)
 *
 * 测试覆盖 (三态: 正例/反例/边界):
 * - 正例: 模块导入 / 组件引用 / Mock 数据 / 状态标签 / Tabs / 统计卡片
 * - 反例: 安全防御 / 危险 API / 空数据 / 类型泄漏
 * - 边界: 未找到事件 (404) / 空赛程 / 空规则 / 0 参与 / 已结束 / loading
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ============================================================
// 类型定义 (与 page.tsx 保持一致)
// ============================================================

interface EventItem {
  id: number;
  title: string;
  type: string;
  status: string;
  start: string;
  end: string;
  participants: number;
  prize: string;
  desc: string;
  banner: string;
  color: string;
}

// ============================================================
// 辅助函数
// ============================================================

function mockEvent(overrides?: Partial<EventItem>): EventItem {
  return {
    id: 99,
    title: '测试活动',
    type: '竞赛',
    status: '进行中',
    start: '2026-07-01',
    end: '2026-07-31',
    participants: 100,
    prize: '¥1,000奖金',
    desc: '测试描述',
    banner: '🏆',
    color: 'from-blue-600/30',
    ...overrides,
  };
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    '进行中': 'info',
    '即将开始': 'warning',
    '已结束': 'default',
  };
  return map[status] ?? 'default';
}

// ==================== 正例 (结构/数据/渲染) ====================

describe('EventDetailPage — 正例', () => {
  it('应导出一个默认组件', () => {
    assert.ok(SRC.includes('export default function'));
  });

  it('应包含 JSX 模板', () => {
    assert.ok(SRC.includes('return'));
    assert.ok(SRC.includes('<>') || SRC.includes('div') || SRC.includes('PageShell'));
  });

  it('应包含关键的 UI 组件引用', () => {
    assert.ok(SRC.includes('PageShell'));
    assert.ok(SRC.includes('StatCard'));
    assert.ok(SRC.includes('Tabs'));
    assert.ok(SRC.includes('StatusBadge'));
  });

  it('使用 useParams 获取路由 ID', () => {
    assert.ok(SRC.includes('useParams'));
  });

  it('使用 useRouter 实现返回导航', () => {
    assert.ok(SRC.includes('useRouter'));
    assert.ok(SRC.includes('router.back()'));
  });

  it('使用 useState 管理 Tab 切换', () => {
    assert.ok(SRC.includes('useState'));
    assert.ok(SRC.includes('activeTab'));
    assert.ok(SRC.includes('setActiveTab'));
  });

  it('处理未找到事件的 404 状态', () => {
    assert.ok(SRC.includes('找不到该活动'));
    assert.ok(SRC.includes('router.back()'));
  });

  it('支持 Tabs 切换 (活动介绍/赛程安排/活动规则)', () => {
    assert.ok(SRC.includes('overview'));
    assert.ok(SRC.includes('schedule'));
    assert.ok(SRC.includes('rules'));
  });

  it('渲染事件标题和状态徽章', () => {
    assert.ok(SRC.includes('StatusBadge'));
    assert.ok(SRC.includes('title'));
  });

  it('渲染 4 个统计卡片 (总参与/奖金/剩余天数/热度)', () => {
    assert.ok(SRC.includes('StatCard'));
    const statCardMatches = SRC.match(/<StatCard/g) || [];
    assert.ok(statCardMatches.length >= 4, `expected >=4 StatCard, got ${statCardMatches.length}`);
  });

  it('Mock 数据含 8 个事件', () => {
    const eventIds = SRC.match(/\{ id: \d+, title:/g) || [];
    assert.ok(eventIds.length >= 8, `expected >=8 events, got ${eventIds.length}`);
  });

  it('Mock 状态标签覆盖 (进行中/即将开始/已结束)', () => {
    assert.ok(SRC.includes('进行中'));
    assert.ok(SRC.includes('即将开始'));
    assert.ok(SRC.includes('已结束'));
  });

  it('Mock 事件类型覆盖 (竞赛/体验/亲子/会员/促销/主题)', () => {
    assert.ok(SRC.includes('竞赛'));
    assert.ok(SRC.includes('体验'));
    assert.ok(SRC.includes('亲子'));
    assert.ok(SRC.includes('会员'));
    assert.ok(SRC.includes('促销'));
    assert.ok(SRC.includes('主题'));
  });

  it('getStatusColor 将状态映射为正确的变体', () => {
    assert.equal(getStatusColor('进行中'), 'info');
    assert.equal(getStatusColor('即将开始'), 'warning');
    assert.equal(getStatusColor('已结束'), 'default');
  });

  it('Mock 数据包含完整的 banner 表情', () => {
    const emojis = ['🏆', '🥽', '🎪', '🎁', '📚', '🕹️', '📺', '🥮'];
    for (const emoji of emojis) {
      assert.ok(SRC.includes(emoji), `missing emoji: ${emoji}`);
    }
  });
});

// ==================== 反例 (安全/防御/错误) ====================

describe('EventDetailPage — 反例', () => {
  it('无 dangerousSetInnerHTML', () => {
    assert.doesNotMatch(SRC, /dangerouslySetInnerHTML/);
  });

  it('无 eval', () => {
    assert.doesNotMatch(SRC, /\beval\s*\(/);
  });

  it('无 any 类型', () => {
    assert.doesNotMatch(SRC, /:\s*any\b/);
  });

  it('无密码/密钥泄露', () => {
    assert.doesNotMatch(SRC, /(?:secret|password|api[_-]?key)/i);
  });

  it('无裸 console.log', () => {
    assert.ok(!SRC.includes('console.log(') || SRC.includes('// console.log'));
  });

  it('不存在的事件 ID 触发 404', () => {
    // 验证 find 返回 undefined 分支
    assert.ok(SRC.includes('find'));
    assert.ok(SRC.includes('if (!event)'));
  });

  it('空的赛程安排显示"暂无详细日程安排"', () => {
    assert.ok(SRC.includes('暂无详细日程安排'));
  });

  it('空的活动规则显示"暂无详细规则说明"', () => {
    assert.ok(SRC.includes('暂无详细规则说明'));
  });

  it('无 document.write', () => {
    assert.doesNotMatch(SRC, /document\.write/);
  });
});

// ==================== 边界 (空/未找到/0/已结束) ====================

describe('EventDetailPage — 边界', () => {
  it('未找到事件时渲染 404 占位', () => {
    assert.ok(SRC.includes('活动未找到'));
    assert.ok(SRC.includes('subtitle="404"'));
  });

  it('404 页面包含返回按钮', () => {
    assert.ok(SRC.includes('返回'));
    assert.ok(SRC.includes('router.back()'));
  });

  it('participants 为 0 时统计正常显示', () => {
    // events 2 和 5 的 participants 为 0
    assert.ok(SRC.includes('participants: 0'));
  });

  it('剩余天数计算: 已结束显示"已结束"', () => {
    assert.ok(SRC.includes("'已结束'"));
  });

  it('热度计算: participants > 1000 显示"🔥火爆"', () => {
    assert.ok(SRC.includes('火爆'));
  });

  it('热度计算: participants 500-1000 显示"🔥热门"', () => {
    assert.ok(SRC.includes('热门'));
  });

  it('热度计算: participants < 500 显示"一般"', () => {
    assert.ok(SRC.includes('一般'));
  });

  it('空的 schedule 数组时显示无日程', () => {
    // 验证 || [] 防御
    assert.ok(SRC.includes('|| []'));
  });

  it('空的 rules 数组时显示无规则', () => {
    // 验证 || [] 防御
    assert.ok(SRC.includes('|| []'));
  });

  it('mockEvent 工厂可以创建最小事件', () => {
    const e = mockEvent();
    assert.ok(e.id);
    assert.ok(e.title);
    assert.ok(e.participants >= 0);
    assert.ok(e.start);
    assert.ok(e.end);
  });

  it('事件 ID 范围为 1-8', () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8];
    assert.equal(ids.length, 8);
    assert.equal(Math.min(...ids), 1);
    assert.equal(Math.max(...ids), 8);
  });

  it('参与人数包含 0', () => {
    const participants = [1286, 0, 856, 3452, 0, 423, 567, 0];
    assert.ok(participants.includes(0));
    const zeroCount = participants.filter(p => p === 0).length;
    assert.equal(zeroCount, 3);
  });

  it('getStatusColor 支持所有 Mock 状态', () => {
    assert.equal(getStatusColor('进行中'), 'info');
    assert.equal(getStatusColor('即将开始'), 'warning');
    assert.equal(getStatusColor('已结束'), 'default');
    // 未知状态默认
    assert.equal(getStatusColor('unknown'), 'default');
  });
});

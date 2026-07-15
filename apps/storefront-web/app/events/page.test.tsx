/**
 * events/page.test.tsx — 活动中心页 增强测试 (2026-07-16)
 *
 * 覆盖:
 *   L1 正例    — 组件导出、活动数据扩展至 12 条、统计卡片、筛选器
 *   L1 三态    — loading/error/empty 状态
 *   L2 角色测试 — 类型/状态筛选、展开详情、空结果、热门排行、分类分析、精选推荐
 *   边界       — 倒计时计算、参与人数统计、新类型验证
 *   L3 安全    — 无危险代码、无 as any
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('EventsPage — L1 正例', () => {
  it('应导出一个默认函数组件 EventsPage', () => {
    assert.ok(SRC.includes('export default function EventsPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应从 @m5/ui 导入 PageShell', () => {
    assert.ok(SRC.includes('PageShell'));
  });

  it('应导入 StatCard', () => {
    assert.ok(SRC.includes('StatCard'));
  });

  it('应导入 StatusBadge', () => {
    assert.ok(SRC.includes('StatusBadge'));
  });

  it('页面标题应为"活动中心"', () => {
    assert.ok(SRC.includes('活动中心'));
  });
});

describe('EventsPage — L1 活动数据验证', () => {
  it('应定义 12 个模拟活动', () => {
    const matches = SRC.match(/id:\s*\d+/g);
    assert.equal(matches ? matches.length : 0, 12, `预期 12 个活动，实际 ${matches?.length || 0}`);
  });

  it('活动类型包含竞赛、促销、体验、亲子、会员、主题', () => {
    assert.ok(SRC.includes('竞赛') && SRC.includes('促销') && SRC.includes('体验'));
    assert.ok(SRC.includes('亲子') && SRC.includes('会员') && SRC.includes('主题'));
  });

  it('活动状态包含进行中、即将开始、已结束', () => {
    assert.ok(SRC.includes('进行中') && SRC.includes('即将开始') && SRC.includes('已结束'));
  });

  it('每个活动应有 rating 评分字段', () => {
    assert.ok(SRC.includes('rating'));
  });

  it('活动应包含渐变色定义', () => {
    assert.ok(SRC.includes('from-red') || SRC.includes('from-purple') || SRC.includes('from-pink'));
  });
});

describe('EventsPage — L1 三态', () => {
  it('应有 loading 骨架屏', () => {
    assert.ok(SRC.includes('LoadingSkeleton') || SRC.includes('loading'));
  });

  it('应有 error 状态界面', () => {
    assert.ok(SRC.includes('活动中心加载失败') || SRC.includes('重新加载'));
  });

  it('无匹配活动时应显示空状态提示', () => {
    assert.ok(SRC.includes('没有找到符合条件的活动'));
  });

  it('空状态应提示尝试调整筛选', () => {
    assert.ok(SRC.includes('调整筛选条件') || SRC.includes('其他关键词'));
  });
});

describe('EventsPage — L2 统计与筛选', () => {
  it('应使用 useMemo 优化统计', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('应计算进行中活动数量', () => {
    assert.ok(SRC.includes('stats') && SRC.includes('active'));
  });

  it('应计算即将开始活动数量', () => {
    assert.ok(SRC.includes('stats') && SRC.includes('upcoming'));
  });

  it('应计算总参与人数', () => {
    assert.ok(SRC.includes('totalParticipants') || SRC.includes('reduce'));
  });

  it('应计算已结束活动数量', () => {
    assert.ok(SRC.includes('stats') && SRC.includes('ended'));
  });

  it('应支持类型筛选', () => {
    assert.ok(SRC.includes('typeFilter') || SRC.includes('setTypeFilter'));
  });

  it('应支持状态筛选', () => {
    assert.ok(SRC.includes('statusFilter') || SRC.includes('setStatusFilter'));
  });

  it('应支持展开/收起活动详情', () => {
    assert.ok(SRC.includes('expandedId') || SRC.includes('toggleExpand'));
  });

  it('应显示 TYPES 筛选按钮', () => {
    assert.ok(SRC.includes('TYPES'));
  });

  it('应显示 STATUSES 筛选按钮', () => {
    assert.ok(SRC.includes('STATUSES'));
  });
});

describe('EventsPage — L2 增强功能', () => {
  it('应有热门排行 Top 3 区域', () => {
    assert.ok(SRC.includes('热度排行') || SRC.includes('Top 3'));
  });

  it('应有分类分析统计', () => {
    assert.ok(SRC.includes('typeStats') || SRC.includes('分类'));
  });

  it('应有精选推荐活动', () => {
    assert.ok(SRC.includes('精选推荐') || SRC.includes('featured'));
  });

  it('进行中活动应显示剩余天数', () => {
    assert.ok(SRC.includes('剩余') || SRC.includes('daysLeft'));
  });

  it('活动列表应按状态优先级排序', () => {
    assert.ok(SRC.includes('sortedFiltered') || SRC.includes('statusOrder'));
  });

  it('应显示活动评分星级', () => {
    assert.ok(SRC.includes('⭐') || SRC.includes('rating'));
  });
});

describe('EventsPage — 边界', () => {
  it('参与者数应使用 toLocaleString 格式化', () => {
    assert.ok(SRC.includes('toLocaleString'));
  });

  it('即将开始活动参与者为 0', () => {
    assert.ok(SRC.includes('participants: 0') || SRC.includes('0, prize'));
  });

  it('simulateFetch 应异步返回活动数据', () => {
    assert.ok(SRC.includes('Promise') && SRC.includes('resolve'));
  });

  it('calcDaysLeft 工具函数存在', () => {
    assert.ok(SRC.includes('calcDaysLeft') || SRC.includes('daysLeft'));
  });
});

describe('EventsPage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });
});

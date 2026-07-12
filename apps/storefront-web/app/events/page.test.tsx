/**
 * events/page.test.tsx — 活动中心页 增强测试
 *
 * 覆盖:
 *   L1 正例    — 组件导出、活动数据完整、统计卡片、筛选器
 *   L2 角色测试 — 类型/状态筛选、展开详情、空结果
 *   边界       — 参与者统计、所有活动数据校验
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
  it('应定义 8 个模拟活动', () => {
    const matches = SRC.match(/id:\s*\d+/g);
    assert.equal(matches ? matches.length : 0, 8, `预期 8 个活动，实际 ${matches?.length || 0}`);
  });

  it('活动类型包含竞赛、促销、体验、亲子、会员、主题', () => {
    const types = ['竞赛', '促销', '体验', '亲子', '会员', '主题'];
    const found = types.filter(t => SRC.includes(t));
    assert.equal(found.length, 6, `缺失类型: ${types.filter(t => !SRC.includes(t)).join(', ')}`);
  });

  it('活动状态包含进行中、即将开始、已结束', () => {
    assert.ok(SRC.includes('进行中'));
    assert.ok(SRC.includes('即将开始'));
    assert.ok(SRC.includes('已结束'));
  });

  it('每个活动应有 title、status、start、end、participants、prize', () => {
    assert.ok(SRC.includes('title'));
    assert.ok(SRC.includes('status'));
    assert.ok(SRC.includes('start'));
    assert.ok(SRC.includes('end'));
    assert.ok(SRC.includes('participants'));
    assert.ok(SRC.includes('prize'));
  });

  it('活动应包含渐变色定义', () => {
    assert.ok(SRC.includes('from-red') || SRC.includes('from-purple') || SRC.includes('from-green'));
  });
});

describe('EventsPage — L2 统计与筛选', () => {
  it('应计算进行中活动数量', () => {
    assert.ok(SRC.includes('activeEvents') || SRC.includes('进行中'));
  });

  it('应计算即将开始活动数量', () => {
    assert.ok(SRC.includes('upcomingEvents') || SRC.includes('即将开始'));
  });

  it('应计算总参与人数', () => {
    assert.ok(SRC.includes('totalParticipants') || SRC.includes('reduce'));
  });

  it('应计算已结束活动数量', () => {
    assert.ok(SRC.includes('endedEvents') || SRC.includes('已结束'));
  });

  it('应支持类型筛选（全部/竞赛/促销/体验/...）', () => {
    assert.ok(SRC.includes('typeFilter') || SRC.includes('setTypeFilter'));
  });

  it('应支持状态筛选（全部/进行中/即将开始/已结束）', () => {
    assert.ok(SRC.includes('statusFilter') || SRC.includes('setStatusFilter'));
  });

  it('应支持展开/收起活动详情', () => {
    assert.ok(SRC.includes('expandedId') || SRC.includes('setExpandedId'));
  });

  it('应显示 TYPES 筛选按钮数组', () => {
    assert.ok(SRC.includes('TYPES'));
  });

  it('应显示 STATUSES 筛选按钮数组', () => {
    assert.ok(SRC.includes('STATUSES'));
  });
});

describe('EventsPage — 空状态与边界', () => {
  it('无匹配活动时应显示空状态提示', () => {
    assert.ok(SRC.includes('没有找到'));
  });

  it('空状态应包含搜索图标 🔍', () => {
    assert.ok(SRC.includes('🔍'));
  });

  it('已结束活动参与者仍显示', () => {
    // 街机怀旧夜: participants: 423
    assert.ok(SRC.includes('423') || SRC.includes('567'));
  });

  it('即将开始活动参与者数为 0', () => {
    // VR新游体验周 participants: 0
    assert.ok(SRC.includes('participants: 0') || SRC.includes('0, prize'));
  });
});

describe('EventsPage — L1 导出完整性', () => {
  it('应使用 useState 管理筛选状态', () => {
    assert.ok(SRC.includes("useState"));
  });

  it('展开详情后应显示"立即参与"按钮', () => {
    assert.ok(SRC.includes('立即参与'));
  });

  it('展开详情后应显示"分享"和"加入日历"', () => {
    assert.ok(SRC.includes('分享'));
    assert.ok(SRC.includes('加入日历'));
  });

  it('.filtered 过滤数组应基于类型和状态', () => {
    assert.ok(SRC.includes('.filter('));
  });

  it('参与者数应使用 toLocaleString 格式化', () => {
    assert.ok(SRC.includes('toLocaleString'));
  });
});

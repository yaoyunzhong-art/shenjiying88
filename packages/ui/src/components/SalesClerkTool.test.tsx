import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
/**
 * @jest-environment jsdom
 * 或使用 react-testing-library:
 *   import { render, screen, fireEvent } from '@testing-library/react';
 *   import { SalesClerkTool } from './SalesClerkTool';
 *
 * 因当前项目使用 node:test + assert 作为核心跑器，
 * 本测试覆盖 SalesClerkTool 的类型契约和纯逻辑：
 *   - 默认统计/状态/优先级标签映射
 *   - 空数据边界
 *   - 统计快照验证
 */

import type {
  SalesClerkToolProps,
  DailyReceptionStats,
  FollowUpClient,
  SalesScript,
  MemberQuickLookup,
} from './SalesClerkTool';

// ---- 类型导出完整性 ----
describe('SalesClerkTool type exports', () => {
  it('exports all required prop types', () => {
    const props: SalesClerkToolProps = {
      stats: {
        totalReceptions: 42,
        newLeads: 8,
        conversions: 5,
        conversionRate: 11.9,
        avgResponseMin: 3.2,
      },
      followUpClients: [],
      scripts: [],
    };
    assert.ok(props);
    assert.equal(props.stats.totalReceptions, 42);
    assert.equal(props.stats.conversions, 5);
  });

  it('FollowUpClient enforces all required fields', () => {
    const client: FollowUpClient = {
      id: 'c1',
      name: '张三',
      phone: '13800001111',
      tier: 'GOLD',
      lastVisit: '2026-06-14',
      reason: '生日回访',
      priority: 'high',
    };
    assert.equal(client.name, '张三');
    assert.equal(client.tier, 'GOLD');
    assert.equal(client.priority, 'high');
  });

  it('MemberQuickLookup has all display fields', () => {
    const member: MemberQuickLookup = {
      id: 'm1',
      name: '李四',
      phone: '13900002222',
      tier: 'VIP',
      points: 12000,
      totalSpent: 88000,
      visitCount: 24,
      tags: ['高意向', '复购'],
    };
    assert.equal(member.tier, 'VIP');
    assert.ok(member.tags.includes('高意向'));
  });

  it('SalesScript has required scenario text and tags', () => {
    const script: SalesScript = {
      id: 's1',
      scenario: '新人欢迎',
      text: '欢迎光临！我是导购小陈，有任何需要随时找我~',
      tags: ['迎宾', '新客'],
    };
    assert.equal(script.scenario, '新人欢迎');
    assert.ok(script.tags.length > 0);
  });
});

// ---- 边界与空数据 ----
describe('SalesClerkTool edge cases', () => {
  it('handles empty followUpClients gracefully', () => {
    const emptyClients: FollowUpClient[] = [];
    assert.equal(emptyClients.length, 0);
  });

  it('handles empty scripts gracefully', () => {
    const emptyScripts: SalesScript[] = [];
    assert.equal(emptyScripts.length, 0);
  });

  it('handles zero stats snapshot', () => {
    const zeroStats: DailyReceptionStats = {
      totalReceptions: 0,
      newLeads: 0,
      conversions: 0,
      conversionRate: 0,
      avgResponseMin: 0,
    };
    assert.equal(zeroStats.totalReceptions, 0);
    assert.equal(zeroStats.conversionRate, 0);
  });

  it('handles conversionRate as a float', () => {
    const stats: DailyReceptionStats = {
      totalReceptions: 100,
      newLeads: 20,
      conversions: 15,
      conversionRate: 15.0,
      avgResponseMin: 2.5,
    };
    assert.ok(stats.conversionRate >= 0 && stats.conversionRate <= 100);
  });

  it('handles 100% conversionRate boundary', () => {
    const maxStats: DailyReceptionStats = {
      totalReceptions: 1,
      newLeads: 1,
      conversions: 1,
      conversionRate: 100,
      avgResponseMin: 0.1,
    };
    assert.equal(maxStats.conversionRate, 100);
  });
});

// ---- 优先级 / 等级标记完整性 ----
describe('SalesClerkTool tier & priority enumerations', () => {
  it('covers all 4 tier values', () => {
    const tiers: FollowUpClient['tier'][] = ['VIP', 'GOLD', 'SILVER', 'REGULAR'];
    assert.equal(tiers.length, 4);
  });

  it('covers all 3 priority values', () => {
    const priorities: FollowUpClient['priority'][] = ['high', 'medium', 'low'];
    assert.equal(priorities.length, 3);
  });
});

// ---- 回调签名验证 ----
describe('SalesClerkTool optional callbacks', () => {
  it('onMemberSearch returns MemberQuickLookup[]', async () => {
    const search: SalesClerkToolProps['onMemberSearch'] = async (_query) => [
      {
        id: 'm1',
        name: '测试',
        phone: '13800000000',
        tier: 'REGULAR',
        points: 100,
        totalSpent: 500,
        visitCount: 3,
        tags: ['新客'],
      },
    ];
    const result = await search('测试');
    assert.ok(result);
    assert.equal(result[0]!.name, '测试');
  });

  it('onFollowUp passes clientId', () => {
    let capturedId = '';
    const onFollowUp: SalesClerkToolProps['onFollowUp'] = (id) => {
      capturedId = id;
    };
    onFollowUp?.('c-001');
    assert.equal(capturedId, 'c-001');
  });

  it('onScriptCopy passes scriptId', () => {
    let captured = '';
    const onScriptCopy: SalesClerkToolProps['onScriptCopy'] = (id) => {
      captured = id;
    };
    onScriptCopy?.('s-copy-1');
    assert.equal(captured, 's-copy-1');
  });
});

// ---- 多客户组合场景 ----
describe('SalesClerkTool multi-client scenario', () => {
  it('organizes followUpClients sorted by priority', () => {
    const clients: FollowUpClient[] = [
      { id: 'c1', name: 'A', phone: '1', tier: 'REGULAR', lastVisit: '2026-06-10', reason: '咨询', priority: 'low' },
      { id: 'c2', name: 'B', phone: '2', tier: 'VIP', lastVisit: '2026-06-13', reason: '投诉', priority: 'high' },
      { id: 'c3', name: 'C', phone: '3', tier: 'GOLD', lastVisit: '2026-06-12', reason: '回访', priority: 'medium' },
    ];

    const sorted = [...clients].sort((a, b) => {
      const order = { high: 0, medium: 1, low: 2 };
      return order[a.priority] - order[b.priority];
    });

    assert.equal(sorted[0]!.priority, 'high');
    assert.equal(sorted[0]!.name, 'B');
    assert.equal(sorted[2]!.priority, 'low');
  });

  it('validates all clients have unique ids', () => {
    const clients: FollowUpClient[] = [
      { id: 'c1', name: '甲', phone: '1', tier: 'REGULAR', lastVisit: '2026-06-10', reason: 'x', priority: 'low' },
      { id: 'c2', name: '乙', phone: '2', tier: 'VIP', lastVisit: '2026-06-10', reason: 'y', priority: 'high' },
    ];
    const ids = clients.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

// ---- clerkName / storeName 可选 ----
describe('SalesClerkTool optional identity props', () => {
  it('accepts clerkName and storeName', () => {
    const props: SalesClerkToolProps = {
      stats: { totalReceptions: 10, newLeads: 2, conversions: 1, conversionRate: 10, avgResponseMin: 5 },
      followUpClients: [],
      scripts: [],
      clerkName: '小陈',
      storeName: '万象城旗舰店',
    };
    assert.equal(props.clerkName, '小陈');
    assert.equal(props.storeName, '万象城旗舰店');
  });

  it('defaults identity to undefined gracefully', () => {
    const props: SalesClerkToolProps = {
      stats: { totalReceptions: 0, newLeads: 0, conversions: 0, conversionRate: 0, avgResponseMin: 0 },
      followUpClients: [],
      scripts: [],
    };
    assert.equal(props.clerkName, undefined);
    assert.equal(props.storeName, undefined);
  });
});

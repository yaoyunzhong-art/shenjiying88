/**
 * agents/sessions/page.test.tsx — Agent Sessions L1 测试
 *
 * 覆盖: 会话列表、状态分布、搜索筛选、数据完整性
 * 正例: 状态枚举、搜索过滤、统计数据
 * 反例: 空列表、无效状态、缺失字段
 * 边界: 全失败、全完成、超大名称
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// ── 类型 ──

interface SessionItem {
  id: string;
  agentName: string;
  status: string;
  userInput: string;
  currentStep: number;
  totalSteps: number;
  duration: string;
  createdAt: string;
}

// ── Mock 数据 ──

const SEED_SESSIONS: SessionItem[] = [
  { id: 'sess-001', agentName: '客服助手', status: 'completed', userInput: '查询订单状态', currentStep: 3, totalSteps: 3, duration: '4.2s', createdAt: '2026-07-19 14:30' },
  { id: 'sess-002', agentName: '订单处理 Agent', status: 'running', userInput: '执行退款', currentStep: 2, totalSteps: 5, duration: '12.5s', createdAt: '2026-07-19 14:29' },
  { id: 'sess-003', agentName: '库存同步 Agent', status: 'completed', userInput: '检查库存', currentStep: 2, totalSteps: 2, duration: '2.1s', createdAt: '2026-07-19 14:28' },
  { id: 'sess-004', agentName: '数据清洗 Agent', status: 'failed', userInput: '清洗重复数据', currentStep: 4, totalSteps: 6, duration: '45.0s', createdAt: '2026-07-19 14:25' },
  { id: 'sess-005', agentName: '内容审核 Agent', status: 'completed', userInput: '审核商品描述', currentStep: 2, totalSteps: 2, duration: '1.8s', createdAt: '2026-07-19 14:20' },
  { id: 'sess-006', agentName: '告警分类 Agent', status: 'running', userInput: '分析告警分类', currentStep: 1, totalSteps: 3, duration: '5.3s', createdAt: '2026-07-19 14:15' },
  { id: 'sess-007', agentName: '决策推演 Agent', status: 'pending', userInput: '模拟促销影响', currentStep: 0, totalSteps: 10, duration: '0.0s', createdAt: '2026-07-19 14:10' },
  { id: 'sess-008', agentName: '报表生成 Agent', status: 'completed', userInput: '生成销售报表', currentStep: 5, totalSteps: 5, duration: '18.3s', createdAt: '2026-07-19 13:50' },
];

// ── 可接受的状态集合 ──

const VALID_STATUSES = ['pending', 'running', 'completed', 'failed', 'cancelled'];
const SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf-8');

// ── 辅助函数 ──

function computeStatusStats(sessions: SessionItem[]): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const s of sessions) {
    stats[s.status] = (stats[s.status] ?? 0) + 1;
  }
  return stats;
}

function searchSessions(sessions: SessionItem[], query: string): SessionItem[] {
  if (!query.trim()) return sessions;
  const lower = query.toLowerCase();
  return sessions.filter(s =>
    s.agentName.toLowerCase().includes(lower) ||
    s.userInput.toLowerCase().includes(lower)
  );
}

function filterByStatus(sessions: SessionItem[], status: string): SessionItem[] {
  if (!status || status === 'all') return sessions;
  return sessions.filter(s => s.status === status);
}

// ===================================================================
describe('AgentSessions — 状态统计', () => {
  it('应正确计算各状态数量', () => {
    const stats = computeStatusStats(SEED_SESSIONS);
    assert.equal(stats['completed'], 4);
    assert.equal(stats['running'], 2);
    assert.equal(stats['failed'], 1);
    assert.equal(stats['pending'], 1);
  });

  it('总 session 数应等于各状态之和', () => {
    const stats = computeStatusStats(SEED_SESSIONS);
    const sum = Object.values(stats).reduce((a, b) => a + b, 0);
    assert.equal(sum, SEED_SESSIONS.length);
  });

  it('空列表统计返回空对象', () => {
    assert.deepEqual(computeStatusStats([]), {});
  });

  it('所有 session 状态都是合法值', () => {
    for (const s of SEED_SESSIONS) {
      assert.ok(VALID_STATUSES.includes(s.status), `Invalid status: ${s.status}`);
    }
  });
});

// ===================================================================
describe('AgentSessions — 搜索', () => {
  it('按 agentName 搜索', () => {
    const result = searchSessions(SEED_SESSIONS, '客服');
    assert.equal(result.length, 1);
  });

  it('按 userInput 搜索', () => {
    const result = searchSessions(SEED_SESSIONS, '库存');
    assert.equal(result.length, 1);
  });

  it('搜索不区分大小写', () => {
    const result = searchSessions(SEED_SESSIONS, 'agent');
    assert.equal(result.length, 7); // 7 agentNames contain "Agent" (客服助手 does not)
  });

  it('空查询返回全量', () => {
    assert.equal(searchSessions(SEED_SESSIONS, '').length, SEED_SESSIONS.length);
  });

  it('无匹配搜索返回空数组', () => {
    assert.equal(searchSessions(SEED_SESSIONS, 'zzz').length, 0);
  });
});

// ===================================================================
describe('AgentSessions — 状态筛选', () => {
  it('筛选 running 状态', () => {
    const result = filterByStatus(SEED_SESSIONS, 'running');
    assert.equal(result.length, 2);
    assert.ok(result.every(s => s.status === 'running'));
  });

  it('all 筛选返回全部', () => {
    assert.equal(filterByStatus(SEED_SESSIONS, 'all').length, SEED_SESSIONS.length);
  });

  it('空状态字符串返回全部', () => {
    assert.equal(filterByStatus(SEED_SESSIONS, '').length, SEED_SESSIONS.length);
  });

  it('不存在的状态返回空', () => {
    assert.equal(filterByStatus(SEED_SESSIONS, 'unknown').length, 0);
  });
});

// ===================================================================
describe('AgentSessions — 数据完整性', () => {
  it('id 必须唯一', () => {
    const ids = SEED_SESSIONS.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('currentStep 不能超过 totalSteps', () => {
    for (const s of SEED_SESSIONS) {
      assert.ok(s.currentStep <= s.totalSteps,
        `${s.id}: currentStep ${s.currentStep} <= totalSteps ${s.totalSteps}`);
    }
  });

  it('duration 应包含单位 (s)', () => {
    for (const s of SEED_SESSIONS) {
      assert.ok(s.duration.endsWith('s'), `${s.id}: duration should end with 's'`);
    }
  });

  it('createdAt 格式应为 YYYY-MM-DD HH:mm', () => {
    const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/;
    for (const s of SEED_SESSIONS) {
      assert.ok(regex.test(s.createdAt), `${s.id}: invalid createdAt format`);
    }
  });
});

// ===================================================================
describe('AgentSessions — 边界', () => {
  it('全 fail session 筛选', () => {
    const allFailed = SEED_SESSIONS.filter(s => s.status === 'failed');
    assert.equal(allFailed.length, 1);
    assert.equal(allFailed[0]!.status, 'failed');
  });

  it('超长 agentName 不影响搜索', () => {
    const longName = 'A'.repeat(200);
    const session = { ...SEED_SESSIONS[0], id: 's-100', agentName: longName };
    const result = searchSessions([session], 'A'.repeat(200));
    assert.equal(result.length, 1);
  });

  it('empty input 搜索不抛异常', () => {
    assert.doesNotThrow(() => searchSessions([], ''));
    assert.doesNotThrow(() => searchSessions(SEED_SESSIONS, '   '));
  });
});

describe('agents/sessions — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});

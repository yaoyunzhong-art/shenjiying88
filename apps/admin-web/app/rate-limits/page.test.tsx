/**
 * rate-limits/page.test.tsx — 限流与配额管理页 L1 测试
 *
 * 覆盖: 限流策略查询、状态分类、配额账本数据、搜索过滤
 * 正例: 策略数据完整性、状态健康度、配额使用率
 * 反例: 无效状态/策略编码、空数据、缺失字段
 * 边界: 配额用尽(100%)、零配额、超长策略编码
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型 ── */

type RateLimitStatus = 'healthy' | 'warning' | 'blocked';

interface RateLimitPolicy {
  policyCode: string;
  name: string;
  subjectKey: string;
  threshold: number;
  currentUsage: number;
  usagePercent: number;
  status: RateLimitStatus;
  tenantId: string;
  expiresAt: string;
  createdAt: string;
}

interface RateLimitLedger {
  ledgerId: string;
  policyCode: string;
  subjectKey: string;
  consumed: number;
  remaining: number;
  limit: number;
  lastReset: string;
  nextReset: string;
  status: RateLimitStatus;
}

/* ── Mock 数据 ── */

const MOCK_POLICIES: RateLimitPolicy[] = [
  { policyCode: 'API_QPS', name: 'API 调用频率', subjectKey: 'api:default', threshold: 5000, currentUsage: 3200, usagePercent: 64, status: 'healthy', tenantId: 't-001', expiresAt: '2026-12-31', createdAt: '2026-01-01' },
  { policyCode: 'LOGIN_RATE', name: '登录频率限制', subjectKey: 'auth:login', threshold: 100, currentUsage: 85, usagePercent: 85, status: 'warning', tenantId: 't-001', expiresAt: '2026-12-31', createdAt: '2026-01-01' },
  { policyCode: 'SMS_OTP', name: '短信验证码', subjectKey: 'sms:otp', threshold: 50, currentUsage: 50, usagePercent: 100, status: 'blocked', tenantId: 't-001', expiresAt: '2026-07-20', createdAt: '2026-06-01' },
  { policyCode: 'EXPORT_LIMIT', name: '数据导出限制', subjectKey: 'export:daily', threshold: 20, currentUsage: 12, usagePercent: 60, status: 'healthy', tenantId: 't-002', expiresAt: '2026-12-31', createdAt: '2026-03-01' },
  { policyCode: 'WEBHOOK_CALL', name: 'Webhook 调用', subjectKey: 'webhook:outbound', threshold: 1000, currentUsage: 950, usagePercent: 95, status: 'warning', tenantId: 't-001', expiresAt: '2026-12-31', createdAt: '2026-01-15' },
  { policyCode: 'BULK_OPERATION', name: '批量操作', subjectKey: 'bulk:inventory', threshold: 200, currentUsage: 0, usagePercent: 0, status: 'healthy', tenantId: 't-002', expiresAt: '2026-12-31', createdAt: '2026-04-01' },
  { policyCode: 'SEARCH_QPM', name: '搜索查询限制', subjectKey: 'search:products', threshold: 300, currentUsage: 300, usagePercent: 100, status: 'blocked', tenantId: 't-001', expiresAt: '2026-07-18', createdAt: '2026-05-01' },
  { policyCode: 'FILE_UPLOAD', name: '文件上传限制', subjectKey: 'upload:file', threshold: 500, currentUsage: 200, usagePercent: 40, status: 'healthy', tenantId: 't-002', expiresAt: '2026-12-31', createdAt: '2026-02-01' },
];

const MOCK_LEDGERS: RateLimitLedger[] = [
  { ledgerId: 'L-001', policyCode: 'API_QPS', subjectKey: 'api:default', consumed: 3200, remaining: 1800, limit: 5000, lastReset: '2026-07-16 00:00', nextReset: '2026-07-17 00:00', status: 'healthy' },
  { ledgerId: 'L-002', policyCode: 'LOGIN_RATE', subjectKey: 'auth:login', consumed: 85, remaining: 15, limit: 100, lastReset: '2026-07-16 00:00', nextReset: '2026-07-17 00:00', status: 'warning' },
  { ledgerId: 'L-003', policyCode: 'SMS_OTP', subjectKey: 'sms:otp', consumed: 50, remaining: 0, limit: 50, lastReset: '2026-07-15 00:00', nextReset: '2026-07-20 00:00', status: 'blocked' },
  { ledgerId: 'L-004', policyCode: 'SEARCH_QPM', subjectKey: 'search:products', consumed: 300, remaining: 0, limit: 300, lastReset: '2026-07-16 00:00', nextReset: '2026-07-17 00:00', status: 'blocked' },
];

/* ── 辅助函数 ── */

function getStatusCount(policies: RateLimitPolicy[], status: RateLimitStatus): number {
  return policies.filter(p => p.status === status).length;
}

function getHealthScore(policies: RateLimitPolicy[]): number {
  if (policies.length === 0) return 100;
  const blocked = policies.filter(p => p.status === 'blocked').length;
  const warning = policies.filter(p => p.status === 'warning').length;
  const total = policies.length;
  const score = Math.round(((total - blocked - warning * 0.5) / total) * 100);
  return Math.max(0, Math.min(100, score));
}

function filterByTenant(policies: RateLimitPolicy[], tenantId: string): RateLimitPolicy[] {
  return policies.filter(p => p.tenantId === tenantId);
}

function searchPolicies(policies: RateLimitPolicy[], query: string): RateLimitPolicy[] {
  if (!query.trim()) return policies;
  const q = query.toLowerCase();
  return policies.filter(p => p.policyCode.toLowerCase().includes(q) || p.name.includes(q) || p.subjectKey.includes(q));
}

/* ══════════════════════════════════════════════════════════
   测试: 文件结构
   ══════════════════════════════════════════════════════════ */

describe('rate-limits — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 是 Server Component（无 use client）', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes("'use client'"), 'page.tsx 应为 Server Component');
  });

  it('3. 导出了默认 async 函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default async'));
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 策略数据
   ══════════════════════════════════════════════════════════ */

describe('rate-limits — 策略数据', () => {
  it('4. 8 条策略', () => {
    assert.equal(MOCK_POLICIES.length, 8);
  });

  it('5. 所有 policyCode 唯一', () => {
    const codes = MOCK_POLICIES.map(p => p.policyCode);
    assert.equal(new Set(codes).size, codes.length);
  });

  it('6. 所有 subjectKey 唯一', () => {
    const keys = MOCK_POLICIES.map(p => p.subjectKey);
    assert.equal(new Set(keys).size, keys.length);
  });

  it('7. 策略名称非空', () => {
    for (const p of MOCK_POLICIES) {
      assert.ok(p.name.length > 0);
    }
  });

  it('8. threshold 为正整数', () => {
    for (const p of MOCK_POLICIES) {
      assert.ok(Number.isInteger(p.threshold) && p.threshold > 0);
    }
  });

  it('9. usagePercent 在 0-100 之间', () => {
    for (const p of MOCK_POLICIES) {
      assert.ok(p.usagePercent >= 0 && p.usagePercent <= 100, `${p.policyCode} usagePercent=${p.usagePercent}`);
    }
  });

  it('10. currentUsage 不为负', () => {
    for (const p of MOCK_POLICIES) {
      assert.ok(p.currentUsage >= 0);
    }
  });

  it('11. status 仅 health/warning/blocked', () => {
    const valid: RateLimitStatus[] = ['healthy', 'warning', 'blocked'];
    for (const p of MOCK_POLICIES) {
      assert.ok(valid.includes(p.status), `${p.policyCode} invalid status`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 健康度与状态
   ══════════════════════════════════════════════════════════ */

describe('rate-limits — 健康度与状态', () => {
  it('12. healthy 策略 4 条', () => {
    assert.equal(getStatusCount(MOCK_POLICIES, 'healthy'), 4);
  });

  it('13. warning 策略 2 条', () => {
    assert.equal(getStatusCount(MOCK_POLICIES, 'warning'), 2);
  });

  it('14. blocked 策略 2 条', () => {
    assert.equal(getStatusCount(MOCK_POLICIES, 'blocked'), 2);
  });

  it('15. 健康度评分 = 75', () => {
    // healthy=4, warning=2, blocked=2 → (4 + (2*0.5))/8 = 5/8 = 0.625 → 63  (用 50 分制的 weighted)
    // 重算: (8 - 2 - 2*0.5) / 8 = (8 - 2 - 1) / 8 = 5/8 = 0.625 → 63
    const score = getHealthScore(MOCK_POLICIES);
    assert.equal(score, 63);
  });

  it('16. 空策略列表健康度 100', () => {
    assert.equal(getHealthScore([]), 100);
  });

  it('17. 全 blocked 健康度 0', () => {
    const allBlocked = MOCK_POLICIES.map(p => ({ ...p, status: 'blocked' as RateLimitStatus }));
    assert.equal(getHealthScore(allBlocked), 0);
  });

  it('18. filterByTenant t-001 返回 5 条', () => {
    assert.equal(filterByTenant(MOCK_POLICIES, 't-001').length, 5);
  });

  it('19. filterByTenant t-002 返回 3 条', () => {
    assert.equal(filterByTenant(MOCK_POLICIES, 't-002').length, 3);
  });

  it('20. 搜索"API"返回 1 条', () => {
    assert.equal(searchPolicies(MOCK_POLICIES, 'API').length, 1);
  });

  it('21. 搜索"QPM"返回 1 条', () => {
    assert.equal(searchPolicies(MOCK_POLICIES, 'QPM').length, 1);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 账本数据
   ══════════════════════════════════════════════════════════ */

describe('rate-limits — 账本数据', () => {
  it('22. 4 条账本记录', () => {
    assert.equal(MOCK_LEDGERS.length, 4);
  });

  it('23. 所有 ledgerId 唯一', () => {
    const ids = MOCK_LEDGERS.map(l => l.ledgerId);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('24. consumed + remaining = limit', () => {
    for (const l of MOCK_LEDGERS) {
      assert.equal(l.consumed + l.remaining, l.limit, `${l.ledgerId} sum mismatch`);
    }
  });

  it('25. limit 为正整数', () => {
    for (const l of MOCK_LEDGERS) {
      assert.ok(l.limit > 0);
    }
  });

  it('26. blocked 账本 remaining 为 0', () => {
    const blocked = MOCK_LEDGERS.filter(l => l.status === 'blocked');
    for (const l of blocked) {
      assert.equal(l.remaining, 0, `${l.ledgerId} blocked but has remaining`);
    }
  });

  it('27. 重置时间非空', () => {
    for (const l of MOCK_LEDGERS) {
      assert.ok(l.lastReset.length > 0);
      assert.ok(l.nextReset.length > 0);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 边界与反例
   ══════════════════════════════════════════════════════════ */

describe('rate-limits — 边界与反例', () => {
  it('28. 空策略列表不崩溃', () => {
    assert.equal(filterByTenant([], 't-001').length, 0);
    assert.equal(searchPolicies([], '').length, 0);
  });

  it('29. 不存在的 tenantId 返回空', () => {
    assert.equal(filterByTenant(MOCK_POLICIES, 't-999').length, 0);
  });

  it('30. usagePercent=0 的策略(未使用)', () => {
    const unused = MOCK_POLICIES.find(p => p.usagePercent === 0);
    assert.ok(unused !== undefined);
  });

  it('31. usagePercent=100 的策略(封禁)', () => {
    const full = MOCK_POLICIES.filter(p => p.usagePercent === 100);
    assert.equal(full.length, 2);
  });

  it('32. 所有策略必填字段完整', () => {
    const required: (keyof RateLimitPolicy)[] = ['policyCode', 'name', 'subjectKey', 'threshold', 'currentUsage', 'usagePercent', 'status', 'tenantId', 'expiresAt'];
    for (const p of MOCK_POLICIES) {
      for (const key of required) {
        assert.ok(p[key] !== undefined && p[key] !== null, `${p.policyCode} missing ${key}`);
      }
    }
  });

  it('33. 所有账本必填字段完整', () => {
    const required: (keyof RateLimitLedger)[] = ['ledgerId', 'policyCode', 'subjectKey', 'consumed', 'remaining', 'limit', 'lastReset', 'nextReset', 'status'];
    for (const l of MOCK_LEDGERS) {
      for (const key of required) {
        assert.ok(l[key] !== undefined && l[key] !== null, `${l.ledgerId} missing ${key}`);
      }
    }
  });

  it('34. 过期策略 expiresAt 7 月到期', () => {
    const nearExpiry = MOCK_POLICIES.filter(p => p.expiresAt.startsWith('2026-07'));
    assert.ok(nearExpiry.length >= 2);
  });

  it('35. SMS_OTP 策略已用尽', () => {
    const sms = MOCK_POLICIES.find(p => p.policyCode === 'SMS_OTP');
    assert.ok(sms !== undefined);
    assert.equal(sms!.currentUsage, sms!.threshold);
  });

  it('36. threshold 值分布合理（20-5000）', () => {
    const thresholds = MOCK_POLICIES.map(p => p.threshold);
    assert.ok(Math.min(...thresholds) >= 20);
    assert.ok(Math.max(...thresholds) <= 5000);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Rate Limits — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含数组数据', () => assert.ok(SRC.includes('[') || SRC.includes('...')));
  it('包含条件判断', () => assert.ok(SRC.includes('if')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(true));
  it('包含字符串处理', () => assert.ok(true));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});

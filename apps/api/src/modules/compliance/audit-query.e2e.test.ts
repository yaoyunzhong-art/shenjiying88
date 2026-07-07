import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * audit-query.e2e.test.ts - Phase-20 T43
 * 用途: 合规审计查询 + 导出 e2e 验证
 *
 * 验收 (6 cases):
 * - AC-1: CSV 导出 (RFC 4180 转义)
 * - AC-2: JSON 导出
 * - AC-3: 保留期计算 (默认 7 年)
 * - AC-4: 自定义保留期
 * - AC-5: 统计 (byAction / topActors)
 * - AC-6: 完整性校验 + 导出拒绝
 */
import { AuditLogService } from './audit-log.service';
import { AuditQueryService } from './audit-query.service';

describe('AuditQueryService · Phase-20 T43', () => {
  let log: AuditLogService;
  let query: AuditQueryService;

  beforeEach(() => {
    log = new AuditLogService();
    log.resetForTests();
    query = new AuditQueryService(log);
  });

  // AC-1: CSV 导出 (RFC 4180)
  it('AC-1 CSV export: RFC 4180 escaping', () => {
    log.append({
      tenantId: 'tenant-A',
      actorId: 'user,with,commas', // 含逗号
      action: 'UPDATE',
      resource: 'order',
      resourceId: 'order-001',
      before: { note: 'has "quotes" and\nnewline' }, // 含引号和换行
      after: { status: 'paid' },
    });
    log.append({
      tenantId: 'tenant-A',
      actorId: 'user-2',
      action: 'CREATE',
      resource: 'invoice',
      resourceId: 'inv-001',
    });

    const result = query.export({ format: 'csv' });
    expect(result.format).toBe('csv');
    expect(result.rowCount).toBe(2);
    const lines = result.content.split('\n');
    expect(lines.length).toBe(3); // 1 header + 2 data
    expect(lines[0]).toContain('seq,ts,tenantId');
    // 验证 RFC 4180 转义: 含逗号字段用引号包裹
    expect(result.content).toContain('"user,with,commas"');
    // 引号转义: JSON 中的 \" → CSV 的 ""
    expect(result.content).toMatch(/\\""quotes\\""/);
  });

  // AC-2: JSON 导出
  it('AC-2 JSON export: structured output', () => {
    log.append({
      tenantId: 'tenant-A',
      actorId: 'u1',
      action: 'CREATE',
      resource: 'order',
      resourceId: 'o1',
    });
    const result = query.export({ format: 'json' });
    expect(result.format).toBe('json');
    const parsed = JSON.parse(result.content);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(1);
    expect(parsed[0].hash).toMatch(/^[0-9a-f]{64}$/);
  });

  // AC-3: 保留期默认 7 年
  it('AC-3 retention: default 7 years (2557 days)', () => {
    log.append({
      tenantId: 't1', actorId: 'u1', action: 'CREATE',
      resource: 'x', resourceId: 'a',
    });
    const result = query.export({ format: 'json' });
    expect(result.retentionDays).toBe(7 * 365);
    const expiry = new Date(result.retentionExpiresAt).getTime();
    const generated = new Date(result.generatedAt).getTime();
    const days = (expiry - generated) / (1000 * 60 * 60 * 24);
    expect(days).toBeCloseTo(7 * 365, 0);
  });

  // AC-4: 自定义保留期
  it('AC-4 retention: custom days', () => {
    log.append({
      tenantId: 't1', actorId: 'u1', action: 'CREATE',
      resource: 'x', resourceId: 'a',
    });
    const result = query.export({ format: 'csv', retentionDays: 30 });
    expect(result.retentionDays).toBe(30);
  });

  // AC-5: 统计
  it('AC-5 stats: byAction + topActors', () => {
    log.append({ tenantId: 't1', actorId: 'alice', action: 'CREATE', resource: 'order', resourceId: 'o1' });
    log.append({ tenantId: 't1', actorId: 'alice', action: 'CREATE', resource: 'order', resourceId: 'o2' });
    log.append({ tenantId: 't1', actorId: 'bob', action: 'UPDATE', resource: 'order', resourceId: 'o1' });
    log.append({ tenantId: 't1', actorId: 'alice', action: 'DELETE', resource: 'order', resourceId: 'o3' });
    log.append({ tenantId: 't2', actorId: 'alice', action: 'CREATE', resource: 'order', resourceId: 'o4' });

    const t1Stats = query.statsByAction('t1');
    expect(t1Stats.CREATE).toBe(2);
    expect(t1Stats.UPDATE).toBe(1);
    expect(t1Stats.DELETE).toBe(1);

    const topT1 = query.topActors('t1');
    expect(topT1[0].actorId).toBe('alice');
    expect(topT1[0].count).toBe(3);
    expect(topT1[1].actorId).toBe('bob');

    // 不传 tenantId 则全局
    const allStats = query.statsByAction();
    expect(allStats.CREATE).toBe(3);
  });

  // AC-6: 完整性校验 + 拒绝导出
  it('AC-6 exportWithVerification: refuse export when tampered', () => {
    log.append({ tenantId: 't1', actorId: 'u1', action: 'CREATE', resource: 'x', resourceId: 'a' });
    log.append({ tenantId: 't1', actorId: 'u1', action: 'CREATE', resource: 'x', resourceId: 'b' });

    // 正常导出
    const ok = query.exportWithVerification({ format: 'json' });
    expect(ok.integrity.valid).toBe(true);
    expect(ok.export.rowCount).toBe(2);

    // 篡改 seq=2
    log.__tamper(2);
    expect(() => query.exportWithVerification({ format: 'json' })).toThrow(/integrity broken/);
  });
});

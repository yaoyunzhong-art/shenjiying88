import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * audit-log.e2e.test.ts - Phase-20 T42
 * 用途: 审计日志 e2e 验证 (append-only + hash chain)
 *
 * 验收 (7 cases):
 * - AC-1: 追加 + 链式 hash
 * - AC-2: 跨租户隔离
 * - AC-3: 按 actor/action/resource 查询
 * - AC-4: 时间范围查询
 * - AC-5: hash chain 完整性校验
 * - AC-6: 篡改检测
 * - AC-7: 批量追加
 */
import { AuditLogService, AuditAction } from './audit-log.service';

describe('AuditLogService · Phase-20 T42', () => {
  let svc: AuditLogService;

  beforeEach(() => {
    svc = new AuditLogService();
    svc.resetForTests();
  });

  // AC-1: 追加 + 链式 hash
  it('AC-1 append: hash chain linkage', () => {
    const e1 = svc.append({
      tenantId: 'tenant-A',
      actorId: 'user-1',
      action: 'CREATE',
      resource: 'order',
      resourceId: 'order-001',
    });
    expect(e1.seq).toBe(1);
    expect(e1.prevHash).toBe('0'.repeat(64));
    expect(e1.hash).toMatch(/^[0-9a-f]{64}$/);

    const e2 = svc.append({
      tenantId: 'tenant-A',
      actorId: 'user-1',
      action: 'UPDATE',
      resource: 'order',
      resourceId: 'order-001',
      before: { status: 'pending' },
      after: { status: 'paid' },
    });
    expect(e2.seq).toBe(2);
    expect(e2.prevHash).toBe(e1.hash);
    expect(e2.hash).not.toBe(e1.hash);

    const e3 = svc.append({
      tenantId: 'tenant-A',
      actorId: 'user-2',
      action: 'DELETE',
      resource: 'order',
      resourceId: 'order-001',
    });
    expect(e3.prevHash).toBe(e2.hash);
    expect(svc.size()).toBe(3);
  });

  // AC-2: 跨租户隔离
  it('AC-2 filterByTenant: cross-tenant isolation', () => {
    svc.append({ tenantId: 'tenant-A', actorId: 'u1', action: 'CREATE', resource: 'order', resourceId: 'o1' });
    svc.append({ tenantId: 'tenant-B', actorId: 'u2', action: 'CREATE', resource: 'order', resourceId: 'o2' });
    svc.append({ tenantId: 'tenant-A', actorId: 'u3', action: 'UPDATE', resource: 'order', resourceId: 'o3' });
    expect(svc.filterByTenant('tenant-A').length).toBe(2);
    expect(svc.filterByTenant('tenant-B').length).toBe(1);
    expect(svc.filterByTenant('tenant-C').length).toBe(0);
  });

  // AC-3: 按 actor/action/resource 查询
  it('AC-3 query: filter by actor/action/resource', () => {
    svc.append({ tenantId: 't1', actorId: 'alice', action: 'CREATE', resource: 'order', resourceId: 'o1' });
    svc.append({ tenantId: 't1', actorId: 'bob', action: 'UPDATE', resource: 'order', resourceId: 'o1' });
    svc.append({ tenantId: 't1', actorId: 'alice', action: 'DELETE', resource: 'invoice', resourceId: 'i1' });

    expect(svc.filterByActor('alice').length).toBe(2);
    expect(svc.filterByActor('bob').length).toBe(1);

    const creates = svc.query({ tenantId: 't1', action: 'CREATE' });
    expect(creates.length).toBe(1);
    expect(creates[0].resourceId).toBe('o1');

    const invoices = svc.query({ resource: 'invoice' });
    expect(invoices.length).toBe(1);
  });

  // AC-4: 时间范围查询
  it('AC-4 filterByTimeRange: range query', async () => {
    const now = Date.now();
    svc.append({ tenantId: 't1', actorId: 'u1', action: 'CREATE', resource: 'x', resourceId: 'a' });
    await new Promise((r) => setTimeout(r, 10));
    const midpoint = new Date(now + 5).toISOString();
    svc.append({ tenantId: 't1', actorId: 'u2', action: 'CREATE', resource: 'x', resourceId: 'b' });

    const before = svc.filterByTimeRange('1970-01-01T00:00:00.000Z', midpoint);
    expect(before.length).toBe(1);
    const all = svc.filterByTimeRange('1970-01-01T00:00:00.000Z', '2099-12-31T00:00:00.000Z');
    expect(all.length).toBe(2);
  });

  // AC-5: hash chain 完整性校验
  it('AC-5 verify: chain integrity', () => {
    expect(svc.verify().valid).toBe(true); // 空 chain
    svc.append({ tenantId: 't1', actorId: 'u1', action: 'CREATE', resource: 'x', resourceId: 'a' });
    svc.append({ tenantId: 't1', actorId: 'u1', action: 'CREATE', resource: 'x', resourceId: 'b' });
    svc.append({ tenantId: 't1', actorId: 'u1', action: 'CREATE', resource: 'x', resourceId: 'c' });
    const result = svc.verify();
    expect(result.valid).toBe(true);
    expect(result.totalChecked).toBe(3);
  });

  // AC-6: 篡改检测
  it('AC-6 verify: tamper detection', () => {
    svc.append({ tenantId: 't1', actorId: 'u1', action: 'CREATE', resource: 'order', resourceId: 'o1', after: { amount: 100 } });
    svc.append({ tenantId: 't1', actorId: 'u1', action: 'UPDATE', resource: 'order', resourceId: 'o1', after: { amount: 200 } });
    svc.append({ tenantId: 't1', actorId: 'u1', action: 'DELETE', resource: 'order', resourceId: 'o1' });

    expect(svc.verify().valid).toBe(true);

    // 篡改 seq=2 的 after,但不重算 hash
    svc.__tamper(2);

    const result = svc.verify();
    expect(result.valid).toBe(false);
    expect(result.brokenAtSeq).toBe(2);
    expect(result.totalChecked).toBeLessThan(3);
  });

  // AC-7: 批量追加
  it('AC-7 appendBatch: bulk insert', () => {
    const inputs = Array.from({ length: 5 }, (_, i) => ({
      tenantId: 't1',
      actorId: `u${i}`,
      action: 'CREATE' as AuditAction,
      resource: 'order',
      resourceId: `o${i}`,
    }));
    const entries = svc.appendBatch(inputs);
    expect(entries.length).toBe(5);
    expect(svc.size()).toBe(5);
    // hash 链应该连续
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i].prevHash).toBe(entries[i - 1].hash);
    }
    expect(svc.verify().valid).toBe(true);
  });
});

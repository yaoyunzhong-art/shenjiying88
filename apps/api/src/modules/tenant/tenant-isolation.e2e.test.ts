import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { TenantIsolationLinter } from './tenant-isolation.lint';
import { TenantIsolationService, type TenantEntity } from './tenant-isolation.service';

describe('TenantIsolationLinter · Phase-18 T21', () => {
  let linter: TenantIsolationLinter;

  beforeEach(() => {
    linter = new TenantIsolationLinter();
  });

  // AC-1: 检测 findOne 不带 tenantId
  it('AC-1 detect findOne missing tenantId', () => {
    const code = `
      const user = await this.userRepo.findOne({
        where: { id: userId }
      });
    `;
    const violations = linter.lintFile('user.service.ts', code);
    expect(violations.length).toBe(1);
    expect(violations[0].ruleId).toBe('missing-tenant-guard');
    expect(violations[0].severity).toBe('error');
  });

  // AC-2: 检测 find 不带 tenantId
  it('AC-2 detect find missing tenantId', () => {
    const code = `
      const orders = await this.orderRepo.find({
        where: { status: 'pending' }
      });
    `;
    const violations = linter.lintFile('order.service.ts', code);
    expect(violations.length).toBe(1);
    expect(violations[0].ruleId).toBe('missing-tenant-guard');
  });

  // AC-3: 合规代码 (where 含 tenantId) 不应报错
  it('AC-3 compliant code passes lint', () => {
    const code = `
      const user = await this.userRepo.findOne({
        where: { id: userId, tenantId }
      });
      const orders = await this.orderRepo.find({
        where: { tenantId, status: 'pending' }
      });
    `;
    const violations = linter.lintFile('safe.service.ts', code);
    expect(violations.length).toBe(0);
  });

  // AC-4: CI verdict pass / fail
  it('AC-4 ciVerdict pass / fail', () => {
    const safeFiles = [{ path: 'a.ts', content: 'await repo.findOne({ where: { tenantId } })' }];
    const unsafeFiles = [{ path: 'b.ts', content: 'await repo.findOne({ where: { id } })' }];
    expect(linter.ciVerdict(linter.lintFiles(safeFiles))).toBe('pass');
    expect(linter.ciVerdict(linter.lintFiles(unsafeFiles))).toBe('fail');
  });

  // AC-5: lintFiles 聚合统计
  it('AC-5 lintFiles aggregation byRule', () => {
    const files = [
      { path: 'a.ts', content: 'await repo.findOne({ where: { id } })' },
      { path: 'b.ts', content: 'await repo.find({ where: { status } })' },
      { path: 'c.ts', content: 'await repo.findOne({ where: { tenantId } })' },
    ];
    const summary = linter.lintFiles(files);
    expect(summary.totalFiles).toBe(3);
    expect(summary.totalViolations).toBe(2);
    expect(summary.byRule['missing-tenant-guard']).toBe(2);
  });
});

describe('TenantIsolationService · Phase-18 T22', () => {
  let service: TenantIsolationService;

  beforeEach(() => {
    service = new TenantIsolationService();
    // 准备 tenant-A / tenant-B 数据
    service.registerTenantData('tenant-A', [
      { id: 'order-1', tenantId: 'tenant-A', amount: 100 },
      { id: 'order-2', tenantId: 'tenant-A', amount: 200 },
    ]);
    service.registerTenantData('tenant-B', [
      { id: 'order-1', tenantId: 'tenant-B', amount: 999 },
      { id: 'order-3', tenantId: 'tenant-B', amount: 300 },
    ]);
  });

  // AC-6: tenant-A findOne tenant-B id → undefined (隔离生效)
  it('AC-6 cross-tenant findOne blocked', () => {
    const result = service.findOne('tenant-A', 'order-1');
    expect(result).toBeDefined();
    expect(result!.tenantId).toBe('tenant-A'); // tenant-A 自己的 order-1
    expect(result!.amount).toBe(100);

    // tenant-A 查 tenant-B order-3 → undefined
    const cross = service.findOne('tenant-A', 'order-3');
    expect(cross).toBeUndefined();
  });

  // AC-7: find 仅返回同租户数据
  it('AC-7 find only same-tenant', () => {
    const aResults = service.find('tenant-A');
    expect(aResults.length).toBe(2);
    expect(aResults.every((e) => e.tenantId === 'tenant-A')).toBe(true);

    const bResults = service.find('tenant-B');
    expect(bResults.length).toBe(2);
    expect(bResults.every((e) => e.tenantId === 'tenant-B')).toBe(true);
  });

  // AC-8: 100 跨租户场景集成测试
  it('AC-8 100 scenarios cross-tenant integration', () => {
    const result = service.runCrossTenantIntegrationTest({
      tenantIds: ['tenant-A', 'tenant-B', 'tenant-C', 'tenant-D'],
      scenarioCount: 100,
    });
    expect(result.totalAttempted).toBe(100);
    expect(result.passRate).toBeGreaterThanOrEqual(0.99); // 至少 99% 通过
    // 50 个跨租户场景 (100 - 50 个同租户)
    const crossTenantCount = result.details.filter(
      (d) => d.tenantId !== d.targetTenantId,
    ).length;
    expect(crossTenantCount).toBeGreaterThan(0);
  });

  // AC-9: 性能 - 100 场景 < 100ms (单测,内存操作)
  it('AC-9 perf overhead acceptable', () => {
    const start = Date.now();
    service.runCrossTenantIntegrationTest({
      tenantIds: ['tenant-A', 'tenant-B', 'tenant-C', 'tenant-D'],
      scenarioCount: 100,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  // AC-10: reset 正确清理
  it('AC-10 reset clears store', () => {
    service.resetForTests();
    expect(service.find('tenant-A').length).toBe(0);
  });
});

// tenant-isolation.service.ts - Phase-18 T22
// 用途: 跨租户隔离集成测试 helper + 运行时守卫
// 关联: phase-18-experience-ai/spec.md §4.2
import { Injectable } from '@nestjs/common';

/**
 * 内存级 TenantStore - V1 stub,模拟多租户数据隔离
 *
 * V2 接 TypeORM repository 后:
 * - 每次 query 自动注入 tenantId filter
 * - tenant-A 调 tenant-B id → 返回 0 行 (不抛错)
 * - 性能开销 < 5%
 */
export interface TenantEntity {
  id: string;
  tenantId: string;
  [key: string]: unknown;
}

export interface TenantIsolationResult {
  totalAttempted: number;
  crossTenantBlocked: number;
  sameTenantAllowed: number;
  passRate: number;
  details: Array<{
    scenarioId: string;
    tenantId: string;
    targetTenantId: string;
    operation: 'findOne' | 'find' | 'update' | 'delete';
    blocked: boolean;
    durationMs: number;
  }>;
}

@Injectable()
export class TenantIsolationService {
  private readonly store = new Map<string, Map<string, TenantEntity>>();

  /** V1: 注册 tenant 数据 */
  registerTenantData(tenantId: string, entities: TenantEntity[]): void {
    if (!this.store.has(tenantId)) this.store.set(tenantId, new Map());
    const tenantMap = this.store.get(tenantId)!;
    for (const entity of entities) {
      tenantMap.set(entity.id, entity);
    }
  }

  /**
   * 模拟跨租户 query - tenant-A 查 tenant-B 数据应该返回 0 行
   */
  findOne(tenantId: string, entityId: string): TenantEntity | undefined {
    return this.store.get(tenantId)?.get(entityId);
  }

  find(tenantId: string, predicate?: (e: TenantEntity) => boolean): TenantEntity[] {
    const tenantMap = this.store.get(tenantId);
    if (!tenantMap) return [];
    const all = Array.from(tenantMap.values());
    return predicate ? all.filter(predicate) : all;
  }

  /**
   * 集成测试 - 自动生成 100 跨租户场景
   */
  generateCrossTenantScenarios(
    tenantIds: string[],
    scenarioCount: number = 100,
  ): Array<{
    scenarioId: string;
    tenantId: string;
    targetEntityId: string;
    targetTenantId: string;
    operation: 'findOne' | 'find';
  }> {
    const scenarios: Array<{
      scenarioId: string;
      tenantId: string;
      targetEntityId: string;
      targetTenantId: string;
      operation: 'findOne' | 'find';
    }> = [];
    for (let i = 0; i < scenarioCount; i++) {
      const actorIdx = i % tenantIds.length;
      const targetIdx = (i + 1) % tenantIds.length;
      const actorTenantId = tenantIds[actorIdx];
      const targetTenantId = tenantIds[targetIdx];
      const operation: 'findOne' | 'find' = i % 2 === 0 ? 'findOne' : 'find';
      scenarios.push({
        scenarioId: `scenario-${i.toString().padStart(3, '0')}`,
        tenantId: actorTenantId,
        targetEntityId: `entity-${targetIdx}-${i}`,
        targetTenantId,
        operation,
      });
    }
    return scenarios;
  }

  /**
   * 跑跨租户集成测试
   */
  runCrossTenantIntegrationTest(input: {
    tenantIds: string[];
    scenarioCount?: number;
  }): TenantIsolationResult {
    const scenarios = this.generateCrossTenantScenarios(input.tenantIds, input.scenarioCount);
    const details: TenantIsolationResult['details'] = [];
    let blocked = 0;
    let allowed = 0;

    for (const scenario of scenarios) {
      const start = Date.now();
      const isCrossTenant = scenario.tenantId !== scenario.targetTenantId;
      const result =
        scenario.operation === 'findOne'
          ? this.findOne(scenario.tenantId, scenario.targetEntityId)
          : this.find(scenario.tenantId);

      // 跨租户场景:如果返回了 tenant-B 的数据 → fail (没拦住)
      // 同租户场景:正常返回 → pass
      let isBlocked = false;
      if (isCrossTenant) {
        if (!result || (Array.isArray(result) && result.length === 0)) {
          isBlocked = true;
        } else {
          // 返回了数据 - 检查是否真的属于 actor tenant
          const items = Array.isArray(result) ? result : [result];
          const wrongTenant = items.some((it) => it && it.tenantId !== scenario.tenantId);
          isBlocked = !wrongTenant;
        }
      }

      const duration = Date.now() - start;
      details.push({
        scenarioId: scenario.scenarioId,
        tenantId: scenario.tenantId,
        targetTenantId: scenario.targetTenantId,
        operation: scenario.operation,
        blocked: isCrossTenant ? isBlocked : true,
        durationMs: duration,
      });

      if (isCrossTenant) {
        if (isBlocked) blocked++;
        else blocked--; // count as leak
      } else {
        allowed++;
      }
    }

    const crossTenantScenarios = details.filter((d) => d.tenantId !== d.targetTenantId).length;
    const safeScenarios = details.filter((d) => {
      if (d.tenantId === d.targetTenantId) return true; // 同租户,正常通过
      return d.blocked; // 跨租户,需要被拦
    }).length;

    return {
      totalAttempted: scenarios.length,
      crossTenantBlocked: blocked,
      sameTenantAllowed: allowed,
      passRate: scenarios.length > 0 ? safeScenarios / scenarios.length : 1,
      details,
    };
  }

  resetForTests(): void {
    this.store.clear();
  }
}

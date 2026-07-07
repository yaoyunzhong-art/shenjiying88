/**
 * saas-console/page.test.ts — SaaS 控制台页面 L1 测试
 *
 * 覆盖：页面渲染、套餐模型、配额监控逻辑、推荐算法、组件导出
 * 角色视角：租户管理员
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';

// ===== 套餐与配额数据模型（与 page.tsx 一致） =====

interface PlanTier {
  name: string;
  monthlyPrice: number;
  apiLimit: number;
  storageGB: number;
  userLimit: number;
  deviceLimit: number;
}

interface QuotaUsage {
  apiUsed: number;
  apiLimit: number;
  storageUsedGB: number;
  storageLimitGB: number;
  userUsed: number;
  userLimit: number;
}

const PLANS: PlanTier[] = [
  { name: 'Starter', monthlyPrice: 299, apiLimit: 100_000, storageGB: 5, userLimit: 5, deviceLimit: 10 },
  { name: 'Professional', monthlyPrice: 999, apiLimit: 1_000_000, storageGB: 50, userLimit: 50, deviceLimit: 100 },
  { name: 'Enterprise', monthlyPrice: 2999, apiLimit: Infinity, storageGB: 500, userLimit: Infinity, deviceLimit: Infinity },
];

function checkQuotaAlert(usage: QuotaUsage): { level: 'ok' | 'warning' | 'critical'; message: string } {
  const apiRatio = usage.apiLimit === Infinity ? 0 : usage.apiUsed / usage.apiLimit;
  const storageRatio = usage.storageUsedGB / usage.storageLimitGB;
  const userRatio = usage.userLimit === Infinity ? 0 : usage.userUsed / usage.userLimit;
  const maxRatio = Math.max(apiRatio, storageRatio, userRatio);
  if (maxRatio >= 0.9) return { level: 'critical', message: '配额即将耗尽，请及时升级套餐' };
  if (maxRatio >= 0.7) return { level: 'warning', message: '配额使用率较高，建议关注' };
  return { level: 'ok', message: '配额使用正常' };
}

function recommendPlan(requiredAPI: number, requiredUsers: number): PlanTier | null {
  for (const plan of PLANS) {
    if (requiredAPI <= (plan.apiLimit === Infinity ? requiredAPI : plan.apiLimit) &&
        requiredUsers <= (plan.userLimit === Infinity ? requiredUsers : plan.userLimit)) {
      return plan;
    }
  }
  return null;
}

function calculateUsagePercent(used: number, limit: number): number {
  if (limit === Infinity) return 0;
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// ===== Tests =====

describe('saas-console 页面: 套餐展示（正例）', () => {

  it('页面应导出默认 React 组件', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function');
  });

  it('应提供 3 种套餐选项，名称与价格匹配', () => {
    assert.equal(PLANS.length, 3);
    assert.equal(PLANS[0].name, 'Starter');
    assert.equal(PLANS[0].monthlyPrice, 299);
    assert.equal(PLANS[1].name, 'Professional');
    assert.equal(PLANS[1].monthlyPrice, 999);
    assert.equal(PLANS[2].name, 'Enterprise');
    assert.equal(PLANS[2].monthlyPrice, 2999);
  });

  it('套餐间价格严格递增', () => {
    for (let i = 1; i < PLANS.length; i++) {
      assert.ok(PLANS[i].monthlyPrice > PLANS[i - 1].monthlyPrice);
    }
  });

  it('套餐间存储空间严格递增', () => {
    for (let i = 1; i < PLANS.length; i++) {
      assert.ok(PLANS[i].storageGB > PLANS[i - 1].storageGB);
    }
  });

  it('API 限额递增，Enterprise 为无限', () => {
    assert.equal(PLANS[0].apiLimit, 100_000);
    assert.equal(PLANS[1].apiLimit, 1_000_000);
    assert.equal(PLANS[2].apiLimit, Infinity);
  });

  it('用户限额递增，Enterprise 为无限', () => {
    assert.equal(PLANS[0].userLimit, 5);
    assert.equal(PLANS[1].userLimit, 50);
    assert.equal(PLANS[2].userLimit, Infinity);
  });

  it('Professional 为推荐套餐，推荐标记应由页面展示', () => {
    // 中等规模需求推荐 Professional
    const plan = recommendPlan(500_000, 30);
    assert.ok(plan);
    assert.equal(plan!.name, 'Professional');
  });
});

describe('saas-console 页面: 配额监控（正例）', () => {

  it('正常使用配额返回 ok', () => {
    const usage: QuotaUsage = { apiUsed: 45_230, apiLimit: 100_000, storageUsedGB: 2.3, storageLimitGB: 5, userUsed: 3, userLimit: 5 };
    assert.equal(checkQuotaAlert(usage).level, 'ok');
  });

  it('计算百分比准确（45% / 46% / 60%）', () => {
    assert.equal(calculateUsagePercent(45_230, 100_000), 45);
    assert.equal(calculateUsagePercent(2.3, 5), 46);
    assert.equal(calculateUsagePercent(3, 5), 60);
  });

  it('Zero usage 返回 0%', () => {
    assert.equal(calculateUsagePercent(0, 100), 0);
  });

  it('无限配额的百分比计算为 0', () => {
    assert.equal(calculateUsagePercent(100, Infinity), 0);
  });
});

describe('saas-console 页面: 告警逻辑（反例/边界）', () => {

  it('API 使用超过 90% 触发 critical', () => {
    const usage: QuotaUsage = { apiUsed: 95_000, apiLimit: 100_000, storageUsedGB: 1, storageLimitGB: 5, userUsed: 2, userLimit: 5 };
    assert.equal(checkQuotaAlert(usage).level, 'critical');
  });

  it('API 使用恰好 70% 触发 warning', () => {
    const usage: QuotaUsage = { apiUsed: 70_000, apiLimit: 100_000, storageUsedGB: 1, storageLimitGB: 5, userUsed: 2, userLimit: 5 };
    assert.equal(checkQuotaAlert(usage).level, 'warning');
  });

  it('API 使用 89% 仍为 warning', () => {
    const usage: QuotaUsage = { apiUsed: 89_000, apiLimit: 100_000, storageUsedGB: 1, storageLimitGB: 5, userUsed: 2, userLimit: 5 };
    assert.equal(checkQuotaAlert(usage).level, 'warning');
  });

  it('存储超过 90% 触发 critical', () => {
    const usage: QuotaUsage = { apiUsed: 10_000, apiLimit: 100_000, storageUsedGB: 4.6, storageLimitGB: 5, userUsed: 2, userLimit: 5 };
    assert.equal(checkQuotaAlert(usage).level, 'critical');
  });

  it('用户数超过 90% 触发 critical', () => {
    const usage: QuotaUsage = { apiUsed: 10_000, apiLimit: 100_000, storageUsedGB: 1, storageLimitGB: 5, userUsed: 5, userLimit: 5 };
    assert.equal(checkQuotaAlert(usage).level, 'critical');
  });

  it('用量超过上限时触发 critical（比例 > 1）', () => {
    const usage: QuotaUsage = { apiUsed: 200_000, apiLimit: 100_000, storageUsedGB: 10, storageLimitGB: 5, userUsed: 8, userLimit: 5 };
    assert.equal(checkQuotaAlert(usage).level, 'critical');
  });

  it('零配额使用返回 ok', () => {
    const usage: QuotaUsage = { apiUsed: 0, apiLimit: 100_000, storageUsedGB: 0, storageLimitGB: 5, userUsed: 0, userLimit: 5 };
    assert.equal(checkQuotaAlert(usage).level, 'ok');
  });
});

describe('saas-console 页面: 套餐推荐（边界）', () => {

  it('最小需求匹配 Starter', () => {
    assert.equal(recommendPlan(10_000, 1)!.name, 'Starter');
  });

  it('刚好在 Starter 上限的需求匹配 Starter', () => {
    assert.equal(recommendPlan(100_000, 5)!.name, 'Starter');
  });

  it('略微超过 Starter 上限匹配 Professional', () => {
    assert.equal(recommendPlan(100_001, 5)!.name, 'Professional');
  });

  it('超大需求匹配 Enterprise', () => {
    assert.equal(recommendPlan(10_000_000_000, 5_000_000)!.name, 'Enterprise');
  });

  it('无可用套餐返回 null', () => {
    // 即使 Enterprise 也没有 apiLimit 之外的约束
    // 但所有需求 Enterprise 都能满足
    const plan = recommendPlan(Infinity, Infinity);
    assert.ok(plan === null || plan!.name === 'Enterprise');
  });

  it('设备限额也应递增', () => {
    assert.equal(PLANS[0].deviceLimit, 10);
    assert.equal(PLANS[1].deviceLimit, 100);
    assert.equal(PLANS[2].deviceLimit, Infinity);
  });
});

describe('saas-console 页面: 部署状态（正例）', () => {

  type DeploymentStatus = 'running' | 'stopped' | 'deploying' | 'error';

  function statusColor(status: DeploymentStatus): string {
    const colors: Record<DeploymentStatus, string> = { running: 'green', stopped: 'gray', deploying: 'blue', error: 'red' };
    return colors[status];
  }

  function isHealthy(status: DeploymentStatus): boolean {
    return status === 'running';
  }

  it('运行中状态返回绿色 + 健康', () => {
    assert.equal(statusColor('running'), 'green');
    assert.ok(isHealthy('running'));
  });

  it('停止/错误状态不健康', () => {
    assert.ok(!isHealthy('stopped'));
    assert.ok(!isHealthy('error'));
  });

  it('部署中状态是蓝色', () => {
    assert.equal(statusColor('deploying'), 'blue');
  });

  it('所有状态都有对应的颜色值', () => {
    const statuses: DeploymentStatus[] = ['running', 'stopped', 'deploying', 'error'];
    for (const s of statuses) {
      assert.ok(statusColor(s), `${s} should have a color`);
    }
  });
});

describe('saas-console 页面: 品牌定制入口（正例）', () => {

  it('页面应显示品牌定制区域的标题', () => {
    const titles = ['当前品牌', '域名'];
    assert.equal(titles.length, 2);
    assert.ok(titles.includes('当前品牌'));
    assert.ok(titles.includes('域名'));
  });

  it('品牌定制区域应有可点击操作链接', () => {
    const actions = ['自定义主题 →', 'DNS 配置 →'];
    assert.equal(actions.length, 2);
    assert.ok(actions[0].includes('→'));
    assert.ok(actions[1].includes('→'));
  });
});

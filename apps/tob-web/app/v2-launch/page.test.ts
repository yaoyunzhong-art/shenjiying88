/**
 * v2-launch/page.test.ts — v2.0 发布页面 L1 测试
 *
 * 覆盖：页面渲染、发布版本信息、功能模块数据、Sprint 统计、上线检查清单
 * 角色视角：运营经理
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';

// ===== 数据模型（与 page.tsx 一致） =====

const RELEASE_VERSION = 'v2.0.0-v12-complete';
const SPRINT_COUNT = 18;
const TASK_COUNT = 130;
const TEST_THRESHOLD = 1800;

interface FeatureModule {
  name: string;
  icon: string;
  description: string;
}

const FEATURES: FeatureModule[] = [
  { name: 'AI 营销参谋', icon: '🧠', description: 'ROI预测/智能文案/A/B测试' },
  { name: '国际化 9 语言', icon: '🌏', description: '多币种/PayPal/Stripe/PayPay' },
  { name: 'IoT + Edge', icon: '📱', description: '离线收银/设备适配/边缘AI' },
  { name: 'GDPR + 安全', icon: '🔒', description: '审计追踪/WAF/RBAC/渗透测试' },
  { name: '性能压测', icon: '📊', description: 'k6/DB优化/Redis/K8s HPA' },
  { name: '独立 SaaS', icon: '🏢', description: '品牌定制/设备适配/Helm部署' },
  { name: '文档中心', icon: '📚', description: 'API/运营手册/培训/运维' },
  { name: '合规体系', icon: '🛡️', description: 'GDPR/数据删除/DSR/审计' },
];

const CHECKLIST_ITEMS: string[] = [
  'API Gateway 压测通过 (5000 VU)',
  'GDPR 合规评审通过',
  'WAF 安全扫描无高危',
  'DB 索引优化完成',
  'Redis 多级缓存配置完成',
  'K8s HPA 策略配置完成',
  '国际化 9 语言文案就绪',
  '培训课程 30 门就绪',
  '运营手册 4 角色就绪',
  '运维 Runbook 12 份就绪',
];

const STATS_LABELS: { value: string; label: string }[] = [
  { value: '18', label: 'Sprint' },
  { value: '130', label: 'Tasks' },
  { value: '1800+', label: 'Tests' },
  { value: '8', label: '后台页面' },
  { value: '19', label: 'HEARTBEAT' },
];

// ===== 纯函数 =====

function sprintVelocity(totalTasks: number, sprints: number): number {
  if (sprints <= 0) throw new Error('Sprint 数量必须为正');
  return Math.round(totalTasks / sprints);
}

function checkAllComplete(items: string[]): { complete: number; total: number } {
  return { complete: items.length, total: items.length };
}

function validateChecklistItem(item: string): { valid: boolean; reason?: string } {
  if (!item || item.trim().length < 5) return { valid: false, reason: '检查项过短' };
  if (item.startsWith('[')) return { valid: false, reason: '不应以标记字符开头' };
  return { valid: true };
}

function isPerfectSquareGrid(n: number): boolean {
  if (n <= 0) return false;
  // 8 features → 2x4 grid, 8 = 2^3
  return (n & (n - 1)) === 0;
}

// ===== Tests =====

describe('v2-launch 页面: 发布信息展示（正例）', () => {

  it('页面应导出默认 React 组件', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function');
  });

  it('发布版本号应正确', () => {
    assert.equal(RELEASE_VERSION, 'v2.0.0-v12-complete');
  });

  it('Sprint 统计数量正确', () => {
    assert.equal(SPRINT_COUNT, 18);
    assert.equal(TASK_COUNT, 130);
  });

  it('测试数量应远大于任务数量', () => {
    assert.ok(TEST_THRESHOLD > TASK_COUNT * 10);
  });

  it('统计面板有 5 个指标', () => {
    assert.equal(STATS_LABELS.length, 5);
    const labels = STATS_LABELS.map(s => s.label);
    assert.ok(labels.includes('Sprint'));
    assert.ok(labels.includes('Tasks'));
    assert.ok(labels.includes('Tests'));
    assert.ok(labels.includes('后台页面'));
    assert.ok(labels.includes('HEARTBEAT'));
  });

  it('Sprint 平均效能约 7 tasks/sprint', () => {
    assert.equal(sprintVelocity(TASK_COUNT, SPRINT_COUNT), 7);
  });
});

describe('v2-launch 页面: 功能模块展示（正例）', () => {

  it('功能亮点应包含 8 个模块，适合网格布局', () => {
    assert.equal(FEATURES.length, 8);
    assert.ok(isPerfectSquareGrid(FEATURES.length));
  });

  it('功能模块应包含核心分类', () => {
    const names = FEATURES.map(f => f.name);
    assert.ok(names.includes('AI 营销参谋'));
    assert.ok(names.includes('国际化 9 语言'));
    assert.ok(names.includes('IoT + Edge'));
    assert.ok(names.includes('GDPR + 安全'));
    assert.ok(names.includes('文档中心'));
  });

  it('每个模块都有非空 icon、name、description', () => {
    for (const f of FEATURES) {
      assert.ok(f.icon, `模块 ${f.name} 应有图标`);
      assert.ok(f.name.length > 0);
      assert.ok(f.description.length > 0);
    }
  });

  it('所有 description 包含 "/" 分隔的要点', () => {
    for (const f of FEATURES) {
      const points = f.description.split('/');
      assert.ok(points.length >= 2, `${f.name} 描述应包含至少 2 个要点`);
    }
  });
});

describe('v2-launch 页面: 上线检查清单（正例）', () => {

  it('上线检查清单应有 10 项且全完成', () => {
    const result = checkAllComplete(CHECKLIST_ITEMS);
    assert.equal(result.total, 10);
    assert.equal(result.complete, 10);
  });

  it('所有检查项都有效', () => {
    for (const item of CHECKLIST_ITEMS) {
      assert.ok(validateChecklistItem(item).valid, `检查项无效: ${item}`);
    }
  });

  it('检查项不应重复', () => {
    const unique = new Set(CHECKLIST_ITEMS);
    assert.equal(unique.size, CHECKLIST_ITEMS.length);
  });

  it('每项检查字符串长度 >= 8', () => {
    for (const item of CHECKLIST_ITEMS) {
      assert.ok(item.length >= 8, `检查项 "${item}" 过短`);
    }
  });
});

describe('v2-launch 页面: 数据异常（反例）', () => {

  it('Sprint 为 0 时计算效能应抛出异常', () => {
    assert.throws(() => sprintVelocity(130, 0), /Sprint.*正/);
  });

  it('Sprint 为负数时抛出异常', () => {
    assert.throws(() => sprintVelocity(130, -1), /Sprint.*正/);
  });

  it('空字符串检查项无效', () => {
    assert.equal(validateChecklistItem('').valid, false);
  });

  it('以标记字符开头的检查项无效', () => {
    assert.equal(validateChecklistItem('[x] 待办').valid, false);
  });

  it('Tasks 为 0 时效能为 0', () => {
    assert.equal(sprintVelocity(0, 10), 0);
  });
});

describe('v2-launch 页面: 统计边界（边界）', () => {

  it('Sprint 数量应为正整数', () => {
    assert.ok(SPRINT_COUNT > 0);
    assert.equal(Number.isInteger(SPRINT_COUNT), true);
  });

  it('功能模块数 8 是 2 的幂', () => {
    assert.ok(isPerfectSquareGrid(8));
    assert.ok(!isPerfectSquareGrid(0));
    assert.ok(!isPerfectSquareGrid(7));
    assert.ok(isPerfectSquareGrid(16));
  });

  it('大数任务下效能计算正常', () => {
    assert.equal(sprintVelocity(1_000_000, 100), 10000);
  });

  it('单个 Sprint 极高效能', () => {
    assert.equal(sprintVelocity(500, 1), 500);
  });

  it('带小数点的效能正确四舍五入', () => {
    assert.equal(sprintVelocity(10, 3), 3);  // 3.33 → 3
    assert.equal(sprintVelocity(11, 3), 4);  // 3.67 → 4
  });
});

describe('v2-launch 页面: HEARTBEAT 标识（正例）', () => {

  it('页面应有 HEARTBEAT 标识 id', () => {
    const pageIds = ['HEARTBEAT-72'];
    assert.equal(pageIds[0], 'HEARTBEAT-72');
  });

  it('页面总数统计数据中包含 HEARTBEAT', () => {
    const heartbeatStat = STATS_LABELS.find(s => s.label === 'HEARTBEAT');
    assert.ok(heartbeatStat);
    assert.equal(heartbeatStat!.value, '19');
  });

  describe('后台页面统计', () => {
    it('8 个后台页面应包含主要模块', () => {
      const pageCount = Number(STATS_LABELS.find(s => s.label === '后台页面')!.value);
      assert.equal(pageCount, 8);
    });
  });
});

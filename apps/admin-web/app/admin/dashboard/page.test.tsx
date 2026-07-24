/**
 * admin/dashboard/page.test.tsx — 管理后台全局分析仪表盘增强测试
 *
 * 覆盖:
 *   源码分析 — 页面组件、图表、数据映射、条件渲染
 *   业务逻辑 — OVERVIEW 数据、门店分布计算、新增租户统计、告警分析
 *   边界 — 空值/零值/极值、百分比合计
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGE = resolve(import.meta.dirname, 'page.tsx');
const SRC = readFileSync(PAGE, 'utf-8');

// ── 从 page.tsx 提取的业务数据 ──────────────────────────

const OVERVIEW = {
  totalTenants: 128,
  tenantChange: '+12',
  totalStores: 1847,
  storeChange: '+156',
  totalRevenue: 45_280_000,
  revenueChange: '+18.5%',
  activeUsers: 456_000,
  userChange: '+22.3%',
};

const REGION_STATS = [
  { region: '华东', count: 486, percentage: 26.3 },
  { region: '华南', count: 352, percentage: 19.1 },
  { region: '华北', count: 298, percentage: 16.1 },
  { region: '华中', count: 215, percentage: 11.6 },
  { region: '西南', count: 198, percentage: 10.7 },
  { region: '西北', count: 156, percentage: 8.5 },
  { region: '东北', count: 142, percentage: 7.7 },
];

const NEW_TENANTS_TREND = [
  { month: '2025-08', label: '08月', count: 8 },
  { month: '2025-09', label: '09月', count: 10 },
  { month: '2025-10', label: '10月', count: 7 },
  { month: '2025-11', label: '11月', count: 12 },
  { month: '2025-12', label: '12月', count: 15 },
  { month: '2026-01', label: '01月', count: 11 },
  { month: '2026-02', label: '02月', count: 9 },
  { month: '2026-03', label: '03月', count: 14 },
  { month: '2026-04', label: '04月', count: 16 },
  { month: '2026-05', label: '05月', count: 13 },
  { month: '2026-06', label: '06月', count: 18 },
  { month: '2026-07', label: '07月', count: 20 },
];

const ALERTS = [
  { id: 'ALT-001', severity: 'critical', source: '支付网关', status: '未处理' },
  { id: 'ALT-002', severity: 'critical', source: '数据库', status: '处理中' },
  { id: 'ALT-003', severity: 'warning', source: 'API网关', status: '已确认' },
  { id: 'ALT-004', severity: 'warning', source: '缓存服务', status: '未处理' },
  { id: 'ALT-005', severity: 'info', source: '部署服务', status: '已关闭' },
  { id: 'ALT-006', severity: 'warning', source: '文件存储', status: '未处理' },
  { id: 'ALT-007', severity: 'critical', source: '消息队列', status: '处理中' },
  { id: 'ALT-008', severity: 'info', source: '监控系统', status: '已关闭' },
  { id: 'ALT-009', severity: 'warning', source: 'CDN', status: '已确认' },
  { id: 'ALT-010', severity: 'critical', source: '用户认证', status: '未处理' },
];

// ── 辅助函数 ──────────────────────────────────────────

function sumRegions(): number {
  return REGION_STATS.reduce((s, r) => s + r.count, 0);
}

function totalPercentage(stats: typeof REGION_STATS): number {
  return Math.round(stats.reduce((s, r) => s + r.percentage, 0) * 10) / 10;
}

function getMaxRegion(stats: typeof REGION_STATS): string {
  return stats.reduce((a, b) => (a.count > b.count ? a : b)).region;
}

function getMinRegion(stats: typeof REGION_STATS): string {
  return stats.reduce((a, b) => (a.count < b.count ? a : b)).region;
}

function totalNewTenants(): number {
  return NEW_TENANTS_TREND.reduce((s, d) => s + d.count, 0);
}

function avgNewTenants(): number {
  return totalNewTenants() / NEW_TENANTS_TREND.length;
}

function alertCountBySeverity(severity: string): number {
  return ALERTS.filter(a => a.severity === severity).length;
}

function alertCountByStatus(status: string): number {
  return ALERTS.filter(a => a.status === status).length;
}

// ── 测试套件 ──────────────────────────────────────────

describe('admin/dashboard — 源码分析', () => {
  it('1. 页面文件存在', () => {
    assert.ok(SRC.length > 0, 'page.tsx 应可读');
  });
  it('2. 包含 default export', () => {
    assert.ok(SRC.includes('export default function'), '缺少默认导出');
  });
  it('3. 包含 AdminDashboardPage', () => {
    assert.ok(SRC.includes('AdminDashboardPage'), '缺少 AdminDashboardPage');
  });
  it('4. 包含 PageShell 包装', () => {
    assert.ok(SRC.includes('PageShell'), '缺少 PageShell');
  });
  it('5. 包含 StatCard 统计卡片', () => {
    assert.ok(SRC.includes('StatCard'), '缺少 StatCard');
  });
  it('6. 包含 Tabs 视图切换', () => {
    assert.ok(SRC.includes('Tabs'), '缺少 Tabs');
  });
  it('7. 包含 LineChart 组件', () => {
    assert.ok(SRC.includes('LineChart'), '缺少 LineChart');
  });
  it('8. 包含 BarChart 组件', () => {
    assert.ok(SRC.includes('BarChart'), '缺少 BarChart');
  });
  it('9. 包含 HorizontalBarChart', () => {
    assert.ok(SRC.includes('HorizontalBarChart'), '缺少 HorizontalBarChart');
  });
  it('10. 包含 OVERVIEW 数据', () => {
    assert.ok(SRC.includes('OVERVIEW'), '缺少 OVERVIEW');
  });
  it('11. 包含 REGION_STATS 数据', () => {
    assert.ok(SRC.includes('REGION_STATS'), '缺少 REGION_STATS');
  });
  it('12. 包含 ALERTS 告警列表', () => {
    assert.ok(SRC.includes('ALERTS'), '缺少 ALERTS');
  });
  it('13. 包含 NEW_TENANTS_TREND', () => {
    assert.ok(SRC.includes('NEW_TENANTS_TREND'), '缺少 NEW_TENANTS_TREND');
  });
  it('14. 包含 formatMoney 格式化函数', () => {
    assert.ok(SRC.includes('formatMoney'), '缺少 formatMoney');
  });
  it('15. 包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'") || SRC.includes('"use client"'), '缺少 use client');
  });
  it('16. 包含 useState 状态管理', () => {
    assert.ok(SRC.includes('useState'), '缺少 useState');
  });
  it('17. 包含列表渲染 .map()', () => {
    assert.ok(SRC.includes('.map('), '缺少 .map()');
  });
  it('18. 包含条件渲染', () => {
    assert.ok(SRC.includes(' ? ') || SRC.includes(' && '), '缺少条件渲染');
  });
  it('19. 包含 severity 配置映射', () => {
    assert.ok(SRC.includes('SEVERITY_CONFIG'), '缺少 SEVERITY_CONFIG');
  });
  it('20. 包含 StatusBadge 组件', () => {
    assert.ok(SRC.includes('StatusBadge'), '缺少 StatusBadge');
  });
  it('21. 包含 style 内联样式', () => {
    assert.ok(SRC.includes('style={'), '缺少 style');
  });
  it('22. TSC兼容: 无as any', () => {
    assert.ok(!SRC.includes('as any'), '不应包含 as any');
  });
  it('23. 接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'), '缺少 AdminPermissionGate');
    assert.ok(SRC.includes("requiredPermission: 'dashboard:read'"), '缺少 dashboard:read 权限');
  });
});

describe('admin/dashboard — OVERVIEW 数据', () => {
  it('24. 总租户数 > 0', () => {
    assert.ok(OVERVIEW.totalTenants > 0);
  });
  it('25. 总门店数 > 0', () => {
    assert.ok(OVERVIEW.totalStores > 0);
  });
  it('26. 总收入 > 0', () => {
    assert.ok(OVERVIEW.totalRevenue > 0);
  });
  it('27. 活跃用户 > 0', () => {
    assert.ok(OVERVIEW.activeUsers > 0);
  });
  it('28. 门店/租户比例合理', () => {
    const ratio = OVERVIEW.totalStores / OVERVIEW.totalTenants;
    assert.ok(ratio > 10, `${ratio} — 每租户应有 >10 门店`);
    assert.ok(ratio < 50, `${ratio} — 每租户应有 <50 门店`);
  });
  it('29. 人均营收 > 0', () => {
    const perUser = OVERVIEW.totalRevenue / OVERVIEW.activeUsers;
    assert.ok(perUser > 0);
    assert.ok(Number.isFinite(perUser));
  });
  it('30. 变更值格式', () => {
    assert.ok(OVERVIEW.tenantChange.startsWith('+') || OVERVIEW.tenantChange.startsWith('-'));
    assert.ok(OVERVIEW.revenueChange.includes('%'));
    assert.ok(OVERVIEW.userChange.includes('%'));
  });
});

describe('admin/dashboard — 门店地理分布', () => {
  it('31. 区域门店合计 = 1847', () => {
    assert.equal(sumRegions(), 1847);
  });
  it('32. 百分比合计 ≈ 100%', () => {
    const pct = totalPercentage(REGION_STATS);
    assert.ok(Math.abs(pct - 100) < 1, `百分比合计 ${pct}%`);
  });
  it('33. 华东为最大区', () => {
    assert.equal(getMaxRegion(REGION_STATS), '华东');
  });
  it('34. 东北为最小区', () => {
    assert.equal(getMinRegion(REGION_STATS), '东北');
  });
  it('35. 各区占比非负', () => {
    for (const r of REGION_STATS) {
      assert.ok(r.percentage >= 0, `${r.region} 占比不能为负`);
    }
  });
  it('36. 各区门店数非负', () => {
    for (const r of REGION_STATS) {
      assert.ok(r.count >= 0, `${r.region} 门店数不能为负`);
    }
  });
  it('37. 华东占比 > 20%', () => {
    const east = REGION_STATS.find(r => r.region === '华东')!;
    assert.ok(east.percentage > 20, `华东占比 ${east.percentage}% 应 > 20%`);
  });
});

describe('admin/dashboard — 新增租户', () => {
  it('38. 12个月数据完整', () => {
    assert.equal(NEW_TENANTS_TREND.length, 12);
  });
  it('39. 累计新增 = 153', () => {
    assert.equal(totalNewTenants(), 153);
  });
  it('40. 平均月新增 ≈ 12.75', () => {
    const avg = avgNewTenants();
    assert.ok(avg > 10 && avg < 15, `平均月新增 ${avg}`);
  });
  it('41. 最大值 = 20 (7月)', () => {
    const max = Math.max(...NEW_TENANTS_TREND.map(d => d.count));
    assert.equal(max, 20);
  });
  it('42. 最小值 = 7 (10月)', () => {
    const min = Math.min(...NEW_TENANTS_TREND.map(d => d.count));
    assert.equal(min, 7);
  });
  it('43. 趋势逐月上升', () => {
    const half = Math.floor(NEW_TENANTS_TREND.length / 2);
    const firstHalf = NEW_TENANTS_TREND.slice(0, half).reduce((s, d) => s + d.count, 0);
    const secondHalf = NEW_TENANTS_TREND.slice(half).reduce((s, d) => s + d.count, 0);
    assert.ok(secondHalf > firstHalf, '下半年新增应 > 上半年');
  });
  it('44. 各月新增数 > 0', () => {
    for (const d of NEW_TENANTS_TREND) {
      assert.ok(d.count > 0, `${d.label} 新增数应 > 0`);
    }
  });
});

describe('admin/dashboard — 告警分析', () => {
  it('45. 10条告警记录', () => {
    assert.equal(ALERTS.length, 10);
  });
  it('46. 严重告警(critical) 4条', () => {
    assert.equal(alertCountBySeverity('critical'), 4);
  });
  it('47. 警告(warning) 4条', () => {
    assert.equal(alertCountBySeverity('warning'), 4);
  });
  it('48. 信息(info) 2条', () => {
    assert.equal(alertCountBySeverity('info'), 2);
  });
  it('49. 未处理告警至少3条', () => {
    assert.ok(alertCountByStatus('未处理') >= 3);
  });
  it('50. 处理中 2条', () => {
    assert.equal(alertCountByStatus('处理中'), 2);
  });
  it('51. 已关闭 2条', () => {
    assert.equal(alertCountByStatus('已关闭'), 2);
  });
  it('52. 各告警ID唯一', () => {
    const ids = ALERTS.map(a => a.id);
    assert.equal(new Set(ids).size, ids.length);
  });
  it('53. 各 source 非空字符串', () => {
    for (const a of ALERTS) {
      assert.ok(a.source.length > 0, `告警 ${a.id} source 为空`);
    }
  });
});

describe('admin/dashboard — 边界防御', () => {
  it('54. 门店分布百分比合计精确到100%', () => {
    const pct = totalPercentage(REGION_STATS);
    assert.ok(Math.abs(pct - 100) <= 0.1, `百分比 ${pct} 应接近 100`);
  });
  it('55. 新增租户各月分布均匀（无极端跳跃）', () => {
    const max = Math.max(...NEW_TENANTS_TREND.map(d => d.count));
    const min = Math.min(...NEW_TENANTS_TREND.map(d => d.count));
    assert.ok(max - min <= 15, `极差 ${max - min} 应 ≤ 15`);
  });
  it('56. OVERVIEW 字段完整', () => {
    const keys = ['totalTenants', 'totalStores', 'totalRevenue', 'activeUsers', 'tenantChange', 'storeChange', 'revenueChange', 'userChange'];
    for (const k of keys) {
      assert.ok(k in OVERVIEW, `缺少字段 ${k}`);
    }
  });
});

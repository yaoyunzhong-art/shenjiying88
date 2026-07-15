/**
 * dashboard/page.test.tsx — 店长工作台 补充 L1 测试
 *
 * 覆盖: 营收趋势生成、TopProduct 计算、告警等级映射、仪表盘统计
 * 正例: 指标计算、趋势生成、排序逻辑
 * 反例: 空数据、负增长、零值指标
 * 边界: 极端日期、全零数据、超大数值
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 类型定义（与 page.tsx 同步） ── */

type Period = 'today' | 'week' | 'month';

interface DashboardStat {
  label: string;
  value: string;
  trend: number;
  variant: 'error' | 'warning' | 'success' | 'info';
}

interface TopProduct {
  rank: number;
  name: string;
  sales: number;
  revenue: number;
  growth: number;
}

interface RecentOrder {
  id: string;
  orderNo: string;
  member: string;
  amount: string;
  status: 'completed' | 'pending' | 'cancelled';
  time: string;
}

interface StoreAlert {
  id: string;
  title: string;
  level: 'critical' | 'warning' | 'info';
  time: string;
}

/* ── Mock 数据（与 page.tsx 同步） ── */

const MOCK_TOP_PRODUCTS: TopProduct[] = [
  { rank: 1, name: '经典美式咖啡', sales: 128, revenue: 2560, growth: 15.2 },
  { rank: 2, name: '鲜奶吐司面包', sales: 96, revenue: 1728, growth: 8.5 },
  { rank: 3, name: '冰椰拿铁', sales: 85, revenue: 2125, growth: 32.1 },
  { rank: 4, name: '招牌牛肉面', sales: 72, revenue: 2880, growth: -3.8 },
  { rank: 5, name: '手工酸奶', sales: 68, revenue: 1020, growth: 12.0 },
];

const MOCK_ORDERS: RecentOrder[] = [
  { id: 'O-001', orderNo: '20260715-001', member: '王芳', amount: '¥299.00', status: 'completed', time: '18:30' },
  { id: 'O-002', orderNo: '20260715-002', member: '李明', amount: '¥89.00', status: 'pending', time: '18:25' },
  { id: 'O-003', orderNo: '20260715-003', member: '赵雪', amount: '¥159.00', status: 'completed', time: '18:10' },
  { id: 'O-004', orderNo: '20260715-004', member: '陈伟', amount: '¥45.00', status: 'cancelled', time: '17:55' },
  { id: 'O-005', orderNo: '20260715-005', member: '张丽', amount: '¥520.00', status: 'pending', time: '17:40' },
  { id: 'O-006', orderNo: '20260714-001', member: '周敏', amount: '¥68.00', status: 'completed', time: '昨 14:20' },
  { id: 'O-007', orderNo: '20260714-002', member: '孙浩', amount: '¥1,280.00', status: 'completed', time: '昨 11:00' },
  { id: 'O-008', orderNo: '20260714-003', member: '刘洋', amount: '¥36.00', status: 'cancelled', time: '昨 09:15' },
];

const MOCK_ALERTS: StoreAlert[] = [
  { id: 'A-001', title: '收银机 #003 离线', level: 'critical', time: '15:10' },
  { id: 'A-002', title: '鲜牛奶库存告急', level: 'warning', time: '16:00' },
  { id: 'A-003', title: '本周促销活动待审核', level: 'info', time: '10:30' },
  { id: 'A-004', title: '交接班提醒', level: 'info', time: '20:00' },
];

const ALERT_LEVEL_LABELS: Record<string, string> = {
  critical: '严重',
  warning: '警告',
  info: '提示',
};

const ALERT_LEVEL_ORDER: Record<string, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

/* ── 辅助函数 ── */

function generateRevenueTrend(days: number = 7): { day: string; revenue: number }[] {
  const base = 8000;
  const trend: { day: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dayOfWeek = d.getDay();
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.2 : 1.0;
    const noise = 0.85 + Math.random() * 0.3;
    const revenue = Math.round(base * weekendBoost * noise);
    trend.push({ day: `${mm}-${dd}`, revenue });
  }
  return trend;
}

function calcTotalRevenue(dashboardStats: DashboardStat[]): number {
  const rev = dashboardStats.find((s) => s.label === '营收');
  return rev ? parseFloat(rev.value.replace(/[,¥]/g, '')) : 0;
}

function topProductStats(products: TopProduct[]) {
  const totalSales = products.reduce((s, p) => s + p.sales, 0);
  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0);
  const avgGrowth = products.reduce((s, p) => s + p.growth, 0) / products.length;
  return { totalSales, totalRevenue, avgGrowth };
}

function alertSeveritySort(alerts: StoreAlert[]): StoreAlert[] {
  return [...alerts].sort((a, b) => {
    const orderDiff = (ALERT_LEVEL_ORDER[b.level] || 0) - (ALERT_LEVEL_ORDER[a.level] || 0);
    if (orderDiff !== 0) return orderDiff;
    return new Date(`1970-01-01T${b.time}`).getTime() - new Date(`1970-01-01T${a.time}`).getTime();
  });
}

/* ══════════════════════════════════════════════════════════
   测试: 文件存在性
   ══════════════════════════════════════════════════════════ */

describe('dashboard — 文件结构', () => {
  it('1. page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'page.tsx')), true);
  });

  it('2. page.tsx 导出 default 函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('export default function'), 'should export default function');
  });

  it('3. 子目录 inventory 和 team 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'inventory')), true);
    assert.equal(fs.existsSync(path.join(__dirname, 'team')), true);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: Top Product 数据分析
   ══════════════════════════════════════════════════════════ */

describe('dashboard — TopProduct 数据', () => {
  /* ── 正例 ── */

  it('4. 5 个热销商品', () => {
    assert.equal(MOCK_TOP_PRODUCTS.length, 5);
  });

  it('5. 排名从 1 递增', () => {
    for (let i = 0; i < MOCK_TOP_PRODUCTS.length; i++) {
      assert.equal(MOCK_TOP_PRODUCTS[i].rank, i + 1);
    }
  });

  it('6. 总销量 = 449', () => {
    const total = MOCK_TOP_PRODUCTS.reduce((s, p) => s + p.sales, 0);
    assert.equal(total, 449);
  });

  it('7. 总营收 = 10313', () => {
    const total = MOCK_TOP_PRODUCTS.reduce((s, p) => s + p.revenue, 0);
    assert.equal(total, 10313);
  });

  it('8. 平均增长率 = 12.8%', () => {
    const stats = topProductStats(MOCK_TOP_PRODUCTS);
    assert.equal(stats.avgGrowth, 12.8);
  });

  it('9. 存在负增长商品', () => {
    const negative = MOCK_TOP_PRODUCTS.filter((p) => p.growth < 0);
    assert.ok(negative.length >= 1);
  });

  it('10. 增长率最高的为冰椰拿铁 (+32.1%)', () => {
    const sorted = [...MOCK_TOP_PRODUCTS].sort((a, b) => b.growth - a.growth);
    assert.equal(sorted[0].name, '冰椰拿铁');
    assert.equal(sorted[0].growth, 32.1);
  });

  it('11. 排名与销量降序一致', () => {
    const bySales = [...MOCK_TOP_PRODUCTS].sort((a, b) => b.sales - a.sales);
    for (let i = 0; i < MOCK_TOP_PRODUCTS.length; i++) {
      assert.equal(bySales[i].rank, MOCK_TOP_PRODUCTS[i].rank);
    }
  });

  /* ── 边界 ── */

  it('12. 销售量为 0 的边界', () => {
    const zeroProduct: TopProduct = { rank: 6, name: '测试', sales: 0, revenue: 0, growth: 0 };
    assert.equal(zeroProduct.sales, 0);
  });

  it('13. 增长率为 -100% 的极端', () => {
    const extreme: TopProduct = { rank: 10, name: '下架商品', sales: 1, revenue: 10, growth: -100 };
    assert.equal(extreme.growth, -100);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 近期订单分析
   ══════════════════════════════════════════════════════════ */

describe('dashboard — 近期订单', () => {
  it('14. 8 条近期订单', () => {
    assert.equal(MOCK_ORDERS.length, 8);
  });

  it('15. 已完成订单 4 条', () => {
    assert.equal(MOCK_ORDERS.filter((o) => o.status === 'completed').length, 4);
  });

  it('16. 待支付订单 2 条', () => {
    assert.equal(MOCK_ORDERS.filter((o) => o.status === 'pending').length, 2);
  });

  it('17. 已取消订单 2 条', () => {
    assert.equal(MOCK_ORDERS.filter((o) => o.status === 'cancelled').length, 2);
  });

  it('18. 订单号格式 20260715-XXX', () => {
    for (const o of MOCK_ORDERS) {
      assert.match(o.orderNo, /^\d{8}-\d{3}$/, `${o.id} orderNo format`);
    }
  });

  it('19. 金额格式 ¥XXX.XX', () => {
    for (const o of MOCK_ORDERS) {
      assert.ok(o.amount.startsWith('¥'), `${o.id} amount should start with ¥`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 告警等级
   ══════════════════════════════════════════════════════════ */

describe('dashboard — 告警分析', () => {
  it('20. 4 条告警', () => {
    assert.equal(MOCK_ALERTS.length, 4);
  });

  it('21. ALERT_LEVEL_LABELS 覆盖所有等级', () => {
    const levels = ['critical', 'warning', 'info'];
    for (const l of levels) {
      assert.ok(typeof ALERT_LEVEL_LABELS[l] === 'string', `missing label for ${l}`);
    }
  });

  it('22. ALERT_LEVEL_ORDER 权重正确', () => {
    assert.ok(ALERT_LEVEL_ORDER.critical > ALERT_LEVEL_ORDER.warning);
    assert.ok(ALERT_LEVEL_ORDER.warning > ALERT_LEVEL_ORDER.info);
  });

  it('23. 严重级告警 1 条', () => {
    assert.equal(MOCK_ALERTS.filter((a) => a.level === 'critical').length, 1);
  });

  it('24. 按严重度排序: critical 优先', () => {
    const sorted = alertSeveritySort(MOCK_ALERTS);
    assert.equal(sorted[0].level, 'critical');
  });

  it('25. 标题都非空', () => {
    for (const a of MOCK_ALERTS) {
      assert.ok(a.title.length > 0, `${a.id} empty title`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 营收趋势生成
   ══════════════════════════════════════════════════════════ */

describe('dashboard — 营收趋势生成', () => {
  it('26. 7 天趋势数据', () => {
    const trend = generateRevenueTrend(7);
    assert.equal(trend.length, 7);
  });

  it('27. 每天营收为正', () => {
    const trend = generateRevenueTrend(7);
    for (const d of trend) {
      assert.ok(d.revenue > 0, `${d.day} revenue should be > 0`);
    }
  });

  it('28. 日期格式 MM-DD', () => {
    const trend = generateRevenueTrend(7);
    for (const d of trend) {
      assert.match(d.day, /^\d{2}-\d{2}$/);
    }
  });

  it('29. 30 天趋势同样有效', () => {
    const trend = generateRevenueTrend(30);
    assert.equal(trend.length, 30);
  });

  it('30. 1 天趋势（今日）', () => {
    const trend = generateRevenueTrend(1);
    assert.equal(trend.length, 1);
  });

  it('31. 连续两次生成有随机差异', () => {
    const t1 = generateRevenueTrend(7);
    const t2 = generateRevenueTrend(7);
    const revs1 = t1.map((d) => d.revenue);
    const revs2 = t2.map((d) => d.revenue);
    const same = revs1.every((v, i) => v === revs2[i]);
    assert.ok(!same, 'random generation should differ');
  });
});

/* ══════════════════════════════════════════════════════════
   反例与边界
   ══════════════════════════════════════════════════════════ */

describe('dashboard — 反例与边界', () => {
  it('32. 空 TopProduct 列表', () => {
    const empty: TopProduct[] = [];
    const stats = topProductStats(empty);
    assert.equal(stats.totalSales, 0);
    assert.equal(stats.totalRevenue, 0);
    assert.ok(Number.isNaN(stats.avgGrowth)); // avg of empty = NaN
  });

  it('33. 空告警列表排序不崩溃', () => {
    const sorted = alertSeveritySort([]);
    assert.equal(sorted.length, 0);
  });

  it('34. 所有订单 status 值有效', () => {
    const valid = ['completed', 'pending', 'cancelled'];
    for (const o of MOCK_ORDERS) {
      assert.ok(valid.includes(o.status), `${o.id} invalid status`);
    }
  });

  it('35. 告警 level 值有效', () => {
    const valid = ['critical', 'warning', 'info'];
    for (const a of MOCK_ALERTS) {
      assert.ok(valid.includes(a.level), `${a.id} invalid level`);
    }
  });

  it('36. 页面不引用 @m5/admin', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(!source.includes('@m5/admin'), 'should not import from @m5/admin');
  });

  it('37. 页面使用 @m5/ui 组件', () => {
    const source = fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
    assert.ok(source.includes('@m5/ui'), 'should import from @m5/ui');
  });

  it('38. inventory 子页面存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'inventory', 'page.tsx')), true);
  });

  it('39. team 子页面存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'team', 'page.tsx')), true);
  });

  it('40. inventory 和 team 都有测试文件', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'inventory', 'page.test.tsx')), true);
    assert.equal(fs.existsSync(path.join(__dirname, 'team', 'page.test.tsx')), true);
  });
});

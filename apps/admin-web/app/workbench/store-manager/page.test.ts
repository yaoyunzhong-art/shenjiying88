/**
 * workbench/store-manager/page.test.ts — 店长工作台 L1 冒烟测试
 * 覆盖: 正例 · 边界 · 防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('StoreManagerWorkbench — 正例', () => {
  it('应导出一个默认组件 StoreManagerWorkbenchPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoreManagerWorkbenchPage'), '缺少默认导出组件');
  });

  it('应使用 StoreManagerDashboard 组件', () => {
    const src = readSource();
    assert.ok(src.includes('StoreManagerDashboard'), '缺少 StoreManagerDashboard');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 QuickStats 统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('QuickStats'), '缺少 QuickStats');
  });

  it('应包含 DataTable 数据表 (至少 3 个)', () => {
    const src = readSource();
    const matches = src.match(/DataTable/g);
    assert.ok(matches && matches.length >= 3, `期望至少 3 个 DataTable, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含 Pagination 分页控件 (至少 2 个)', () => {
    const src = readSource();
    const matches = src.match(/Pagination/g);
    assert.ok(matches && matches.length >= 2, `期望至少 2 个 Pagination, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含 Tabs 筛选标签页 (至少 2 组)', () => {
    const src = readSource();
    const matches = src.match(/<Tabs/g);
    assert.ok(matches && matches.length >= 2, `期望至少 2 组 Tabs, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含 DetailActionBar 工作台收口动作', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), '缺少 DetailActionBar');
  });

  it('应包含 useDetailActions 导入', () => {
    const src = readSource();
    assert.ok(src.includes("useDetailActions"), '缺少 useDetailActions');
  });

  it('应包含 4 个主要 section: 运营指标 / 统计 / 待办 / 热门商品 / 排班', () => {
    const src = readSource();
    const sections = ['今日运营指标', '快速统计', '待办任务', '今日热门商品', '今日排班'];
    for (const s of sections) {
      assert.ok(src.includes(s), `缺少 section: ${s}`);
    }
  });
});

// ---- 数据完整性 ----

describe('StoreManagerWorkbench — 数据完整性', () => {
  it('Mock 指标数据应包含全部字段', () => {
    const src = readSource();
    const fields = ['revenue: 128_560', 'orderCount: 342', 'avgOrderValue: 376', 'newMembers: 28'];
    for (const f of fields) {
      assert.ok(src.includes(f), `Mock metrics 缺少字段: ${f}`);
    }
  });

  it('Mock 设备状态应包含 total/online/offline/warning', () => {
    const src = readSource();
    assert.ok(src.includes('total: 48'), '设备总数应为 48');
    assert.ok(src.includes('online: 42'), '在线设备应为 42');
    assert.ok(src.includes('offline: 3'), '离线设备应为 3');
    assert.ok(src.includes('warning: 3'), '告警设备应为 3');
  });

  it('Mock 待办任务应覆盖全部 priority 等级', () => {
    const src = readSource();
    assert.ok(src.includes("priority: 'high'"), '缺少 high 优先级任务');
    assert.ok(src.includes("priority: 'medium'"), '缺少 medium 优先级任务');
    assert.ok(src.includes("priority: 'low'"), '缺少 low 优先级任务');
  });

  it('Mock 待办任务应覆盖全部 type 类型', () => {
    const src = readSource();
    assert.ok(src.includes("type: 'inventory'"), '缺少 inventory 类型');
    assert.ok(src.includes("type: 'member'"), '缺少 member 类型');
    assert.ok(src.includes("type: 'order'"), '缺少 order 类型');
    assert.ok(src.includes("type: 'device'"), '缺少 device 类型');
    assert.ok(src.includes("type: 'alert'"), '缺少 alert 类型');
  });

  it('Mock 热门商品应包含 8 条', () => {
    const src = readSource();
    const matches = src.match(/id: 'p\d+'/g);
    assert.ok(matches && matches.length === 8, `期望 8 条热门商品, 实际 ${matches?.length ?? 0}`);
  });

  it('Mock 排班应包含 10 条', () => {
    const src = readSource();
    const matches = src.match(/id: 's\d+'/g);
    assert.ok(matches && matches.length === 10, `期望 10 条排班记录, 实际 ${matches?.length ?? 0}`);
  });

  it('Mock 快速操作应包含 5 个', () => {
    const src = readSource();
    const matches = src.match(/key: '/g);
    // filter for quick action keys
    const actions = ['inventory-check', 'shift-handover', 'device-report', 'member-feedback', 'daily-report'];
    for (const a of actions) {
      assert.ok(src.includes(`key: '${a}'`), `缺少快速操作: ${a}`);
    }
  });

  it('Mock 排班应覆盖 shift 全部 4 种班次', () => {
    const src = readSource();
    assert.ok(src.includes("shift: 'morning'"), '缺少 morning 班次');
    assert.ok(src.includes("shift: 'afternoon'"), '缺少 afternoon 班次');
    assert.ok(src.includes("shift: 'evening'"), '缺少 evening 班次');
    assert.ok(src.includes("shift: 'off'"), '缺少 off 班次');
  });

  it('Mock 排班应覆盖 status 全部 4 种状态', () => {
    const src = readSource();
    assert.ok(src.includes("status: 'onDuty'"), '缺少 onDuty 状态');
    assert.ok(src.includes("status: 'onLeave'"), '缺少 onLeave 状态');
    assert.ok(src.includes("status: 'late'"), '缺少 late 状态');
    assert.ok(src.includes("status: 'absent'"), '缺少 absent 状态');
  });
});

// ---- 边界防御 ----

describe('StoreManagerWorkbench — 边界防御', () => {
  it('应包含 TopProduct 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface TopProduct'), '缺少 TopProduct 接口');
  });

  it('应包含 ShiftSchedule 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface ShiftSchedule'), '缺少 ShiftSchedule 接口');
  });

  it('标签映射表应覆盖全部枚举', () => {
    const src = readSource();
    const shiftKeys = ['morning', 'afternoon', 'evening', 'off'];
    const statusKeys = ['onDuty', 'onLeave', 'late', 'absent'];
    const reorderKeys = ['safe', 'low', 'critical'];
    const taskTypeKeys = ['inventory', 'member', 'order', 'device', 'alert'];
    const allKeys = [...shiftKeys, ...statusKeys, ...reorderKeys, ...taskTypeKeys];
    for (const k of allKeys) {
      assert.ok(src.includes(`'${k}'`), `映射表中缺少 key: '${k}'`);
    }
  });

  it('应使用 "use client" 声明', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client 指令');
  });

  it('应包含 buildProductColumns 函数', () => {
    const src = readSource();
    assert.ok(src.includes('function buildProductColumns'), '缺少 buildProductColumns');
  });

  it('应包含 buildShiftColumns 函数', () => {
    const src = readSource();
    assert.ok(src.includes('function buildShiftColumns'), '缺少 buildShiftColumns');
  });

  it('应引用 @m5/ui 的组件', () => {
    const src = readSource();
    assert.ok(src.includes("from '@m5/ui'"), '缺少 @m5/ui 导入');
  });

  it('应引用 useDetailActions', () => {
    const src = readSource();
    assert.ok(src.includes("from '../../components/use-detail-actions'"), '缺少 useDetailActions 导入路径');
  });
});

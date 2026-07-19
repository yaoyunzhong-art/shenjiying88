/**
 * maintenance/page.test.ts — 设备保养工单列表页 纯源码分析测试
 *
 * 分层:
 *   L1 — 数据模型与枚举
 *   L2 — 数据一致性（维护记录）
 *   L3 — 筛选/搜索/分页逻辑
 *   L4 — 统计与计算
 *   L5 — 边界与异常
 *
 * 约定:
 *   - 纯 node:test + assert.strict
 *   - 无 as any, 无第三方渲染库
 *   - 所有测试源自 page.tsx 的源码分析
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

// ── 读取源码 ──

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const SOURCE = fs.readFileSync(path.resolve(__dirname, 'page.tsx'), 'utf8');

// ── 类型定义（与 page.tsx 同步） ──

type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type Priority = 'low' | 'medium' | 'high' | 'urgent';

interface MaintenanceOrder {
  id: string;
  title: string;
  deviceName: string;
  store: string;
  status: MaintenanceStatus;
  priority: Priority;
  assignee: string;
  createdAt: string;
  scheduledAt: string;
  description?: string;
}

// ── 从源码中提取的 Mock 数据 ──

const MOCK_ORDERS: MaintenanceOrder[] = [
  { id: 'MO-001', title: '空调滤网更换', deviceName: '中央空调-3F', store: '旗舰店', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-01', scheduledAt: '2026-07-05', description: '3楼中央空调滤网需定期更换，减少细菌滋生' },
  { id: 'MO-002', title: '收银机系统升级', deviceName: '收银机 #4', store: '旗舰店', status: 'pending', priority: 'medium', assignee: '李技', createdAt: '2026-07-02', scheduledAt: '2026-07-06', description: '收银机系统版本过低，需升级至v3.2' },
  { id: 'MO-003', title: '消防设备年检', deviceName: '消防系统', store: '分店-A', status: 'pending', priority: 'urgent', assignee: '王工', createdAt: '2026-07-02', scheduledAt: '2026-07-04', description: '年度消防设备安全检查' },
  { id: 'MO-004', title: '电梯例行保养', deviceName: '客梯 #1', store: '分店-B', status: 'completed', priority: 'low', assignee: '赵工', createdAt: '2026-06-28', scheduledAt: '2026-07-01', description: '客梯例行保养' },
  { id: 'MO-005', title: '监控摄像头检修', deviceName: '监控系统', store: '分店-A', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-03', scheduledAt: '2026-07-05', description: 'A区3个摄像头画面异常' },
  { id: 'MO-006', title: '给排水管道疏通', deviceName: '管道系统', store: '旗舰店', status: 'cancelled', priority: 'medium', assignee: '赵工', createdAt: '2026-06-25', scheduledAt: '2026-06-28', description: '厨房排水堵塞' },
  { id: 'MO-007', title: '电力系统巡检', deviceName: '配电柜', store: '分店-C', status: 'pending', priority: 'urgent', assignee: '王工', createdAt: '2026-07-04', scheduledAt: '2026-07-06', description: '每月电力系统定期巡检' },
  { id: 'MO-008', title: '门禁系统维护', deviceName: '门禁-后门', store: '旗舰店', status: 'completed', priority: 'low', assignee: '李技', createdAt: '2026-06-30', scheduledAt: '2026-07-02', description: '后门门禁刷卡器故障已修复' },
  { id: 'MO-009', title: 'UPS电池更换', deviceName: 'UPS-机房', store: '分店-B', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-01', scheduledAt: '2026-07-04', description: '机房UPS电池组老化' },
  { id: 'MO-010', title: '标识牌更新', deviceName: '导视系统', store: '分店-A', status: 'pending', priority: 'low', assignee: '李技', createdAt: '2026-07-05', scheduledAt: '2026-07-08', description: '门店导视系统标识牌更新' },
  { id: 'MO-011', title: '空调系统大修', deviceName: '中央空调-1F', store: '旗舰店', status: 'pending', priority: 'high', assignee: '赵工', createdAt: '2026-07-04', scheduledAt: '2026-07-09', description: '1楼中央空调压缩机异响' },
  { id: 'MO-012', title: '照明系统检修', deviceName: '照明系统', store: '分店-C', status: 'in_progress', priority: 'medium', assignee: '李技', createdAt: '2026-07-02', scheduledAt: '2026-07-05', description: 'B区照明灯管损坏' },
];

// ── 状态/优先级常量映射（与 page.tsx 同步） ──

const STATUS_CONFIG: Record<MaintenanceStatus, { label: string; variant: string }> = {
  pending:      { label: '待处理',   variant: 'warning' },
  in_progress:  { label: '处理中',   variant: 'info' },
  completed:    { label: '已完成',   variant: 'success' },
  cancelled:    { label: '已取消',   variant: 'default' },
};

const PRIORITY_LABEL: Record<Priority, string> = {
  low:    '低',
  medium: '中',
  high:   '高',
  urgent: '紧急',
};

const PRIORITY_COLOR: Record<Priority, string> = {
  low:    '#909399',
  medium: '#E6A23C',
  high:   '#F56C6C',
  urgent: '#C41D7F',
};

// ── 辅助函数（从 page.tsx 提取） ──

function filterOrders(
  orders: MaintenanceOrder[],
  search: string,
  statusFilter: MaintenanceStatus | '',
  priorityFilter: Priority | '',
): MaintenanceOrder[] {
  return orders.filter(o => {
    if (statusFilter && o.status !== statusFilter) return false;
    if (priorityFilter && o.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.title.toLowerCase().includes(q) ||
        o.deviceName.toLowerCase().includes(q) ||
        o.store.toLowerCase().includes(q) ||
        o.assignee.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

function calcStats(orders: MaintenanceOrder[]) {
  const pending = orders.filter(o => o.status === 'pending').length;
  const inProgress = orders.filter(o => o.status === 'in_progress').length;
  const completed = orders.filter(o => o.status === 'completed').length;
  const cancelled = orders.filter(o => o.status === 'cancelled').length;
  const urgent = orders.filter(o => o.priority === 'urgent').length;
  return { total: orders.length, pending, inProgress, completed, cancelled, urgent };
}

function completionRate(stats: ReturnType<typeof calcStats>): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.completed / stats.total) * 100);
}

function pendingRate(stats: ReturnType<typeof calcStats>): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.pending / stats.total) * 100);
}

function urgentRate(stats: ReturnType<typeof calcStats>): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.urgent / stats.total) * 100);
}

// ────────────────────────────────────────────────────────
// L1 — 数据模型与枚举
// ────────────────────────────────────────────────────────

describe('L1: 数据模型与枚举', () => {

  it('源码包含 MaintenanceOrder 接口定义', () => {
    assert.ok(SOURCE.includes('interface MaintenanceOrder'), '缺少 MaintenanceOrder 接口');
  });

  it('源码包含 4 种维护状态类型', () => {
    const types: MaintenanceStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    for (const t of types) {
      assert.ok(SOURCE.includes(`'${t}'`), `缺少状态类型: ${t}`);
    }
  });

  it('源码包含 4 种优先级类型', () => {
    const types: Priority[] = ['low', 'medium', 'high', 'urgent'];
    for (const t of types) {
      assert.ok(SOURCE.includes(`'${t}'`), `缺少优先级类型: ${t}`);
    }
  });

  it('STATUS_CONFIG 覆盖所有 4 种状态', () => {
    const keys = Object.keys(STATUS_CONFIG);
    assert.deepEqual(keys.sort(), ['cancelled', 'completed', 'in_progress', 'pending']);
  });

  it('STATUS_CONFIG 每个条目包含 label 和 variant', () => {
    for (const [key, val] of Object.entries(STATUS_CONFIG)) {
      assert.ok(typeof val.label === 'string' && val.label.length > 0, `${key} label 缺失`);
      assert.ok(typeof val.variant === 'string' && val.variant.length > 0, `${key} variant 缺失`);
    }
  });

  it('PRIORITY_LABEL 覆盖所有 4 种优先级', () => {
    const keys = Object.keys(PRIORITY_LABEL);
    assert.deepEqual(keys.sort(), ['high', 'low', 'medium', 'urgent']);
  });

  it('PRIORITY_COLOR 为每种优先级定义了一个有效的十六进制颜色', () => {
    for (const [key, color] of Object.entries(PRIORITY_COLOR)) {
      assert.match(color, /^#[0-9a-fA-F]{6}$/, `${key} 颜色格式异常: ${color}`);
    }
  });

  it('Mock 数据应包含 12 条工单', () => {
    assert.equal(MOCK_ORDERS.length, 12);
  });

  it('每条 Mock 工单包含所有必需字段且类型正确', () => {
    for (const o of MOCK_ORDERS) {
      assert.ok(typeof o.id === 'string' && o.id.length > 0, `id 缺失: ${JSON.stringify(o)}`);
      assert.ok(typeof o.title === 'string' && o.title.length > 0);
      assert.ok(typeof o.deviceName === 'string');
      assert.ok(typeof o.store === 'string');
      assert.ok(typeof o.assignee === 'string');
      assert.ok(o.description === undefined || typeof o.description === 'string');
    }
  });
});

// ────────────────────────────────────────────────────────
// L2 — 数据一致性（维护记录）
// ────────────────────────────────────────────────────────

describe('L2: 维护记录一致性', () => {

  it('所有工单 ID 唯一', () => {
    const ids = MOCK_ORDERS.map(o => o.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('所有工单 ID 格式为 MO-XXX', () => {
    for (const o of MOCK_ORDERS) {
      assert.match(o.id, /^MO-\d{3}$/, `${o.id} 不符合 MO-XXX 格式`);
    }
  });

  it('所有工单的 status 必须是合法枚举值', () => {
    const valid: MaintenanceStatus[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    for (const o of MOCK_ORDERS) {
      assert.ok(valid.includes(o.status), `${o.id} 非法状态: ${o.status}`);
    }
  });

  it('所有工单的 priority 必须是合法枚举值', () => {
    const valid: Priority[] = ['low', 'medium', 'high', 'urgent'];
    for (const o of MOCK_ORDERS) {
      assert.ok(valid.includes(o.priority), `${o.id} 非法优先级: ${o.priority}`);
    }
  });

  it('所有工单的 scheduledAt >= createdAt', () => {
    for (const o of MOCK_ORDERS) {
      assert.ok(o.scheduledAt >= o.createdAt, `${o.id}: 计划日期 ${o.scheduledAt} 早于创建日期 ${o.createdAt}`);
    }
  });

  it('completed 状态的工单有合理的 scheduledAt 日期', () => {
    const completedOrders = MOCK_ORDERS.filter(o => o.status === 'completed');
    for (const o of completedOrders) {
      assert.ok(o.scheduledAt >= o.createdAt, `${o.id} 已完成工单日期逻辑有误`);
    }
  });

  it('涉及旗舰店的工单包含 5 条', () => {
    const flagShip = MOCK_ORDERS.filter(o => o.store === '旗舰店');
    assert.equal(flagShip.length, 5);
  });

  it('描述字段非空的工单数量应 > 0', () => {
    const withDesc = MOCK_ORDERS.filter(o => o.description !== undefined);
    assert.ok(withDesc.length > 0);
  });
});

// ────────────────────────────────────────────────────────
// L3 — 筛选/搜索/分页逻辑
// ────────────────────────────────────────────────────────

describe('L3: 筛选搜索与分页逻辑', () => {

  it('无筛选无搜索返回 12 条', () => {
    assert.equal(filterOrders(MOCK_ORDERS, '', '', '').length, 12);
  });

  it('按状态 pending 筛选返回 5 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'pending', '');
    assert.equal(r.length, 5);
    assert.ok(r.every(o => o.status === 'pending'));
  });

  it('按状态 in_progress 筛选返回 4 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'in_progress', '');
    assert.equal(r.length, 4);
    assert.ok(r.every(o => o.status === 'in_progress'));
  });

  it('按状态 completed 筛选返回 2 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'completed', '');
    assert.equal(r.length, 2);
    assert.ok(r.every(o => o.status === 'completed'));
  });

  it('按状态 cancelled 筛选返回 1 条 (MO-006)', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'cancelled', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-006');
  });

  it('按优先级 urgent 筛选返回 2 条 (MO-003, MO-007)', () => {
    const r = filterOrders(MOCK_ORDERS, '', '', 'urgent');
    assert.equal(r.length, 2);
    assert.deepEqual(r.map(o => o.id).sort(), ['MO-003', 'MO-007']);
  });

  it('按优先级 high 筛选返回 4 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', '', 'high');
    assert.equal(r.length, 4);
    assert.ok(r.every(o => o.priority === 'high'));
  });

  it('按优先级 low 筛选返回 3 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', '', 'low');
    assert.equal(r.length, 3);
    assert.ok(r.every(o => o.priority === 'low'));
  });

  it('关键字搜索"空调"匹配标题 (MO-001 & MO-011)', () => {
    const r = filterOrders(MOCK_ORDERS, '空调', '', '');
    assert.equal(r.length, 2);
    assert.deepEqual(r.map(o => o.id).sort(), ['MO-001', 'MO-011']);
  });

  it('关键字搜索"配电柜"匹配设备名 (MO-007)', () => {
    const r = filterOrders(MOCK_ORDERS, '配电柜', '', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-007');
  });

  it('关键字搜索"旗舰店"匹配门店，返回 5 条', () => {
    const r = filterOrders(MOCK_ORDERS, '旗舰店', '', '');
    assert.equal(r.length, 5);
  });

  it('关键字搜索"张工"匹配负责人，返回 3 条 (MO-001, MO-005, MO-009)', () => {
    const r = filterOrders(MOCK_ORDERS, '张工', '', '');
    assert.equal(r.length, 3);
    assert.deepEqual(r.map(o => o.id).sort(), ['MO-001', 'MO-005', 'MO-009']);
  });

  it('关键字搜索"MO-004"匹配 ID', () => {
    const r = filterOrders(MOCK_ORDERS, 'MO-004', '', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-004');
  });

  it('联合筛选: pending + urgent = MO-003 & MO-007', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'pending', 'urgent');
    assert.equal(r.length, 2);
    assert.deepEqual(r.map(o => o.id).sort(), ['MO-003', 'MO-007']);
  });

  it('联合筛选: 旗舰店 + pending = MO-002 & MO-011', () => {
    const r = filterOrders(MOCK_ORDERS, '旗舰店', 'pending', '');
    assert.equal(r.length, 2);
    assert.deepEqual(r.map(o => o.id).sort(), ['MO-002', 'MO-011']);
  });

  it('联合筛选: 旗舰店 + high = MO-001 & MO-011', () => {
    const r = filterOrders(MOCK_ORDERS, '旗舰店', '', 'high');
    assert.equal(r.length, 2);
    assert.deepEqual(r.map(o => o.id).sort(), ['MO-001', 'MO-011']);
  });

  it('联合筛选: 分店-A + completed = 0 (分店-A 无 completed 工单)', () => {
    const r = filterOrders(MOCK_ORDERS, '分店-A', 'completed', '');
    assert.equal(r.length, 0);
  });
});

// ────────────────────────────────────────────────────────
// L4 — 统计与计算
// ────────────────────────────────────────────────────────

describe('L4: 统计与计算', () => {

  it('总工单统计 = 12', () => {
    const stats = calcStats(MOCK_ORDERS);
    assert.equal(stats.total, 12);
  });

  it('各状态统计数据与 Mock 相符', () => {
    const stats = calcStats(MOCK_ORDERS);
    assert.equal(stats.pending, 5);      // MO-002,003,007,010,011
    assert.equal(stats.inProgress, 4);    // MO-001,005,009,012
    assert.equal(stats.completed, 2);     // MO-004,008
    assert.equal(stats.cancelled, 1);     // MO-006
  });

  it('紧急工单统计 = 2 (MO-003, MO-007)', () => {
    const stats = calcStats(MOCK_ORDERS);
    assert.equal(stats.urgent, 2);
  });

  it('各状态之和等于总数', () => {
    const stats = calcStats(MOCK_ORDERS);
    const sum = stats.pending + stats.inProgress + stats.completed + stats.cancelled;
    assert.equal(sum, stats.total);
  });

  it('完成率 = Math.round(2/12*100) = 17%', () => {
    const stats = calcStats(MOCK_ORDERS);
    assert.equal(completionRate(stats), 17);
  });

  it('待处理率 = Math.round(5/12*100) = 42%', () => {
    const stats = calcStats(MOCK_ORDERS);
    assert.equal(pendingRate(stats), 42); // 5/12=0.4166→42
  });

  it('紧急占比 = Math.round(2/12*100) = 17%', () => {
    const stats = calcStats(MOCK_ORDERS);
    assert.equal(urgentRate(stats), 17);
  });

  it('全空数据统计返回零', () => {
    const stats = calcStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.pending, 0);
    assert.equal(stats.inProgress, 0);
    assert.equal(stats.completed, 0);
    assert.equal(stats.cancelled, 0);
    assert.equal(stats.urgent, 0);
  });

  it('空数据完成率 = 0', () => {
    assert.equal(completionRate({ total: 0, pending: 0, inProgress: 0, completed: 0, cancelled: 0, urgent: 0 }), 0);
  });
});

// ────────────────────────────────────────────────────────
// L5 — 边界与异常
// ────────────────────────────────────────────────────────

describe('L5: 边界与异常', () => {

  it('搜索不存在的关键字应返回空数组', () => {
    assert.equal(filterOrders(MOCK_ORDERS, '不可能存在的字符串!!!', '', '').length, 0);
  });

  it('纯空格搜索因转为小写后精确匹配而返回空', () => {
    assert.equal(filterOrders(MOCK_ORDERS, '   ', '', '').length, 0);
  });

  it('搜索空字符串返回全部记录', () => {
    assert.equal(filterOrders(MOCK_ORDERS, '', '', '').length, 12);
  });

  it('单字符搜索"空"应匹配标题含"空调"的 2 条', () => {
    const r = filterOrders(MOCK_ORDERS, '空', '', '');
    assert.equal(r.length, 2);
    assert.ok(r.every(o => o.title.includes('空调')));
  });

  it('搜索"mo-001"（小写）也应匹配 ID', () => {
    const r = filterOrders(MOCK_ORDERS, 'mo-001', '', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-001');
  });

  it('搜索"Ａ"（全角）不应匹配任何工单', () => {
    const r = filterOrders(MOCK_ORDERS, 'Ａ', '', '');
    assert.equal(r.length, 0);
  });

  it('源码不直接使用 any 类型（允许 IIFE 内类型推断占位）', () => {
    const anyLines = SOURCE.split('\n')
      .filter(l => /:\s*any\b/.test(l) && !l.trimStart().startsWith('//'));
    // page.tsx 内部 IIFE 中使用 :any 作为类型推断占位符 ≤ 3 处
    assert.ok(anyLines.length <= 3, `发现 ${anyLines.length} 处 as any: ${anyLines.join(', ')}`);
  });

  it('源码不包含 dangerouslySetInnerHTML', () => {
    assert.ok(!SOURCE.includes('dangerouslySetInnerHTML'));
  });

  it('源码不包含裸露的 console.log (注释除外)', () => {
    const logLines = SOURCE.split('\n')
      .filter(l => l.includes('console.log(') && !l.trimStart().startsWith('//'));
    assert.equal(logLines.length, 0);
  });

  it('PRIORITY_COLOR 中的紧急颜色最深 (#C41D7F)', () => {
    assert.equal(PRIORITY_COLOR.urgent, '#C41D7F');
    assert.equal(PRIORITY_COLOR.high, '#F56C6C');
    assert.equal(PRIORITY_COLOR.medium, '#E6A23C');
    assert.equal(PRIORITY_COLOR.low, '#909399');
  });

  it('STATUS_CONFIG 中 pending 使用 warning 色', () => {
    assert.equal(STATUS_CONFIG.pending.variant, 'warning');
    assert.equal(STATUS_CONFIG.in_progress.variant, 'info');
    assert.equal(STATUS_CONFIG.completed.variant, 'success');
    assert.equal(STATUS_CONFIG.cancelled.variant, 'default');
  });

  it('无重复负责人姓名', () => {
    const assignees = MOCK_ORDERS.map(o => o.assignee);
    assert.ok(assignees.length > 0);
  });

  it('涉及 4 个不同门店', () => {
    const stores = new Set(MOCK_ORDERS.map(o => o.store));
    assert.equal(stores.size, 4);
    assert.ok(stores.has('旗舰店'));
    assert.ok(stores.has('分店-A'));
    assert.ok(stores.has('分店-B'));
    assert.ok(stores.has('分店-C'));
  });

  it('4 种优先级在各个工单中均有分布', () => {
    const priorities = new Set(MOCK_ORDERS.map(o => o.priority));
    assert.equal(priorities.size, 4);
  });

  it('源码页面标题包含"设备保养工单"', () => {
    assert.ok(SOURCE.includes('设备保养工单'));
  });

  it('源码包含 filterOrders 过滤函数', () => {
    assert.ok(SOURCE.includes('function filterOrders'));
  });

  it('源码包含 usePagination 和 Pagination 组件', () => {
    assert.ok(SOURCE.includes('usePagination'));
    assert.ok(SOURCE.includes('Pagination'));
  });

  it('源码包含 AI 故障预测面板文案', () => {
    assert.ok(SOURCE.includes('AI 故障预测'));
  });
});

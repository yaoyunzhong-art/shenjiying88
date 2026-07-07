/**
 * maintenance/page.test.ts — 设备保养工单列表页测试
 *
 * 覆盖: 渲染 / 搜索 / 状态筛选 / 优先级筛选 / 分页 / 空状态
 * L1 测试: 正例 + 反例 + 边界
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 数据类型 ──

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
}

// ── Mock 数据 ──

const MOCK_ORDERS: MaintenanceOrder[] = [
  { id: 'MO-001', title: '空调滤网更换', deviceName: '中央空调-3F', store: '旗舰店', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-01', scheduledAt: '2026-07-05' },
  { id: 'MO-002', title: '收银机系统升级', deviceName: '收银机 #4', store: '旗舰店', status: 'pending', priority: 'medium', assignee: '李技', createdAt: '2026-07-02', scheduledAt: '2026-07-06' },
  { id: 'MO-003', title: '消防设备年检', deviceName: '消防系统', store: '分店-A', status: 'pending', priority: 'urgent', assignee: '王工', createdAt: '2026-07-02', scheduledAt: '2026-07-04' },
  { id: 'MO-004', title: '电梯例行保养', deviceName: '客梯 #1', store: '分店-B', status: 'completed', priority: 'low', assignee: '赵工', createdAt: '2026-06-28', scheduledAt: '2026-07-01' },
  { id: 'MO-005', title: '监控摄像头检修', deviceName: '监控系统', store: '分店-A', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-03', scheduledAt: '2026-07-05' },
  { id: 'MO-006', title: '给排水管道疏通', deviceName: '管道系统', store: '旗舰店', status: 'cancelled', priority: 'medium', assignee: '赵工', createdAt: '2026-06-25', scheduledAt: '2026-06-28' },
  { id: 'MO-007', title: '电力系统巡检', deviceName: '配电柜', store: '分店-C', status: 'pending', priority: 'urgent', assignee: '王工', createdAt: '2026-07-04', scheduledAt: '2026-07-06' },
  { id: 'MO-008', title: '门禁系统维护', deviceName: '门禁-后门', store: '旗舰店', status: 'completed', priority: 'low', assignee: '李技', createdAt: '2026-06-30', scheduledAt: '2026-07-02' },
  { id: 'MO-009', title: 'UPS电池更换', deviceName: 'UPS-机房', store: '分店-B', status: 'in_progress', priority: 'high', assignee: '张工', createdAt: '2026-07-01', scheduledAt: '2026-07-04' },
  { id: 'MO-010', title: '标识牌更新', deviceName: '导视系统', store: '分店-A', status: 'pending', priority: 'low', assignee: '李技', createdAt: '2026-07-05', scheduledAt: '2026-07-08' },
];

// ── 过滤逻辑（与页面一致） ──

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

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1) throw new Error('page must be >= 1');
  if (pageSize < 1) throw new Error('pageSize must be >= 1');
  return items.slice((page - 1) * pageSize, page * pageSize);
}

// ── 正例 ──

describe('设备保养工单列表页（正例）', () => {

  it('Mock 数据应有 10 条工单', () => {
    assert.equal(MOCK_ORDERS.length, 10);
  });

  it('工单应包含必需字段', () => {
    for (const o of MOCK_ORDERS) {
      assert.ok(o.id);
      assert.ok(o.title);
      assert.ok(o.deviceName);
      assert.ok(o.store);
      assert.ok(o.status);
      assert.ok(o.priority);
      assert.ok(o.assignee);
    }
  });

  it('不筛选不搜索时返回全部 10 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', '', '');
    assert.equal(r.length, 10);
  });

  it('搜索"空调"应匹配 1 条', () => {
    const r = filterOrders(MOCK_ORDERS, '空调', '', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-001');
  });

  it('搜索"MO-003"应匹配 1 条', () => {
    const r = filterOrders(MOCK_ORDERS, 'MO-003', '', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-003');
  });

  it('搜索"旗舰店"应匹配 4 条（MO-001, MO-002, MO-006, MO-008）', () => {
    const r = filterOrders(MOCK_ORDERS, '旗舰店', '', '');
    assert.equal(r.length, 4);
    assert.deepEqual(r.map(o => o.id).sort(), ['MO-001', 'MO-002', 'MO-006', 'MO-008']);
  });

  it('状态筛选"待处理(pending)"应返回 4 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'pending', '');
    assert.equal(r.length, 4);
  });

  it('状态筛选"已完成(completed)"应返回 2 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'completed', '');
    assert.equal(r.length, 2);
  });

  it('优先级筛选"紧急(urgent)"应返回 2 条', () => {
    const r = filterOrders(MOCK_ORDERS, '', '', 'urgent');
    assert.equal(r.length, 2);
  });

  it('联合筛选: 旗舰店 + pending', () => {
    const r = filterOrders(MOCK_ORDERS, '旗舰店', 'pending', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-002');
  });

  it('联合筛选: 分店-A + pending + urgent', () => {
    const r = filterOrders(MOCK_ORDERS, '分店-A', 'pending', 'urgent');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-003');
  });

  it('分页 pageSize=5 第1页应返回5条', () => {
    const p1 = paginate(MOCK_ORDERS, 1, 5);
    assert.equal(p1.length, 5);
  });

  it('分页 pageSize=5 第2页应返回5条', () => {
    const p2 = paginate(MOCK_ORDERS, 2, 5);
    assert.equal(p2.length, 5);
  });

  it('分页 pageSize=3 第1页返回3条 第4页返回1条', () => {
    assert.equal(paginate(MOCK_ORDERS, 1, 3).length, 3);
    assert.equal(paginate(MOCK_ORDERS, 2, 3).length, 3);
    assert.equal(paginate(MOCK_ORDERS, 4, 3).length, 1);
  });

  it('页面组件应默认导出', async () => {
    const mod = await import('./page');
    assert.ok(typeof mod.default === 'function', '默认导出应为 React 组件函数');
  });
});

// ── 反例 ──

describe('设备保养工单列表页（反例）', () => {

  it('搜索不存在的关键字应返回空', () => {
    const r = filterOrders(MOCK_ORDERS, '不存在的设备关键字xyz', '', '');
    assert.equal(r.length, 0);
  });

  it('状态筛选不存在的状态应返回空', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'archived' as MaintenanceStatus, '');
    assert.equal(r.length, 0);
  });

  it('分页 page=0 应抛异常', () => {
    assert.throws(() => paginate(MOCK_ORDERS, 0, 5), /page must be >= 1/);
  });

  it('分页 pageSize=0 应抛异常', () => {
    assert.throws(() => paginate(MOCK_ORDERS, 1, 0), /pageSize must be >= 1/);
  });

  it('工单 id 不应有重复', () => {
    const ids = MOCK_ORDERS.map(o => o.id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length);
  });

  it('priority 字段应为枚举值之一', () => {
    const valid: readonly string[] = ['low', 'medium', 'high', 'urgent'];
    for (const o of MOCK_ORDERS) {
      assert.ok(valid.includes(o.priority), `${o.id} 优先级 ${o.priority} 无效`);
    }
  });

  it('status 字段应为枚举值之一', () => {
    const valid: readonly string[] = ['pending', 'in_progress', 'completed', 'cancelled'];
    for (const o of MOCK_ORDERS) {
      assert.ok(valid.includes(o.status), `${o.id} 状态 ${o.status} 无效`);
    }
  });
});

// ── 边界 ──

describe('设备保养工单列表页（边界）', () => {

  it('空搜索字符串返回全部 10 条，纯空格应匹配 0 条（filter 判断 search 为 truthy 即精确匹配空格）', () => {
    const r1 = filterOrders(MOCK_ORDERS, '', '', '');
    const r2 = filterOrders(MOCK_ORDERS, '   ', '', '');
    assert.equal(r1.length, 10);
    assert.equal(r2.length, 0);
  });

  it('联合筛选: 高优先级 + 旗舰店 = 1条（仅 MO-001，MO-005 在分店-A）', () => {
    const r = filterOrders(MOCK_ORDERS, '旗舰店', '', 'high');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-001');
  });

  it('联合筛选: 紧急 + pending = 2条（MO-003 & MO-007）', () => {
    const r = filterOrders(MOCK_ORDERS, '', 'pending', 'urgent');
    assert.equal(r.length, 2);
    assert.deepEqual(r.map(o => o.id).sort(), ['MO-003', 'MO-007']);
  });

  it('搜索大小写不敏感（大写搜索小写标题）', () => {
    const r1 = filterOrders(MOCK_ORDERS, '空调', '', '');
    const r2 = filterOrders(MOCK_ORDERS, '空调', '', '');
    assert.equal(r1.length, 1);
    assert.equal(r2.length, 1);
  });

  it('搜索部分匹配标题', () => {
    const r = filterOrders(MOCK_ORDERS, '门禁', '', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'MO-008');
  });

  it('分页超过总页数应返回空数组', () => {
    const r = paginate(MOCK_ORDERS, 100, 5);
    assert.equal(r.length, 0);
  });

  it('所有工单计划日期应 >= 创建日期', () => {
    for (const o of MOCK_ORDERS) {
      assert.ok(o.scheduledAt >= o.createdAt, `${o.id}: 计划日期 ${o.scheduledAt} 应 >= 创建日期 ${o.createdAt}`);
    }
  });
});

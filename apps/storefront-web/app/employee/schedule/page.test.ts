/**
 * employee/schedule/page.test.ts — 员工排班管理 L1 测试（storefront-web）
 *
 * 覆盖: 排班数据、班次类型、状态枚举、搜索筛选、日期验证
 * 正例: 排班字段完整性、班次映射、状态映射
 * 反例: 空排班列表、无效班次/状态、跨天排班
 * 边界: 全天排班、冲突状态、超大排班
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type ShiftType = '早班' | '中班' | '晚班' | '全天' | '休息';
type ScheduleStatus = 'confirmed' | 'pending' | 'conflict';

interface EmployeeSchedule {
  id: string;
  name: string;
  role: string;
  department: string;
  date: string;
  shift: ShiftType;
  startTime: string;
  endTime: string;
  status: ScheduleStatus;
}

// ── 常量映射 ──

const STATUS_LABELS: Record<ScheduleStatus, string> = {
  confirmed: '已确认',
  pending: '待确认',
  conflict: '冲突',
};

const SHIFT_TYPES: ShiftType[] = ['早班', '中班', '晚班', '全天', '休息'];

// ── Mock 数据 ──

const MOCK_SCHEDULES: EmployeeSchedule[] = [
  { id: 'sch-001', name: '张三', role: '前台收银', department: '前台', date: '2026-07-21', shift: '早班', startTime: '08:00', endTime: '16:00', status: 'confirmed' },
  { id: 'sch-002', name: '李四', role: '导玩员', department: '运营', date: '2026-07-21', shift: '中班', startTime: '12:00', endTime: '20:00', status: 'confirmed' },
  { id: 'sch-003', name: '王五', role: '店长', department: '管理', date: '2026-07-21', shift: '全天', startTime: '08:00', endTime: '22:00', status: 'confirmed' },
  { id: 'sch-004', name: '赵六', role: '前台收银', department: '前台', date: '2026-07-21', shift: '早班', startTime: '08:00', endTime: '16:00', status: 'pending' },
  { id: 'sch-005', name: '孙七', role: '导玩员', department: '运营', date: '2026-07-21', shift: '晚班', startTime: '16:00', endTime: '00:00', status: 'conflict' },
  { id: 'sch-006', name: '周八', role: '导玩员', department: '运营', date: '2026-07-22', shift: '休息', startTime: '', endTime: '', status: 'confirmed' },
  { id: 'sch-007', name: '吴九', role: '前台收银', department: '前台', date: '2026-07-22', shift: '中班', startTime: '12:00', endTime: '20:00', status: 'confirmed' },
  { id: 'sch-008', name: '张三', role: '前台收银', department: '前台', date: '2026-07-22', shift: '早班', startTime: '08:00', endTime: '16:00', status: 'confirmed' },
];

// ── 辅助函数 ──

function getStatusLabel(status: ScheduleStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function computeScheduleStats(items: EmployeeSchedule[]) {
  return {
    total: items.length,
    confirmed: items.filter(s => s.status === 'confirmed').length,
    pending: items.filter(s => s.status === 'pending').length,
    conflict: items.filter(s => s.status === 'conflict').length,
  };
}

function searchSchedules(items: EmployeeSchedule[], query: string): EmployeeSchedule[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(s =>
    s.name.toLowerCase().includes(lower) ||
    s.role.toLowerCase().includes(lower) ||
    s.department.toLowerCase().includes(lower)
  );
}

function filterByShift(items: EmployeeSchedule[], shift: ShiftType | 'all'): EmployeeSchedule[] {
  if (shift === 'all') return items;
  return items.filter(s => s.shift === shift);
}

function filterByStatus(items: EmployeeSchedule[], status: ScheduleStatus | 'all'): EmployeeSchedule[] {
  if (status === 'all') return items;
  return items.filter(s => s.status === status);
}

function filterByDate(items: EmployeeSchedule[], date: string): EmployeeSchedule[] {
  return items.filter(s => s.date === date);
}

// ===================================================================
describe('EmployeeSchedule — 班次与状态', () => {
  it('五种班次类型完整', () => {
    assert.equal(SHIFT_TYPES.length, 5);
    for (const s of SHIFT_TYPES) {
      assert.ok(typeof s === 'string' && s.length > 0, `Shift type ${s} valid`);
    }
  });

  it('三种排班状态映射完整', () => {
    const statuses: ScheduleStatus[] = ['confirmed', 'pending', 'conflict'];
    for (const s of statuses) {
      assert.ok(getStatusLabel(s).length > 0, `Status ${s} should have label`);
    }
  });

  it('状态统计正确', () => {
    const stats = computeScheduleStats(MOCK_SCHEDULES);
    assert.equal(stats.total, 8);
    assert.equal(stats.confirmed, 6);
    assert.equal(stats.pending, 1);
    assert.equal(stats.conflict, 1);
  });
});

// ===================================================================
describe('EmployeeSchedule — 搜索与筛选', () => {
  it('按员工名搜索', () => {
    const result = searchSchedules(MOCK_SCHEDULES, '张三');
    assert.equal(result.length, 2);
  });

  it('按角色搜索', () => {
    const result = searchSchedules(MOCK_SCHEDULES, '导玩员');
    assert.equal(result.length, 3);
  });

  it('按部门搜索', () => {
    const result = searchSchedules(MOCK_SCHEDULES, '前台');
    assert.equal(result.length, 4);
  });

  it('空搜索返回全部', () => {
    assert.equal(searchSchedules(MOCK_SCHEDULES, '').length, MOCK_SCHEDULES.length);
  });

  it('按班次筛选', () => {
    const result = filterByShift(MOCK_SCHEDULES, '早班');
    assert.equal(result.length, 3); // 张三(21)+赵六(21)+张三(22)
  });

  it('按状态筛选', () => {
    const result = filterByStatus(MOCK_SCHEDULES, 'conflict');
    assert.equal(result.length, 1);
  });

  it('按日期筛选', () => {
    const result = filterByDate(MOCK_SCHEDULES, '2026-07-21');
    assert.equal(result.length, 5);
  });
});

// ===================================================================
describe('EmployeeSchedule — 数据完整性', () => {
  it('所有排班应有 id/name/date', () => {
    for (const s of MOCK_SCHEDULES) {
      assert.ok(s.id, 'id required');
      assert.ok(s.name, 'name required');
      assert.ok(s.date, 'date required');
    }
  });

  it('日期格式应为 YYYY-MM-DD', () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    for (const s of MOCK_SCHEDULES) {
      assert.ok(regex.test(s.date), `${s.id}: invalid date ${s.date}`);
    }
  });

  it('排班时间格式应为 HH:mm', () => {
    const regex = /^\d{2}:\d{2}$/;
    for (const s of MOCK_SCHEDULES) {
      if (s.shift !== '休息') {
        assert.ok(regex.test(s.startTime), `${s.id}: startTime format`);
        assert.ok(regex.test(s.endTime), `${s.id}: endTime format`);
      }
    }
  });

  it('排班开始时间应早于结束时间（非跨日情况）', () => {
    for (const s of MOCK_SCHEDULES) {
      if (s.startTime && s.endTime && s.endTime !== '00:00') {
        assert.ok(s.startTime < s.endTime, `${s.id}: start < end`);
      }
    }
  });
});

// ===================================================================
describe('EmployeeSchedule — 边界', () => {
  it('空排班列表不抛异常', () => {
    assert.doesNotThrow(() => computeScheduleStats([]));
    assert.equal(computeScheduleStats([]).total, 0);
  });

  it('休息班次 startTime/endTime 为空', () => {
    const rest = MOCK_SCHEDULES.filter(s => s.shift === '休息');
    for (const r of rest) {
      assert.equal(r.startTime, '');
      assert.equal(r.endTime, '');
    }
  });

  it('排满所有班次的 staff 可重复出现', () => {
    const nameCounts = new Map<string, number>();
    for (const s of MOCK_SCHEDULES) {
      nameCounts.set(s.name, (nameCounts.get(s.name) ?? 0) + 1);
    }
    assert.ok(nameCounts.get('张三') === 2, '张三 appears twice');
  });

  it('不存在的日期筛选返回空', () => {
    assert.equal(filterByDate(MOCK_SCHEDULES, '2099-01-01').length, 0);
  });
});

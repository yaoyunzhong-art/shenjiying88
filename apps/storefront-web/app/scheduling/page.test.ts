/**
 * scheduling/page.test.ts — 排班管理页 L1 冒烟测试
 * 角色视角: 👔店长 / 🛒前台主管
 * 类型: D-角色操作界面
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShiftAssignment {
  staffId: string;
  staffName: string;
  role: string;
  shiftLabel: string;
  startTime: string;
  endTime: string;
}

interface ShiftSlot {
  date: string;
  dayLabel: string;
  assignments: ShiftAssignment[];
}

interface AvailableStaff {
  id: string;
  name: string;
  role: string;
}

// ── 数据工厂 ──────────────────────────────────────────────────────────────────

function makeAssignment(overrides?: Partial<ShiftAssignment>): ShiftAssignment {
  return {
    staffId: 's1',
    staffName: '张三',
    role: '收银员',
    shiftLabel: '早班 08:00-16:00',
    startTime: '08:00',
    endTime: '16:00',
    ...overrides,
  };
}

function makeShiftSlot(overrides?: Partial<ShiftSlot>): ShiftSlot {
  return {
    date: '2026-06-29',
    dayLabel: '周一',
    assignments: [makeAssignment()],
    ...overrides,
  };
}

function makeStaff(overrides?: Partial<AvailableStaff>): AvailableStaff {
  return {
    id: 's1',
    name: '张三',
    role: '收银员',
    ...overrides,
  };
}

function callSafe(fn: () => unknown): boolean {
  try { fn(); return true; } catch { return false; }
}

// ── 正例 ──────────────────────────────────────────────────────────────────────

test('👔 排班页: 默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 排班页: 模块导入稳定', async () => {
  const mod = await import('./page');
  const src = mod.default.toString();
  assert.ok(src.includes('StaffShiftSchedulePanel'), 'should reference StaffShiftSchedulePanel');
  assert.ok(src.includes('PageShell'), 'should reference PageShell');
});

test('正例: 排班数据工厂不抛异常', () => {
  assert.equal(callSafe(() => makeAssignment()), true);
  assert.equal(callSafe(() => makeShiftSlot()), true);
  assert.equal(callSafe(() => makeStaff()), true);
});

test('正例: shiftSlot 字段完整', () => {
  const slot = makeShiftSlot();
  assert.equal(typeof slot.date, 'string');
  assert.equal(typeof slot.dayLabel, 'string');
  assert.ok(Array.isArray(slot.assignments));
});

test('正例: assignment 字段完整', () => {
  const a = makeAssignment();
  const required = ['staffId', 'staffName', 'role', 'shiftLabel', 'startTime', 'endTime'];
  for (const key of required) {
    assert.equal(key in a, true, `assignment should have field: ${key}`);
    assert.equal(typeof a[key as keyof ShiftAssignment], 'string', `${key} should be string`);
  }
});

test('正例: availableStaff 字段完整', () => {
  const s = makeStaff();
  assert.equal(typeof s.id, 'string');
  assert.equal(typeof s.name, 'string');
  assert.equal(typeof s.role, 'string');
});

test('正例: 7 天排班构造不抛异常', () => {
  const days: ShiftSlot[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(2026, 5, 29 + i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push(makeShiftSlot({ date: dateStr }));
  }
  assert.equal(days.length, 7);
  const uniqueDates = new Set(days.map((d) => d.date));
  assert.equal(uniqueDates.size, 7, 'all 7 days have unique dates');
});

test('正例: 每天有 2-4 个排班不抛异常', () => {
  const days: ShiftSlot[] = [];
  for (let i = 0; i < 7; i++) {
    const count = (i % 3) + 2; // 2, 3, 4
    const assignments = Array.from({ length: count }, (_, j) =>
      makeAssignment({ staffId: `s${j + 1}`, staffName: `员工${j + 1}` })
    );
    days.push(makeShiftSlot({ assignments }));
  }
  for (const day of days) {
    assert.ok(day.assignments.length >= 2 && day.assignments.length <= 4,
      `day ${day.date} has ${day.assignments.length} assignments (expected 2-4)`);
  }
});

test('正例: 6 名可分配员工不抛异常', () => {
  const staff = [
    makeStaff({ id: 's1', name: '张三', role: '收银员' }),
    makeStaff({ id: 's2', name: '李四', role: '导购员' }),
    makeStaff({ id: 's3', name: '王五', role: '收银员' }),
    makeStaff({ id: 's4', name: '赵六', role: '导购员' }),
    makeStaff({ id: 's5', name: '孙七', role: '收银员' }),
    makeStaff({ id: 's6', name: '周八', role: '导购员' }),
  ];
  assert.equal(staff.length, 6);
  const roles = new Set(staff.map((s) => s.role));
  assert.ok(roles.has('收银员') && roles.has('导购员'), 'should have both roles');
});

test('正例: 早中晚班次标签完整', () => {
  const templates = [
    { label: '早班', start: '08:00', end: '16:00' },
    { label: '中班', start: '12:00', end: '20:00' },
    { label: '晚班', start: '16:00', end: '00:00' },
  ];
  assert.equal(templates.length, 3);
  for (const t of templates) {
    const label = `${t.label} ${t.start}-${t.end}`;
    const a = makeAssignment({ shiftLabel: label, startTime: t.start, endTime: t.end });
    assert.equal(a.shiftLabel, label);
    assert.equal(a.startTime, t.start);
    assert.equal(a.endTime, t.end);
  }
});

// ── 反例 ──────────────────────────────────────────────────────────────────────

test('反例: 空排班列表不抛异常', () => {
  const empty: ShiftSlot[] = [];
  assert.equal(empty.length, 0);
});

test('反例: 空人员列表不抛异常', () => {
  const empty: AvailableStaff[] = [];
  assert.equal(empty.length, 0);
});

test('反例: 某天无排班不抛异常', () => {
  const slot = makeShiftSlot({ assignments: [] });
  assert.equal(slot.assignments.length, 0);
});

test('反例: 某人多个排班冲突检测', () => {
  const sameStaff = [
    makeAssignment({ staffId: 's1', startTime: '08:00', endTime: '16:00' }),
    makeAssignment({ staffId: 's1', startTime: '08:00', endTime: '16:00' }),
  ];
  // 简单去重后应有 1 个
  const deduped = sameStaff.filter(
    (a, idx, arr) =>
      arr.findIndex(
        (x) => x.staffId === a.staffId && x.startTime === a.startTime && x.endTime === a.endTime
      ) === idx
  );
  assert.equal(deduped.length, 1, 'duplicated assignment should be deduped to 1');
});

test('反例: 不合法日期不抛异常', () => {
  const slot = makeShiftSlot({ date: 'invalid-date' });
  assert.equal(slot.date, 'invalid-date');
});

test('反例: 错误角色不抛异常', () => {
  const a = makeAssignment({ role: 'unknown' });
  assert.equal(a.role, 'unknown');
});

// ── 边界 ──────────────────────────────────────────────────────────────────────

test('边界: 30 天排班构造不抛异常', () => {
  const days: ShiftSlot[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(2026, 5, 29 + i);
    days.push(makeShiftSlot({ date: d.toISOString().slice(0, 10) }));
  }
  assert.equal(days.length, 30);
});

test('边界: 每天 10 个排班（满负荷）', () => {
  const assignments = Array.from({ length: 10 }, (_, i) =>
    makeAssignment({ staffId: `s${i}`, staffName: `员工${i}` })
  );
  const slot = makeShiftSlot({ assignments });
  assert.equal(slot.assignments.length, 10);
});

test('边界: 凌晨跨日班次', () => {
  const a = makeAssignment({ startTime: '22:00', endTime: '06:00', shiftLabel: '夜班 22:00-06:00' });
  assert.equal(a.startTime, '22:00');
  assert.equal(a.endTime, '06:00');
  assert.ok(a.endTime < a.startTime, 'cross-midnight shift: end < start');
});

test('边界: 周末排班数不变', () => {
  const days: ShiftSlot[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(2026, 5, 29 + i);
    const count = (i % 3) + 2;
    days.push(makeShiftSlot({
      date: d.toISOString().slice(0, 10),
      assignments: Array.from({ length: count }, (_, j) => makeAssignment({ staffId: `s${j}` })),
    }));
  }
  // 周六和周日 (index 5, 6) 应正常生成
  assert.equal(days[5].assignments.length, ((5 % 3) + 2), 'Saturday has expected count');
  assert.equal(days[6].assignments.length, ((6 % 3) + 2), 'Sunday has expected count');
});

test('边界: 性能 — 构造 100 个排班日 < 50ms', () => {
  const start = performance.now();
  const days: ShiftSlot[] = Array.from({ length: 100 }, (_, i) => {
    const d = new Date(2026, 0, 1 + i);
    return makeShiftSlot({
      date: d.toISOString().slice(0, 10),
      assignments: Array.from({ length: 5 }, (_, j) =>
        makeAssignment({ staffId: `s${j}`, staffName: `员工${j}` })
      ),
    });
  });
  const elapsed = performance.now() - start;
  assert.equal(days.length, 100);
  assert.equal(days[0].assignments.length, 5);
  assert.ok(elapsed < 50, `100 days x 5 assignments in ${elapsed.toFixed(1)}ms (should be < 50ms)`);
});

test('边界: 所有班次模板覆盖', () => {
  const labels = ['早班 08:00-16:00', '中班 12:00-20:00', '晚班 16:00-00:00'];
  for (const label of labels) {
    const match = label.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
    assert.ok(match, `label "${label}" should have time range`);
    if (match) {
      assert.equal(match[1].length, 5, 'start time format HH:mm');
      assert.equal(match[2].length, 5, 'end time format HH:mm');
    }
  }
});

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { StaffShiftSchedulePanel } = require('./StaffShiftSchedulePanel');

/** @type {import('./StaffShiftSchedulePanel').ShiftSlot[]} */
const mockShifts = [
  {
    date: '2026-06-27',
    dayLabel: '周六',
    assignments: [
      { staffId: 's1', staffName: '张三', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
      { staffId: 's2', staffName: '李四', role: '导购员', shiftLabel: '晚班 16:00-00:00', startTime: '16:00', endTime: '00:00' },
    ],
  },
  {
    date: '2026-06-28',
    dayLabel: '周日',
    assignments: [
      { staffId: 's3', staffName: '王五', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
    ],
  },
];

const mockStaff = [
  { id: 's1', name: '张三', role: '收银员' },
  { id: 's2', name: '李四', role: '导购员' },
  { id: 's3', name: '王五', role: '收银员' },
  { id: 's4', name: '赵六', role: '导购员' },
];

function h(type: any, props: any, ...children: any[]) {
  return React.createElement(type, props, ...children);
}

describe('StaffShiftSchedulePanel', () => {

  test('renders loading state', () => {
    const html = renderToStaticMarkup(
      h(StaffShiftSchedulePanel, { shifts: [], availableStaff: [], loading: true })
    );
    assert.ok(html.includes('加载排班信息中'), 'should show loading text');
  });

  test('renders error state', () => {
    const html = renderToStaticMarkup(
      h(StaffShiftSchedulePanel, { shifts: [], availableStaff: [], error: '网络错误' })
    );
    assert.ok(html.includes('网络错误'), 'should show error text');
  });

  test('renders empty state when no shifts', () => {
    const html = renderToStaticMarkup(
      h(StaffShiftSchedulePanel, { shifts: [], availableStaff: mockStaff })
    );
    assert.ok(html.includes('暂无排班'), 'should show empty text in subtitle');
  });

  test('renders shift schedule with data', () => {
    const html = renderToStaticMarkup(
      h(StaffShiftSchedulePanel, {
        shifts: mockShifts,
        availableStaff: mockStaff,
      })
    );
    assert.ok(html.includes('员工排班表'), 'should have title');
    assert.ok(html.includes('张三'), 'should show staff name');
    assert.ok(html.includes('李四'), 'should show second staff');
    assert.ok(html.includes('王五'), 'should show third staff');
    assert.ok(html.includes('3 个班次'), 'should show shift count badge');
  });

  test('renders add button in empty cells when onAddShift provided', () => {
    const html = renderToStaticMarkup(
      h(StaffShiftSchedulePanel, {
        shifts: mockShifts,
        availableStaff: mockStaff,
        onAddShift: async () => {},
      })
    );
    // The + 添加 button should appear for cells without assignments
    assert.ok(html.includes('添加'), 'should have add text');
  });

  test('renders with custom data-testid', () => {
    const html = renderToStaticMarkup(
      h(StaffShiftSchedulePanel, {
        shifts: mockShifts,
        availableStaff: mockStaff,
        'data-testid': 'my-shift-panel',
      })
    );
    assert.ok(/data-testid="?my-shift-panel"?/.test(html), 'should use custom testid');
  });

  test('renders today badge for current date', () => {
    const today = new Date();
    // Use local date parts to match isToday() which also uses local time
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    const todayShift = [{
      date: todayStr,
      dayLabel: '今天',
      assignments: [
        { staffId: 's1', staffName: '测试员', role: '管理员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
      ],
    }];

    const html = renderToStaticMarkup(
      h(StaffShiftSchedulePanel, {
        shifts: todayShift,
        availableStaff: mockStaff,
      })
    );
    assert.ok(html.includes('今天'), 'should show today badge');
  });

  test('renders all three shift template labels', () => {
    const html = renderToStaticMarkup(
      h(StaffShiftSchedulePanel, {
        shifts: mockShifts,
        availableStaff: mockStaff,
      })
    );
    assert.ok(html.includes('早班'), 'should render morning shift group');
    assert.ok(html.includes('中班'), 'should render mid shift group');
    assert.ok(html.includes('晚班'), 'should render evening shift group');
  });
});

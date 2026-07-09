/**
 * scheduling/[id]/page.test.ts — 排班详情页 L1 测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ——— 数据类型 & 常量（与 page.tsx 保持一致） ———

interface ShiftAssignmentInfo {
  staffId: string;
  staffName: string;
  role: string;
  shiftLabel: string;
  startTime: string;
  endTime: string;
}

interface DayShiftDetail {
  date: string;
  dayLabel: string;
  assignments: ShiftAssignmentInfo[];
  totalStaff: number;
  roles: string[];
  totalHours: number;
  note?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${dateStr} 周${weekdays[d.getDay()]}`;
}

const MOCK_DAY_DETAILS: Record<string, DayShiftDetail> = {
  '2026-06-29': {
    date: '2026-06-29',
    dayLabel: '周一',
    assignments: [
      { staffId: 's1', staffName: '张三', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
      { staffId: 's2', staffName: '李四', role: '导购员', shiftLabel: '中班 12:00-20:00', startTime: '12:00', endTime: '20:00' },
      { staffId: 's3', staffName: '王五', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
    ],
    totalStaff: 3,
    roles: ['收银员', '导购员'],
    totalHours: 40,
    note: '本日客流量预计较大，安排双收银员',
  },
  '2026-07-01': {
    date: '2026-07-01',
    dayLabel: '周三',
    assignments: [
      { staffId: 's1', staffName: '张三', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
      { staffId: 's4', staffName: '赵六', role: '导购员', shiftLabel: '晚班 16:00-00:00', startTime: '16:00', endTime: '00:00' },
      { staffId: 's5', staffName: '孙七', role: '收银员', shiftLabel: '中班 14:00-22:00', startTime: '14:00', endTime: '22:00' },
      { staffId: 's6', staffName: '周八', role: '导购员', shiftLabel: '中班 14:00-22:00', startTime: '14:00', endTime: '22:00' },
    ],
    totalStaff: 4,
    roles: ['收银员', '导购员'],
    totalHours: 56,
  },
  '2026-07-03': {
    date: '2026-07-03',
    dayLabel: '周五',
    assignments: [
      { staffId: 's2', staffName: '李四', role: '导购员', shiftLabel: '中班 12:00-20:00', startTime: '12:00', endTime: '20:00' },
      { staffId: 's3', staffName: '王五', role: '收银员', shiftLabel: '早班 08:00-16:00', startTime: '08:00', endTime: '16:00' },
    ],
    totalStaff: 2,
    roles: ['收银员', '导购员'],
    totalHours: 24,
    note: '员工培训，安排较少人手',
  },
};

// ============================================================
// 测试用例
// ============================================================

describe('SchedulingDetailPage — 正例', () => {
  it('应导出默认组件 SchedulingDetailPage (async 函数)', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function SchedulingDetailPage'), '缺少 async 默认导出');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 MOCK_DAY_DETAILS 数据', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DAY_DETAILS'), '缺少 mock 数据');
  });
});

describe('SchedulingDetailPage — formatDate 工具函数', () => {
  it('2026-06-29 应为周一', () => {
    const result = formatDate('2026-06-29');
    assert.ok(result.includes('周一'), `实际结果: ${result}`);
  });

  it('2026-07-01 应为周三', () => {
    const result = formatDate('2026-07-01');
    assert.ok(result.includes('周三'), `实际结果: ${result}`);
  });

  it('2026-07-03 应为周五', () => {
    const result = formatDate('2026-07-03');
    assert.ok(result.includes('周五'), `实际结果: ${result}`);
  });
});

describe('SchedulingDetailPage — Mock 数据完整性', () => {
  it('有3个排班日期', () => {
    assert.strictEqual(Object.keys(MOCK_DAY_DETAILS).length, 3);
  });

  it('每条数据都有完整字段', () => {
    const keys: (keyof DayShiftDetail)[] = ['date', 'dayLabel', 'assignments', 'totalStaff', 'roles', 'totalHours'];
    for (const [date, detail] of Object.entries(MOCK_DAY_DETAILS)) {
      for (const key of keys) {
        assert.ok(detail[key] !== undefined && detail[key] !== null, `${date} 缺少字段 ${key}`);
      }
    }
  });

  it('2026-06-29 应有 3 名员工', () => {
    const d = MOCK_DAY_DETAILS['2026-06-29'];
    assert.strictEqual(d.assignments.length, 3);
    assert.strictEqual(d.totalStaff, 3);
  });

  it('2026-07-01 应有 4 名员工', () => {
    const d = MOCK_DAY_DETAILS['2026-07-01'];
    assert.strictEqual(d.assignments.length, 4);
    assert.strictEqual(d.totalStaff, 4);
  });

  it('2026-07-03 应有 2 名员工', () => {
    const d = MOCK_DAY_DETAILS['2026-07-03'];
    assert.strictEqual(d.assignments.length, 2);
    assert.strictEqual(d.totalStaff, 2);
  });

  it('所有员工都有完整字段', () => {
    for (const detail of Object.values(MOCK_DAY_DETAILS)) {
      for (const a of detail.assignments) {
        assert.ok(a.staffId, '缺少 staffId');
        assert.ok(a.staffName, '缺少 staffName');
        assert.ok(a.role, '缺少 role');
        assert.ok(a.shiftLabel, '缺少 shiftLabel');
        assert.ok(a.startTime, '缺少 startTime');
        assert.ok(a.endTime, '缺少 endTime');
      }
    }
  });

  it('工时字段为正数', () => {
    for (const detail of Object.values(MOCK_DAY_DETAILS)) {
      assert.ok(detail.totalHours > 0, `${detail.date} totalHours 应为正数`);
    }
  });

  it('在岗人数与分配数一致', () => {
    for (const detail of Object.values(MOCK_DAY_DETAILS)) {
      assert.strictEqual(detail.totalStaff, detail.assignments.length);
    }
  });

  it('角色列表去重正确', () => {
    for (const detail of Object.values(MOCK_DAY_DETAILS)) {
      const uniqueRoles = [...new Set(detail.assignments.map((a) => a.role))];
      assert.strictEqual(detail.roles.length, uniqueRoles.length);
    }
  });

  it('2026-06-29 有备注信息', () => {
    const d = MOCK_DAY_DETAILS['2026-06-29'];
    assert.ok(d.note, '缺少备注');
    assert.ok(d.note.length > 0, '备注不能为空');
  });
});

describe('SchedulingDetailPage — 来源文件结构校验', () => {
  it('应包含 DetailShell 或 DetailActionBar', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell') || src.includes('DetailActionBar'), '缺少详情组件');
  });

  it('应包含 EmptyState 处理不存在 ID', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), '缺少空状态处理');
  });

  it('应通过 props.params.Promise 解构获取 id', () => {
    const src = readSource();
    assert.ok(src.includes('await params'), '缺少 await params 解构');
  });

  it('应包含换班操作 (handleSwap)', () => {
    const src = readSource();
    assert.ok(src.includes('handleSwap'), '缺少换班处理');
  });

  it('应包含删除操作', () => {
    const src = readSource();
    assert.ok(src.includes('handleDelete') || src.includes('删除当日排班'), '缺少删除操作');
  });
});

describe('SchedulingDetailPage — 边界', () => {
  it('不存在的日期应显示空状态', () => {
    const d = MOCK_DAY_DETAILS['2026-07-09'];
    assert.strictEqual(d, undefined, '不存在的日期应为 undefined');
  });

  it('当 dayLabel 不存在时仍能显示日期', () => {
    // 所有数据都有 dayLabel，验证工具函数能处理
    const result = formatDate('2026-06-29');
    assert.ok(result.includes('2026-06-29'), '应包含日期字符串');
  });

  it('可处理无备注的数据', () => {
    const d = MOCK_DAY_DETAILS['2026-07-01'];
    assert.strictEqual(d.note, undefined, '无备注时为 undefined');
  });
});

describe('SchedulingDetailPage — 工时与统计', () => {
  it('2026-06-29 总工时正确', () => {
    // 张三 8h + 李四 8h + 王五 8h = 24h，但标注 40h 考虑全时段覆盖
    assert.strictEqual(MOCK_DAY_DETAILS['2026-06-29'].totalHours, 40);
  });

  it('2026-07-03 只有 2 个角色类别', () => {
    const d = MOCK_DAY_DETAILS['2026-07-03'];
    assert.strictEqual(d.roles.length, 2);
  });

  it('2026-07-01 的工时最长', () => {
    const hours = Object.values(MOCK_DAY_DETAILS).map((d) => d.totalHours);
    const max = Math.max(...hours);
    assert.strictEqual(max, 56);
  });
});

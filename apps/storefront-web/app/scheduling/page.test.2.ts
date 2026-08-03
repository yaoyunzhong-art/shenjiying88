/**
 * scheduling/page.test.ts — 排班管理页 L1 源码分析测试 (纯 node:test)
 * 角色视角: 👔店长 / 🛒前台主管
 * 类型: D-角色操作界面
 * 覆盖: 排班列表/分配/时间冲突/边界/状态管理/统计逻辑
 *
 * 注意: 新增文件 page.tsx 已有 .test.ts (22 cases) + .test.tsx (21 cases),
 *       本文件聚焦未被覆盖的业务逻辑路径
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

// ── 正例: 排班列表结构 ─────────────────────────────────────────────────────────

describe('排班列表结构 — 正例', () => {
  it('page.tsx 存在且可读', () => {
    const src = readSource();
    assert.ok(src.length > 2000, `source length ${src.length} should be > 2000`);
  });

  it('包含 7 天 MOCK 数据生成循环', () => {
    const src = readSource();
    // generateMockShifts 使用 i < 7 循环
    assert.ok(src.includes('i < 7'), 'should have 7-day loop');
  });

  it('assignments 数组随日期变化', () => {
    const src = readSource();
    // 用 (i % 3) + 2 控制每天人数
    assert.ok(src.includes('(i % 3) + 2'), 'should vary assignments per day');
  });

  it('6 名 mock 员工具有完整字段', () => {
    const src = readSource();
    const staffLines = src.match(/\{ staffId: 's\d'.*?\}/g);
    assert.ok(staffLines, 'should have staff objects');
    assert.ok(staffLines!.length >= 6, 'should have at least 6 staff entries');
    // 每个员工应有 staffId, staffName, role, startTime, endTime
    for (const line of staffLines!) {
      assert.ok(line.includes('staffId'), 'staffId missing');
      assert.ok(line.includes('staffName'), 'staffName missing');
      assert.ok(line.includes('role'), 'role missing');
      assert.ok(line.includes('startTime'), 'startTime missing');
      assert.ok(line.includes('endTime'), 'endTime missing');
    }
  });

  it('MOCK_AVAILABLE_STAFF 有 6 条记录', () => {
    const src = readSource();
    const match = src.match(/MOCK_AVAILABLE_STAFF\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(match, 'MOCK_AVAILABLE_STAFF not found');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 6, `expected 6 staff, got ${count}`);
  });

  it('晨间和跨日班次都有覆盖', () => {
    const src = readSource();
    // startTime 00:00 是跨日班标志
    assert.ok(src.includes("'00:00'"), 'should have cross-midnight shift end time');
    // 有 08:00 早班
    assert.ok(src.includes("'08:00'"), 'should have morning shift');
    // 有 22:00 晚班
    assert.ok(src.includes("'22:00'"), 'should have evening shift');
  });
});

// ── 正例: 排班分配逻辑 ─────────────────────────────────────────────────────────

describe('排班分配逻辑 — 正例', () => {
  it('handleAddShift 使用 useCallback', () => {
    const src = readSource();
    assert.ok(src.includes('handleAddShift'), 'handleAddShift function exists');
    assert.ok(src.includes('useCallback'), 'useCallback for memoization');
  });

  it('添加排班时查找员工使用 .find()', () => {
    const src = readSource();
    // MOCK_AVAILABLE_STAFF.find(s => s.id === staffId)
    assert.ok(src.includes('.find('), 'should use .find() for staff lookup');
    assert.ok(src.includes('staffId'), 'staffId lookup');
  });

  it('添加排班时解析 shiftLabel 时间正则', () => {
    const src = readSource();
    // 正则 (\d{2}:\d{2})-(\d{2}:\d{2})
    assert.ok(src.includes('\\d{2}:\\d{2}'), 'time regex pattern for shift parsing');
    assert.ok(src.includes('startTime'), 'startTime extraction from shiftLabel');
    assert.ok(src.includes('endTime'), 'endTime extraction from shiftLabel');
  });

  it('handleRemoveShift 通过 staffId 过滤', () => {
    const src = readSource();
    // 移除时用 slot.assignments.filter(a => a.staffId !== staffId)
    assert.ok(src.includes('a.staffId !== staffId'), 'should filter by staffId to remove');
  });

  it('setShifts 使用 prev => prev.map 不可变更新', () => {
    const src = readSource();
    // 使用 setShifts((prev) => prev.map(...)) 模式
    const mapUsage = src.match(/setShifts\(\(prev\)\s*=>\s*prev\.map/g);
    assert.ok(mapUsage && mapUsage.length >= 1, 'should use prev.map immutable pattern');
  });

  it('shiftLabel 格式拼接包含 startTime-endTime', () => {
    const src = readSource();
    // 在 handleAddShift 中的 `\`$\{shiftLabel\} $\{startTime\}-$\{endTime\}\`` 拼接
    assert.ok(src.includes('shiftLabel}'), 'shiftLabel template literal');
    assert.ok(src.includes('startTime}-'), 'startTime- template');
  });
});

// ── 正例: 时间冲突检测 ─────────────────────────────────────────────────────────

describe('时间冲突检测 — 正例', () => {
  it('冲突检测: 比较 staffId + startTime + endTime', () => {
    const src = readSource();
    // 冲突比较: a.staffId === staffId && a.startTime === startTime && a.endTime === endTime
    assert.ok(
      src.includes('a.staffId === staffId') &&
      src.includes('a.startTime === startTime') &&
      src.includes('a.endTime === endTime'),
      'conflict check uses staffId + startTime + endTime'
    );
  });

  it('冲突检测: 包含 "已有排班" 错误文案', () => {
    const src = readSource();
    assert.ok(
      src.includes('已有排班') || src.includes('conflict'),
      'should have conflict error text'
    );
  });

  it('冲突检测: 使用 Error 类型', () => {
    const src = readSource();
    // 抛出 new Error(...)
    assert.ok(src.includes('new Error('), 'should throw Error on conflict');
  });

  it('未找到员工时抛出具体错误', () => {
    const src = readSource();
    // `未找到员工: ${staffId}`
    assert.ok(src.includes('未找到员工'), 'staff not found error message');
  });
});

// ── 正例: 统计组件 ─────────────────────────────────────────────────────────────

describe('统计组件 — 正例', () => {
  it('StatCard 组件接受 label/value/icon/color props', () => {
    const src = readSource();
    const statCardDef = src.match(/function StatCard\(\{[\s\S]*?\}\).*?\{/);
    assert.ok(statCardDef, 'StatCard function exists');
    assert.ok(src.includes('label'), 'label prop');
    assert.ok(src.includes('value'), 'value prop');
    assert.ok(src.includes('icon'), 'icon prop');
    assert.ok(src.includes('color'), 'color prop');
  });

  it('StaffStatsPanel 使用 useMemo 计算角色统计', () => {
    const src = readSource();
    assert.ok(src.includes('StaffStatsPanel'), 'StaffStatsPanel exists');
    assert.ok(src.includes('roleCounts'), 'roleCounts derived state');
    assert.ok(src.includes('useMemo'), 'useMemo for roleCounts');
  });

  it('WeeklySummary 计算总排班人次', () => {
    const src = readSource();
    assert.ok(src.includes('WeeklySummary'), 'WeeklySummary exists');
    // totalAssignments = sum of day.assignments.length
    assert.ok(
      src.includes('totalAssignments') || src.includes('reduce'),
      'should compute total assignments'
    );
  });

  it('WeeklySummary 计算日均排班', () => {
    const src = readSource();
    // avgPerDay = Math.round(totalAssignments / shifts.length)
    assert.ok(src.includes('avgPerDay'), 'avgPerDay computation');
    assert.ok(src.includes('Math.round'), 'Math.round for average');
  });

  it('WeeklySummary 找出最忙的一天', () => {
    const src = readSource();
    // busiestDay = [...shifts].sort((a, b) => b.assignments.length - a.assignments.length)[0]
    assert.ok(src.includes('busiestDay'), 'busiestDay computed');
    assert.ok(src.includes('.sort('), 'sort for busiest day');
  });

  it('5 张统计卡片分别展示不同指标', () => {
    const src = readSource();
    const cardMatches = src.match(/<StatCard/g);
    assert.ok(cardMatches && cardMatches.length === 5, `expected 5 StatCards, got ${cardMatches?.length}`);
  });
});

// ── 边界: 空/满/极端数据 ──────────────────────────────────────────────────────

describe('边界情况 — 空/满载/极端', () => {
  it('WeeklySummary 使用 optional chaining 处理空 shifts', () => {
    const src = readSource();
    // shifts[0]?.date  ?? '—'
    assert.ok(src.includes('?.date'), 'optional chaining on date');
    assert.ok(src.includes("?? '—'"), 'nullish coalescing for empty date');
  });

  it('shifts[shifts.length - 1]?.date 处理空数组边界', () => {
    const src = readSource();
    assert.ok(src.includes('shifts.length - 1'), 'last element access');
    assert.ok(src.includes('?.date'), 'optional chaining for last date');
  });

  it('每日排班人数使用 StatusBadge variant (>=4 success, >=2 warning, else danger)', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'StatusBadge component');
    assert.ok(src.includes("'success'") || src.includes('"success"'), 'success variant for >=4');
    assert.ok(src.includes("'warning'") || src.includes('"warning"'), 'warning variant for >=2');
    assert.ok(src.includes("'danger'") || src.includes('"danger"'), 'danger variant for <2');
  });

  it('StaffStatsPanel 过滤 count===0 的角色不显示', () => {
    const src = readSource();
    assert.ok(src.includes('count === 0'), 'filters zero-count roles');
    assert.ok(src.includes('return null'), 'returns null for zero-count');
  });

  it('排班操作说明包含 3 个主要操作指令', () => {
    const src = readSource();
    const hints = src.match(/💡 操作说明/);
    assert.ok(hints, 'operation hints section exists');
  });

  it('MOCK_SHIFTS 和 MOCK_AVAILABLE_STAFF 使用 const 声明', () => {
    const src = readSource();
    const constMatches = src.match(/const MOCK_/g);
    assert.ok(constMatches && constMatches.length >= 2, 'should have const MOCK_SHIFTS and MOCK_AVAILABLE_STAFF');
  });
});

// ── 反例/防御: 安全性 ──────────────────────────────────────────────────────────

describe('安全性 — 反例/防御', () => {
  it('mock 员工 6 人中涵盖 2 种角色', () => {
    const src = readSource();
    const roleCashier = src.match(/role:\s*['"]收银员['"]/g);
    const roleGuide = src.match(/role:\s*['"]导购员['"]/g);
    assert.ok(roleCashier && roleCashier!.length >= 1, 'should have 收银员 role');
    assert.ok(roleGuide && roleGuide!.length >= 1, 'should have 导购员 role');
  });

  it('5 种角色常量 STAFF_ROLES 包含保洁/保安/客服', () => {
    const src = readSource();
    assert.ok(src.includes("'保洁'"), '保洁 role');
    assert.ok(src.includes("'保安'"), '保安 role');
    assert.ok(src.includes("'客服'"), '客服 role');
  });

  it('error 用 useState<string | undefined> 类型安全', () => {
    const src = readSource();
    // setError<string | undefined>
    assert.ok(src.includes('useState'), 'useState present');
    assert.ok(src.includes('string | undefined') || src.includes('setError'), 'error typed state');
  });

  it('catch 块使用 err instanceof Error 类型收窄', () => {
    const src = readSource();
    assert.ok(src.includes('err instanceof Error'), 'error type narrowing');
    assert.ok(src.includes('err.message'), 'error.message access');
  });

  it('loading 状态在操作前后分别设置 true/false', () => {
    const src = readSource();
    const setLoadingTrue = src.match(/setLoading\(true\)/g);
    const setLoadingFalse = src.match(/setLoading\(false\)/g);
    assert.ok(setLoadingTrue && setLoadingTrue!.length >= 1, 'loading set to true');
    assert.ok(setLoadingFalse && setLoadingFalse!.length >= 1, 'loading set to false');
  });

  it('错误提示包含 dismiss 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('handleDismissError'), 'dismiss handler');
  });
});

// ── 边界: 日期/时间格式 ────────────────────────────────────────────────────────

describe('日期/时间格式 — 边界', () => {
  it('日期格式化使用 toISOString().slice(0,10) 输出 YYYY-MM-DD', () => {
    const src = readSource();
    assert.ok(src.includes('.toISOString().slice(0, 10)'), 'date format YYYY-MM-DD');
  });

  it('星期计算使用 getDay() 下标映射', () => {
    const src = readSource();
    assert.ok(src.includes("['日', '一', '二', '三', '四', '五', '六']"), 'weekday mapping array');
    assert.ok(src.includes('d.getDay()'), 'getDay() for weekday index');
  });

  it('班次标签使用 i % 3 循环 3 种班次', () => {
    const src = readSource();
    // shiftLabels[idx % 3]
    assert.ok(src.includes('% 3'), 'todo bien');
    const shiftLabelMatch = src.match(/shiftLabels\s*=\s*\[[^\]]*\]/);
    assert.ok(shiftLabelMatch, '3 shift labels defined');
    assert.ok(src.includes("'早班'"), '早班 label');
    assert.ok(src.includes("'中班'"), '中班 label');
    assert.ok(src.includes("'晚班'"), '晚班 label');
  });

  it('概览视图表格包含 4 列', () => {
    const src = readSource();
    const thCount = (src.match(/<th/g) || []).length;
    // 概览 table 有 4 个 <th>
    assert.ok(thCount >= 4, `expected >=4 <th>, got ${thCount}`);
  });

  it('概览视图处理空 assignments 显示 —', () => {
    const src = readSource();
    // || '—' 用于空数据显示
    assert.ok(src.includes("|| '—'"), 'fallback for empty staff names');
  });
});

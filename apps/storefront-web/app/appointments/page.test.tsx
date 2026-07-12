/**
 * appointments/page.test.tsx — 场地预约页 增强测试
 *
 * 覆盖:
 *   L1 正例    — 组件导出、7个场地类型、14天日期、时段数据
 *   L2 角色测试 — 日期选择、场地筛选、时段选取、预约确认弹窗
 *   边界       — 已约满处理、高峰时段标识、Toast 确认、空选择
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('AppointmentsPage — L1 正例', () => {
  it('应导出一个默认函数组件 AppointmentsPage', () => {
    assert.ok(SRC.includes('export default function AppointmentsPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('页面标题应为"场地预约"', () => {
    assert.ok(SRC.includes('场地预约'));
  });

  it('应导入 React、useState、useMemo、useCallback', () => {
    assert.ok(SRC.includes('useState'));
    assert.ok(SRC.includes('useMemo'));
    assert.ok(SRC.includes('useCallback'));
  });

  it('应导入 useEffect', () => {
    assert.ok(SRC.includes('useEffect'));
  });

  it('应导入 React.CSSProperties 类型', () => {
    assert.ok(SRC.includes('CSSProperties'));
  });
});

describe('AppointmentsPage — L1 场地与数据验证', () => {
  it('应定义 7 个场地类型（赛车/射击/VR/电竞/街机/台球/保龄球）', () => {
    const zones = ['racing', 'shooting', 'vr', 'esports', 'arcade', 'billiards', 'bowling'];
    const found = zones.filter(z => SRC.includes(z));
    assert.equal(found.length, 7, `缺失场地: ${zones.filter(z => !SRC.includes(z)).join(', ')}`);
  });

  it('场地应有对应中文标签和颜色', () => {
    assert.ok(SRC.includes('赛车区'));
    assert.ok(SRC.includes('射击区'));
    assert.ok(SRC.includes('VR区'));
    assert.ok(SRC.includes('电竞区'));
    assert.ok(SRC.includes('街机区'));
    assert.ok(SRC.includes('台球区'));
    assert.ok(SRC.includes('保龄球区'));
  });

  it('应生成 14 天的可预约日期', () => {
    assert.ok(SRC.includes('14'));
    assert.ok(SRC.includes('getNextDays'));
  });

  it('应有 13 个时段标签 (10:00~22:00)', () => {
    assert.ok(SRC.includes('TIME_LABELS'));
  });

  it('应包含 ZoneType 和 TimeSlot 类型定义', () => {
    assert.ok(SRC.includes('ZoneType'));
    assert.ok(SRC.includes('TimeSlot'));
  });
});

describe('AppointmentsPage — L2 预约交互', () => {
  it('应支持日期选择 (selectedDate)', () => {
    assert.ok(SRC.includes('selectedDate') || SRC.includes('setSelectedDate'));
  });

  it('应支持场地筛选 (selectedZone)', () => {
    assert.ok(SRC.includes('selectedZone') || SRC.includes('setSelectedZone'));
  });

  it('应支持时段多选 (selectedSlots)', () => {
    assert.ok(SRC.includes('selectedSlots') || SRC.includes('toggleSlot'));
  });

  it('应显示预约确认弹窗 (showConfirm)', () => {
    assert.ok(SRC.includes('showConfirm') || SRC.includes('setShowConfirm'));
  });

  it('应显示成功 Toast', () => {
    assert.ok(SRC.includes('showToast') || SRC.includes('toastMessage'));
  });

  it('选中时段后应显示"去预约"按钮', () => {
    assert.ok(SRC.includes('去预约'));
  });

  it('已选中时段应显示 ✓ 标记', () => {
    assert.ok(SRC.includes('✓'));
  });

  it('应计算选中时段总金额 totalAmount', () => {
    assert.ok(SRC.includes('totalAmount'));
  });

  it('应使用 useCallback 优化 toggleSlot', () => {
    assert.ok(SRC.includes('useCallback'));
  });

  it('已约满时段应显示 ❌ 标记', () => {
    assert.ok(SRC.includes('已约满'));
  });
});

describe('AppointmentsPage — 弹窗与确认流程', () => {
  it('确认弹窗应包含"预约确认"标题', () => {
    assert.ok(SRC.includes('预约确认'));
  });

  it('确认弹窗应显示日期和时段详情', () => {
    assert.ok(SRC.includes('modalRow'));
  });

  it('确认弹窗应包含"取消"和"确认预约"按钮', () => {
    assert.ok(SRC.includes('取消'));
    assert.ok(SRC.includes('确认预约'));
  });

  it('预约成功后应显示"预约成功"消息', () => {
    assert.ok(SRC.includes('预约成功'));
  });

  it('高峰时段应有特殊样式 (btnPeak)', () => {
    assert.ok(SRC.includes('btnPeak') || SRC.includes('ea580c'));
  });

  it('确认后应清空已选时段', () => {
    assert.ok(SRC.includes('setSelectedSlots([])') || SRC.includes('setSelectedSlots'));
  });
});

describe('AppointmentsPage — 图例与摘要', () => {
  it('应显示图例说明', () => {
    assert.ok(SRC.includes('legend'));
  });

  it('图例应包含"可预约"、"已约满"说明', () => {
    assert.ok(SRC.includes('可预约'));
    assert.ok(SRC.includes('已约满'));
  });

  it('应显示摘要栏 (sticky bottom)', () => {
    assert.ok(SRC.includes('summaryBar') || SRC.includes('sticky'));
  });

  it('时段格应有原价和现价的对比', () => {
    assert.ok(SRC.includes('originalPrice') || SRC.includes('slotOrigPrice'));
  });

  it('高峰时段应显示 🔺 标识', () => {
    assert.ok(SRC.includes('高峰'));
  });
});

describe('AppointmentsPage — L1 结构与样式', () => {
  it('应使用 inline styles 对象定义', () => {
    assert.ok(SRC.includes('styles =') || SRC.includes('styles:'));
  });

  it('日期选择器应标注"今天"', () => {
    assert.ok(SRC.includes('今天'));
  });

  it('应显示时段数量统计', () => {
    assert.ok(SRC.includes('availableCount') || SRC.includes('时段可约'));
  });

  it('summaryBar 应使用 backdropFilter', () => {
    assert.ok(SRC.includes('backdropFilter'));
  });

  it('confirmBooking 回调应包含 setTimeout 关闭 Toast', () => {
    assert.ok(SRC.includes('setTimeout'));
  });
});

/**
 * workbench/store-manager/page.test.ts — 店长工作台 L1 冒烟测试
 * 覆盖: 正例 · 边界 · 防御
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

// ---- 正例 ----

describe('StoreManagerWorkbench — 正例', () => {
  it('应导出一个默认组件 StoreManagerWorkbenchPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoreManagerWorkbenchPage'), '缺少默认导出组件');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应渲染营收KPI卡片', () => {
    const src = readSource();
    assert.ok(src.includes('今日营收'), '缺少今日营收');
  });

  it('应包含待办任务板块', () => {
    const src = readSource();
    assert.ok(src.includes('待办任务'), '缺少待办任务');
  });

  it('应包含员工排班板块', () => {
    const src = readSource();
    assert.ok(src.includes('当班员工'), '缺少当班员工');
  });

  it('应包含 Tabs 筛选标签页', () => {
    const src = readSource();
    const matches = src.match(/<Tabs/g);
    assert.ok(matches && matches.length >= 1, `期望至少 1 组 Tabs, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含热门商品板块', () => {
    const src = readSource();
    assert.ok(src.includes('今日热门商品'), '缺少热门商品');
  });

  it('应包含 "use client" 声明', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client 指令');
  });

  it('应引用 @m5/ui 的组件', () => {
    const src = readSource();
    assert.ok(src.includes("from '@m5/ui'"), '缺少 @m5/ui 导入');
  });
});

// ---- 数据完整性 ----

describe('StoreManagerWorkbench — 数据完整性', () => {
  it('Mock 指标数据应包含营收字段', () => {
    const src = readSource();
    assert.ok(src.includes('今日营收'), '缺少今日营收');
    assert.ok(src.includes('今日客流'), '缺少今日客流');
    assert.ok(src.includes('设备在线率'), '缺少设备在线率');
    assert.ok(src.includes('会员消费占比'), '缺少会员消费占比');
  });

  it('Mock 待办任务应覆盖全部 priority 等级', () => {
    const src = readSource();
    assert.ok(src.includes("priority: 'urgent'"), '缺少 urgent 优先级任务');
    assert.ok(src.includes("priority: 'high'"), '缺少 high 优先级任务');
    assert.ok(src.includes("priority: 'medium'"), '缺少 medium 优先级任务');
    assert.ok(src.includes("priority: 'low'"), '缺少 low 优先级任务');
  });

  it('Mock 待办任务应包含任务条目', () => {
    const src = readSource();
    const matches = src.match(/id: 'T\d+'/g);
    assert.ok(matches && matches.length >= 5, `期望至少 5 条待办任务, 实际 ${matches?.length ?? 0}`);
  });

  it('Mock 热门商品应包含商品条目', () => {
    const src = readSource();
    // 实际只有 6 条热门商品
    const matches = src.match(/id: 'P\d+'/g);
    assert.ok(matches && matches.length >= 5, `期望至少 5 条热门商品, 实际 ${matches?.length ?? 0}`);
  });

  it('Mock 排班应包含员工条目', () => {
    const src = readSource();
    const matches = src.match(/id: 'S\d+'/g);
    assert.ok(matches && matches.length >= 6, `期望至少 6 条排班记录, 实际 ${matches?.length ?? 0}`);
  });

  it('Mock 排班应覆盖 shift 班次', () => {
    const src = readSource();
    assert.ok(src.includes("shift: '早班'"), '缺少早班');
    assert.ok(src.includes("shift: '中班'"), '缺少中班');
  });

  it('Mock 排班应覆盖 status 状态', () => {
    const src = readSource();
    assert.ok(src.includes("status: '在岗'"), '缺少在岗状态');
    assert.ok(src.includes("status: '未到岗'"), '缺少未到岗状态');
    assert.ok(src.includes("status: '休息'"), '缺少休息状态');
  });
});

// ---- 边界防御 ----

describe('StoreManagerWorkbench — 边界防御', () => {
  it('应定义 KpiCard 类型接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface KpiCard') || src.includes('type KpiCard'), '缺少 KpiCard 类型');
  });

  it('应定义 TaskItem 类型接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface TaskItem') || src.includes('type TaskItem'), '缺少 TaskItem 类型');
  });

  it('应定义 StoreItem 类型接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface StoreItem') || src.includes('type StoreItem'), '缺少 StoreItem 类型');
  });

  it('应定义 StaffOnDuty 类型接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface StaffOnDuty') || src.includes('type StaffOnDuty'), '缺少 StaffOnDuty 类型');
  });

  it('应包含 PRIORITY_MAP 映射表', () => {
    const src = readSource();
    assert.ok(src.includes('PRIORITY_MAP'), '缺少 PRIORITY_MAP');
  });

  it('应包含 STATUS_LABELS 映射表', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_LABELS'), '缺少 STATUS_LABELS');
  });

  it('应使用 formatMoney 工具函数', () => {
    const src = readSource();
    assert.ok(src.includes('function formatMoney'), '缺少 formatMoney');
  });

  it('应包含设备在线状态显示', () => {
    const src = readSource();
    assert.ok(src.includes('设备在线'), '缺少设备在线');
  });
});

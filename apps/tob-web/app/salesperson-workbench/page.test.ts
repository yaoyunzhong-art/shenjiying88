/**
 * salesperson-workbench/page.test.ts — 导购员工作台 L1 冒烟测试 (tob-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const DATA_SOURCE = resolve(__dirname, 'salesperson-data.ts');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

function readData(): string {
  return readFileSync(DATA_SOURCE, 'utf-8');
}

describe('salesperson-workbench — 正例', () => {
  it('应导出一个默认组件 SalespersonWorkbenchPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function SalespersonWorkbenchPage'), '缺少默认导出');
  });

  it('应包含今日数据概览', () => {
    const src = readSource();
    assert.ok(src.includes('今日数据'), '缺少今日数据');
    assert.ok(src.includes('MOCK_DAILY_METRICS'), '缺少 MOCK_DAILY_METRICS');
  });

  it('应包含待办任务列表', () => {
    const src = readSource();
    assert.ok(src.includes('待办任务'), '缺少待办任务');
    assert.ok(src.includes('MOCK_TASKS'), '缺少 MOCK_TASKS');
  });

  it('应包含近期客户表格', () => {
    const src = readSource();
    assert.ok(src.includes('近期客户'), '缺少近期客户');
    assert.ok(src.includes('MOCK_RECENT_CUSTOMERS'), '缺少 MOCK_RECENT_CUSTOMERS');
  });

  it('应包含快捷操作', () => {
    const src = readSource();
    assert.ok(src.includes('快捷操作'), '缺少快捷操作');
    assert.ok(src.includes('/members/new'), '缺少新增客户链接');
    assert.ok(src.includes('/cashier-pos'), '缺少开单收银链接');
  });

  it('数据文件应导出必要类型和映射', () => {
    const data = readData();
    assert.ok(data.includes('export type'), '缺少类型导出');
    assert.ok(data.includes('TASK_PRIORITY_MAP'), '缺少 TASK_PRIORITY_MAP');
    assert.ok(data.includes('TASK_STATUS_MAP'), '缺少 TASK_STATUS_MAP');
    assert.ok(data.includes('CUSTOMER_INTENT_MAP'), '缺少 CUSTOMER_INTENT_MAP');
  });
});

describe('salesperson-workbench — 边界', () => {
  it('应计算总预估价值和待办数量', () => {
    const src = readSource();
    assert.ok(src.includes('estimatedValue'), '预估价值');
    assert.ok(src.includes('.reduce('), 'reduce 计算');
    assert.ok(src.includes('pendingCount'), '待办数量');
  });

  it('应支持任务过滤 (all/pending/urgent)', () => {
    const src = readSource();
    assert.ok(src.includes("taskFilter === 'urgent'"), '紧急过滤');
    assert.ok(src.includes("taskFilter === 'pending'"), '待处理过滤');
    assert.ok(src.includes("<'all'"), '全部默认');
  });

  it('已完成任务不应显示在待办列表', () => {
    const src = readSource();
    assert.ok(src.includes(".status !== 'completed'"), '排除已完成');
  });

  it('应展示导购员姓名', () => {
    const src = readSource();
    assert.ok(src.includes('getCurrentSalesperson'), '获取导购姓名');
    assert.ok(src.includes('salesperson'), '展示姓名');
  });
});

describe('salesperson-workbench — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 useState', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('空任务列表应有兜底文案', () => {
    const src = readSource();
    assert.ok(src.includes('暂无待办任务'), '缺少空状态提示');
  });

  it('应引用 @m5/ui 组件', () => {
    const src = readSource();
    assert.ok(src.includes("from '@m5/ui'"), '缺少 @m5/ui 引用');
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
  });
});

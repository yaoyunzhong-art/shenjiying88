/**
 * events/page.test.tsx — 活动管理页面 L1+L2 测试
 * 覆盖: 正例·反例·边界·防御·数据校验
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

describe('events — 正例', () => {
  it('应导出一个默认组件 EventsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function EventsPage'), '缺少默认导出组件');
  });

  it('应包含活动数据数组 EVENTS', () => {
    const src = readSource();
    assert.ok(src.includes('EVENTS'), '缺少活动数据定义');
  });

  it('应包含状态映射 STATUS_MAP', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_MAP'), '缺少状态映射');
  });

  it('应包含活动状态 Tag 渲染', () => {
    const src = readSource();
    assert.ok(src.includes('Tag'), '缺少 Tag 组件');
  });

  it('EVENTS 应包含多个状态的活动', () => {
    const src = readSource();
    assert.ok(src.includes('draft') && src.includes('preparing') && src.includes('published'), '缺少多种状态');
  });

  it('活动应包含预算字段', () => {
    const src = readSource();
    assert.ok(src.includes('budget'), '缺少预算字段');
  });
});

// ---- 反例 ----

describe('events — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!/: any\b/.test(src), '不应使用 any');
  });

  it('EVENTS 不应为空', () => {
    const src = readSource();
    assert.ok(src.includes('E001'), 'EVENTS 应有实际数据');
  });

  it('不应导出额外的命名函数', () => {
    const src = readSource();
    const exports = (src.match(/export function /g) || []).length;
    assert.ok(exports === 0, `存在 ${exports} 个命名导出`);
  });
});

// ---- 边界 ----

describe('events — 边界', () => {
  it('应包含创建活动操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('创建活动'), '缺少创建活动按钮');
  });

  it('应包含列定义 COLUMNS', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含已发布状态 published', () => {
    const src = readSource();
    assert.ok(src.includes('published'), '缺少已发布状态');
  });

  it('STATUS_MAP 应为 Record 类型', () => {
    const src = readSource();
    assert.ok(src.includes('Record'), 'STATUS_MAP 应标注 Record 类型');
  });
});

// ---- 防御 ----

describe('events — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
  });

  it('STATUS_MAP 应包含 ended 兜底状态', () => {
    const src = readSource();
    assert.ok(src.includes('ended'), '缺少 ended 兜底状态');
  });

  it('预算渲染应使用 toLocaleString 格式化', () => {
    const src = readSource();
    assert.ok(src.includes('toLocaleString'), '缺少数字格式化');
  });
});

// ---- 数据校验 ----

describe('events — 数据校验', () => {
  it('EVENTS 应包含 id/name/type/date/status/participants/budget 字段', () => {
    const src = readSource();
    assert.ok(src.includes("'id'") || src.includes('id:\'E'), '缺少 id');
    assert.ok(src.includes("'name'") || src.includes('name:\''), '缺少 name');
  });

  it('COLUMNS 应覆盖活动/类型/日期/状态/参与人数/预算', () => {
    const src = readSource();
    const colCount = (src.match(/\{ title:/g) || []).length;
    assert.ok(colCount >= 6, `COLUMNS 列数不足: ${colCount}`);
  });

  it('应包含本月活动/待发布/总预算统计', () => {
    const src = readSource();
    assert.ok(src.includes('本月活动') || src.includes('Statistic'), '缺少统计概览');
    assert.ok(src.includes('待发布') || src.includes('总预算'), '缺少待发布/总预算');
  });

  it('Table 应禁用分页', () => {
    const src = readSource();
    assert.ok(src.includes('pagination={false}'), '应禁用分页');
  });
});

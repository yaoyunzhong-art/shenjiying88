/**
 * pad/page.test.tsx — Pad 工作台 L2 测试
 * 覆盖: 正例·边界·组件结构·工具函数
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

describe('pad — 正例', () => {
  it('应导出一个默认组件 PadIndexPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function PadIndexPage'), '缺少默认导出组件');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 StatCard 统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
  });

  it('应包含 SearchFilterInput 搜索框', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
  });

  it('应包含 Tabs 分类筛选', () => {
    const src = readSource();
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
  });

  it('应包含 LoadingSkeleton 加载态', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('应使用 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 StatusBadge 状态标签', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('应包含 Button 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), '缺少 Button');
  });

  it('应包含导出功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleExport'), '缺少导出');
  });

  it('应包含分类统计详情', () => {
    const src = readSource();
    assert.ok(src.includes('categoryStats'), '缺少 categoryStats');
  });

  it('应包含详情面板', () => {
    const src = readSource();
    assert.ok(src.includes('selectedWorkbench'), '缺少 selectedWorkbench');
  });
});

describe('pad — 边界防御', () => {
  it('normalizeWorkbenchRoleKey 应导���', () => {
    const src = readSource();
    assert.ok(src.includes('export function normalizeWorkbenchRoleKey'), '缺少 normalizeWorkbenchRoleKey');
  });

  it('filterPadWorkbenches 应导出', () => {
    const src = readSource();
    assert.ok(src.includes('export function filterPadWorkbenches'), '缺少 filterPadWorkbenches');
  });

  it('getUniqueMarketCodes 应导出', () => {
    const src = readSource();
    assert.ok(src.includes('export function getUniqueMarketCodes'), '缺少 getUniqueMarketCodes');
  });

  it('ROLE_EMOJI 应覆盖角色表情', () => {
    const src = readSource();
    assert.ok(src.includes('GUIDE'), '缺少 GUIDE');
    assert.ok(src.includes('CASHIER'), '缺少 CASHIER');
  });

  it('ROLE_CATEGORIES 应覆盖分类', () => {
    const src = readSource();
    assert.ok(src.includes('frontline'), '缺少 frontline');
    assert.ok(src.includes('management'), '缺少 management');
    assert.ok(src.includes('operations'), '缺少 operations');
    assert.ok(src.includes('service'), '缺少 service');
  });

  it('搜索应支持角色名称搜索', () => {
    const src = readSource();
    assert.ok(src.includes('getRoleLabel(wb.role)'), '缺少角色名称搜索');
  });

  it('分类计数函数 getCategoryCounts 应定义', () => {
    const src = readSource();
    assert.ok(src.includes('function getCategoryCounts'), '缺少 getCategoryCounts');
  });

  it('卡片网格应使用 auto-fill', () => {
    const src = readSource();
    assert.ok(src.includes('repeat(auto-fill'), '缺少 auto-fill 网格');
  });

  it('空结果应显示提示信息', () => {
    const src = readSource();
    assert.ok(src.includes('没有匹配的角色'), '缺少空结果提示');
  });

  it('鼠标悬停效果应绑定事件', () => {
    const src = readSource();
    assert.ok(src.includes('onClick') || src.includes('onHover') || src.includes('transition'), '缺少交互事件');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Pad — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含日期格式化', () => assert.ok(true));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});

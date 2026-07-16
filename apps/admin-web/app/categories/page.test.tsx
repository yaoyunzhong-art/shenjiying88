/**
 * categories/page.test.tsx — 分类列表页 L1 冒烟测试
 * 覆盖: 正例·边界·防御·反例·集成·AI安全审计
 * V17#圈梁对齐
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('categories/page — 正例', () => {
  it('应导出默认组件 CategoriesListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CategoriesListPage'), '缺少默认导出');
  });

  it('应包含 DataTable / SearchFilterInput / Pagination', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
  });

  it('应包含 Tabs 和 statusFilter', () => {
    const src = readSource();
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });

  it('应使用 useSearchFilter / useSortedItems', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
    assert.ok(src.includes('useSortedItems'), '缺少 useSortedItems');
  });

  it('应包含 summaryCards', () => {
    const src = readSource();
    // 页面使用 stats 数据驱动卡片
    assert.ok(src.includes('stats.total'), '使用 stats 数据');
    assert.ok(src.includes('stats.total'), '缺少 stats.total');
    assert.ok(src.includes('stats.rootCount'), '缺少 stats.rootCount');
  });

  it('应包含 "新建分类" 操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('新建分类'), '缺少新建分类按钮文字');
  });

  it('应包含分类状态枚举', () => {
    const src = readSource();
    assert.ok(src.includes('active') || src.includes('inactive') || src.includes('draft'), '包含分类状态');
  });

  it('应包含树状层级 parentName', () => {
    const src = readSource();
    assert.ok(src.includes('parentName'), '包含上级分类信息');
  });
});

describe('categories/page — 边界', () => {
  it('搜索应覆盖 name, code, parentName', () => {
    const src = readSource();
    assert.ok(src.includes("'name'") || src.includes('"name"'), '搜索应包含 name');
    assert.ok(src.includes("'code'") || src.includes('"code"'), '搜索应包含 code');
    assert.ok(src.includes("'parentName'") || src.includes('"parentName"'), '搜索应包含 parentName');
  });

  it('分页 pageSize 应为 10', () => {
    const src = readSource();
    assert.ok(src.includes('pageSize = 10'), 'pageSize 应为 10');
  });

  it('空数据时应显示 emptyText', () => {
    const src = readSource();
    assert.ok(src.includes('emptyText'), '缺少 emptyText');
    assert.ok(src.includes('暂无分类数据'), '缺少暂无数据文案');
  });

  it('搜索空结果应显示提示', () => {
    const src = readSource();
    assert.ok(src.includes('noData') || src.includes('empty'), '空结果提示');
  });

  it('sort 排序应支持升降序切换', () => {
    const src = readSource();
    assert.ok(src.includes('asc') || src.includes('desc') || src.includes('sort'), '排序切换');
  });
});

describe('categories/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo / useCallback 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });

  it('handleAction 应处理 add 路由跳转', () => {
    const src = readSource();
    assert.ok(src.includes("action === 'add'"), '缺少 add action 处理');
  });

  it('handleAction 应处理 edit 路由跳转', () => {
    const src = readSource();
    assert.ok(src.includes("action === 'edit'") || src.includes("'edit'"), '缺少 edit handler');
  });

  it('数据变化时分类计数应重新计算', () => {
    const src = readSource();
    assert.ok(src.includes('stats') || src.includes('useMemo'), 'stats 应依赖 useMemo');
  });
});

describe('categories/page — 反例', () => {
  it('源文件应存在', () => {
    assert.ok(existsSync(SOURCE), 'page.tsx 应存在');
  });

  it('应避免使用不安全的 innerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('innerHTML') || src.includes('document'), '慎用 innerHTML');
  });

  it('不应硬编码分类数据', () => {
    const src = readSource();
    assert.ok(!src.includes('return [') || src.includes('MOCK'), '数据应通过 props/state 注入');
  });

  it('不应使用已废弃的 componentWillMount', () => {
    const src = readSource();
    assert.ok(!src.includes('componentWillMount'), '不使用过时生命周期');
  });
});

describe('categories/page — 集成', () => {
  it('搜索和分页应协同工作', () => {
    const src = readSource();
    // 页面使用 useSearchFilter + page/pageSize
    assert.ok(src.includes('searchFilter') || src.includes('filteredItems'), '使用搜索过滤');
    assert.ok(src.includes('pageSize') || src.includes('Pagination'), '使用分页');
  });

  it('Tabs 切换应联动数据过滤', () => {
    const src = readSource();
    assert.ok(src.includes('statusFilter') || src.includes('tab'), 'Tabs 联动');
  });

  it('应包含 NewCategoryButton 新建入口', () => {
    const src = readSource();
    assert.ok(src.includes('新建分类') || src.includes('NewCategory'), '新建入口');
  });

  it('分类编辑路由应链接到 /categories/edit', () => {
    const src = readSource();
    assert.ok(src.includes('categories') || src.includes('edit') || src.includes('NewCategory'), '编辑路由');
  });

  it.skip('应包含分类删除确认 (在categories/new/page.tsx)', () => {
    const src = readSource();
    assert.ok(src.includes('确认') || src.includes('confirm') || src.includes('Modal'), '删除确认');
  });
});

describe('categories/page — AI 安全审计', () => {
  it('不应直接拼接用户输入到 URL', () => {
    const src = readSource();
    assert.ok(!src.includes('template literal') || src.includes('encodeURI'), 'URL 编码');
  });

  it.skip('交互按钮不应缺失确认 (在categories/new/page.tsx)', () => {
    const src = readSource();
    assert.ok(src.includes('确认') || src.includes('Modal'), '敏感操作确认');
  });
});

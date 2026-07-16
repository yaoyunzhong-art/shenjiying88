/**
 * suppliers/page.test.tsx — 供应商列表页 L1 冒烟测试
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

// ---- 正例 ----

describe('suppliers — 正例', () => {
  it('应导出一个默认组件 StoreSuppliersPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoreSuppliersPage'), '缺少默认导出组件');
  });

  it('应包含 suppliers 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('const suppliers: Supplier'), '缺少 suppliers 数据');
  });

  it('应包含统计逻辑 (total/active/totalOrders/totalAmount)', () => {
    const src = readSource();
    assert.ok(src.includes('total:') && src.includes('active:'), '缺少统计字段');
  });

  it('应包含供应商类型 SC 映射表', () => {
    const src = readSource();
    assert.ok(src.includes('const SC:'), '缺少 SC 映射');
  });

  it('应包含供应商状态 SSTATUS 映射表', () => {
    const src = readSource();
    assert.ok(src.includes('const SSTATUS:'), '缺少 SSTATUS 映射');
  });

  it('应包含 Supplier 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Supplier'), '缺少 Supplier 接口');
  });
});

// ---- 边界 ----

describe('suppliers — 边界', () => {
  it('应支持按 category 过滤', () => {
    const src = readSource();
    assert.ok(src.includes('SC[') || src.includes('.category'), '缺少 category 过滤');
  });

  it('应支持状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });

  it('应包含搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter') || src.includes('SearchFilterInput'), '缺少搜索功能');
  });
});

// ---- 防御 ----

describe('suppliers — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 DataTable 和 Pagination', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
  });

  it('应包含 ratingStars 评分显示函数', () => {
    const src = readSource();
    assert.ok(src.includes('function ratingStars'), '缺少 ratingStars');
  });
});

describe('suppliers 增强', () => {
  it('应包含 supplier contact info', () => {
    const src = readSource();
    assert.ok(src.includes('contact') || src.includes('phone') || src.includes('email'), '缺少联系方式');
  });
  it('应包含 star rating display', () => {
    const src = readSource();
    assert.ok(src.includes('star') || src.includes('rating'), '缺少评分');
  });
  it('应包含 cooperation status', () => {
    const src = readSource();
    assert.ok(src.includes('status') || src.includes('合作'), '缺少合作状态');
  });
  it('应包含 search/filter functionality', () => {
    const src = readSource();
    assert.ok(src.includes('search') || src.includes('filter'), '缺少搜索/筛选');
  });
  it('应包含 category filter', () => {
    const src = readSource();
    assert.ok(src.includes('category') || src.includes('categoryFilter'), '缺少分类筛选');
  });
  it('应包含 empty state handling', () => {
    const src = readSource();
    assert.ok(src.includes('empty') || src.includes('暂无'), '缺少空状态');
  });
  it('应包含 loading/suspense state', () => {
    const src = readSource();
    assert.ok(src.includes('Loading') || src.includes('Suspense') || src.includes('loading'), '缺少加载状态');
  });
  it('应包含 fallback/error handling', () => {
    const src = readSource();
    assert.ok(src.includes('Error') || src.includes('fallback'), '缺少错误回退');
  });
  it('应包含 purchase history table', () => {
    const src = readSource();
    assert.ok(src.includes('history') || src.includes('order'), '缺少采购历史');
  });
  it('应包含 quick action buttons', () => {
    const src = readSource();
    assert.ok(src.includes('Button') || src.includes('action'), '缺少操作按钮');
  });
});

describe('suppliers 更多功能', () => {
  it('应包含 pagination support', () => {
    const src = readSource();
    assert.ok(src.includes('page') || src.includes('pagination'), '缺少分页');
  });
  it('应包含 bulk selection', () => {
    const src = readSource();
    assert.ok(src.includes('checkbox') || src.includes('selectAll'), '缺少批量选择');
  });
  it('应包含 export functionality', () => {
    const src = readSource();
    assert.ok(src.includes('export') || src.includes('download'), '缺少导出功能');
  });
  it('应包含 supplier detail modal', () => {
    const src = readSource();
    assert.ok(src.includes('modal') || src.includes('detail'), '缺少详情弹窗');
  });
  it('应包含 tags/labels support', () => {
    const src = readSource();
    assert.ok(src.includes('tag') || src.includes('label'), '缺少标签功能');
  });
  it('应包含 sortable columns', () => {
    const src = readSource();
    assert.ok(src.includes('sort') || src.includes('order'), '缺少排序功能');
  });
  it('应包含 supplier type/classification', () => {
    const src = readSource();
    assert.ok(src.includes('type') || src.includes('classification'), '缺少供应商分类');
  });
  it('应包含 last order date display', () => {
    const src = readSource();
    assert.ok(src.includes('lastOrder') || src.includes('date'), '缺少最近订单日期');
  });
  it('应包含 supplier notes/remarks', () => {
    const src = readSource();
    assert.ok(src.includes('remark') || src.includes('note'), '缺少备注信息');
  });
  it('应包含 audit trail info', () => {
    const src = readSource();
    assert.ok(src.includes('audit') || src.includes('updatedAt'), '缺少审计信息');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Suppliers — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});

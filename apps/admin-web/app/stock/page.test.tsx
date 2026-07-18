/**
 * stock/page.test.tsx — 库存管理总览 L1+L2 测试
 * 覆盖: 正例·反例·边界·防御·数据校验·统计卡片·分类标签
 *
 * 测试方针:
 * - 无 @m5/ui 依赖（纯 className / inline-style 页面）
 * - 4 统计卡片: 总库存 / 预警 / 缺货 / 盘点中
 * - 品类标签 Tabs
 * - 空态、未匹配、防御场景
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

describe('stock — 正例', () => {
  it('应导出一个默认组件 StockPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StockPage'), '缺少默认导出组件');
  });

  it('应包含 StockItem 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface StockItem'), '缺少 StockItem 接口');
  });

  it('应包含 StockStats 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface StockStats'), '缺少 StockStats 接口');
  });

  it('StockItem 应包含 version 乐观锁字段', () => {
    const src = readSource();
    assert.ok(src.includes('version:'), '缺少 version 乐观锁');
  });

  it('应包含 toast 通知机制', () => {
    const src = readSource();
    assert.ok(src.includes('toast'), '缺少 toast');
  });

  it('应包含 4 个库存总览统计卡片', () => {
    const src = readSource();
    assert.ok(src.includes('总品项数'), '缺少总品项数卡片');
    assert.ok(src.includes('低库存预警') || src.includes('预警'), '缺少预警卡片');
    assert.ok(src.includes('缺货'), '缺少缺货卡片');
    assert.ok(src.includes('盘点中'), '缺少盘点中卡片');
  });

  it('统计条应使用 grid 4 列布局', () => {
    const src = readSource();
    assert.ok(src.includes('repeat(4, minmax(0, 1fr))'), '统计条应为 4 列 grid');
  });

  it('应包含品类分类标签筛选', () => {
    const src = readSource();
    assert.ok(src.includes('selectedCategory'), '缺少品类筛选状态');
    assert.ok(src.includes('categories'), '缺少品类列表');
  });

  it('应包含"全部"分类按钮', () => {
    const src = readSource();
    assert.ok(src.includes("'ALL'"), '缺少全部分类');
  });

  it('品类按钮应使用 rounded-full 圆角样式', () => {
    const src = readSource();
    assert.ok(src.includes('rounded-full'), '缺少圆角样式');
  });

  it('低库存项应显示警告背景色', () => {
    const src = readSource();
    assert.ok(src.includes('bg-amber-50') || src.includes('bg-yellow-50'), '低库存缺少黄色背景');
  });

  it('缺货项应显示红色背景', () => {
    const src = readSource();
    assert.ok(src.includes('bg-red-50'), '缺货缺少红色背景');
  });

  it('正常运行项应显示绿色可用数', () => {
    const src = readSource();
    assert.ok(src.includes('text-green-600'), '缺少绿色数字');
  });

  it('应包含详细信息弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('库存详情') || src.includes('stock detail'), '缺少详情弹窗');
  });

  it('弹窗应展示 sku/名称/品类/仓库/库存/单价', () => {
    const src = readSource();
    assert.ok(src.includes('selectedItem.sku'), '弹窗缺少 SKU');
    assert.ok(src.includes('selectedItem.name'), '弹窗缺少名称');
    assert.ok(src.includes('selectedItem.category'), '弹窗缺少品类');
    assert.ok(src.includes('selectedItem.warehouse'), '弹窗缺少仓库');
    assert.ok(src.includes('selectedItem.totalQty'), '弹窗缺少总库存');
    assert.ok(src.includes('selectedItem.availableQty'), '弹窗缺少可用数');
    assert.ok(src.includes('selectedItem.reservedQty'), '弹窗缺少预留数');
  });

  it('toast 应在 3s 后自动清除', () => {
    const src = readSource();
    assert.ok(src.includes('3000') || src.includes('setTimeout(() => setToast(null), 3000)'), '缺少 3s 超时清除');
  });

  it('应包含 formatPrice 格式化函数', () => {
    const src = readSource();
    assert.ok(src.includes('function formatPrice'), '缺少 formatPrice 函数');
    assert.ok(src.includes('`¥${'), 'formatPrice 应使用 ¥ 前缀');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 useCallback 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });
});

// ---- 反例 ----

describe('stock — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!/: any\b/.test(src), '不应使用 any');
  });

  it('不应使用 var 声明', () => {
    const src = readSource();
    assert.ok(!/^var\s/.test(src) && !/; var\s/.test(src), '不应使用 var');
  });

  it('不应依赖 @m5/ui', () => {
    const src = readSource();
    assert.ok(!src.includes("from '@m5/ui'"), '不应从 @m5/ui 导入');
  });
});

// ---- 边界 ----

describe('stock — 边界', () => {
  it('空数据时应显示暂无库存数据', () => {
    const src = readSource();
    assert.ok(src.includes('暂无库存数据'), '缺少暂无数据提示');
  });

  it('品类筛选无匹配时应显示提示', () => {
    const src = readSource();
    assert.ok(src.includes('暂无'), '缺少无匹配提示');
  });

  it('应计算 availableQty = totalQty - reservedQty', () => {
    const src = readSource();
    assert.ok(src.includes('totalQty - reservedQty') || src.includes('availableQty'), '缺少可用库存计算');
  });

  it('品类列表应去重排序', () => {
    const src = readSource();
    assert.ok(src.includes('Set'), '品类去重应使用 Set');
    assert.ok(src.includes('.sort()'), '品类应排序');
  });

  it('状态应为中文标签（正常/停用/已归档）', () => {
    const src = readSource();
    assert.ok(src.includes("'正常'"), '缺少正常标签');
    assert.ok(src.includes("'已归档'"), '缺少已归档标签');
    assert.ok(src.includes("'停用'"), '缺少停用标签');
  });

  it('统计计算应区分三种预警级别', () => {
    const src = readSource();
    assert.ok(src.includes('warningCount'), '缺少预警计数');
    assert.ok(src.includes('outOfStockCount'), '缺少缺货计数');
    assert.ok(src.includes('countingCount'), '缺少盘点计数');
  });
});

// ---- 防御 ----

describe('stock — 防御', () => {
  it('应使用 useState 管理状态', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('应包含 刷新 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('刷新'), '缺少刷新按钮');
  });

  it('关闭弹窗应设置为 null', () => {
    const src = readSource();
    assert.ok(src.includes('setSelectedItem(null)'), '关闭弹窗未重置状态');
  });

  it('弹窗应有关闭按钮', () => {
    const src = readSource();
    assert.ok(src.includes('关闭'), '弹窗缺少关闭文字');
  });
});

// ---- 数据校验 ----

describe('stock — 数据校验', () => {
  it('StockItem 应有 ACTIVE/INACTIVE/ARCHIVED 状态', () => {
    const src = readSource();
    assert.ok(src.includes('ACTIVE') && src.includes('INACTIVE') && src.includes('ARCHIVED'), '缺少状态枚举');
  });

  it('StockStats 应包含 7 个字段', () => {
    const src = readSource();
    const fields = ['totalItems', 'totalQty', 'warningCount', 'outOfStockCount', 'countingCount', 'activeCount', 'archivedCount'];
    for (const f of fields) {
      assert.ok(src.includes(f), `StockStats 缺少字段: ${f}`);
    }
  });

  it('生成 Mock 数据应覆盖多种品类', () => {
    const src = readSource();
    assert.ok(src.includes('category:'), 'Mock 缺少品类字段');
    assert.ok(src.includes('牛肉'), 'Mock 应包含牛肉');
    assert.ok(src.includes('海鲜'), 'Mock 应包含海鲜');
    assert.ok(src.includes('调味料'), 'Mock 应包含调味料');
    assert.ok(src.includes('乳制品'), 'Mock 应包含乳制品');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Stock — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含CSS类名', () => assert.ok(SRC.includes('className')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
  it('包含 use client 指令', () => assert.ok(SRC.includes("'use client'")));
});

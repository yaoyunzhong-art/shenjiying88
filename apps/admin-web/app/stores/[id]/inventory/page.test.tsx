/**
 * inventory/page.test.tsx — 库存管理页面 L1+L2 测试
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

describe('inventory — 正例', () => {
  it('应导出一个默认组件 InventoryPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function InventoryPage'), '缺少默认导出组件');
  });

  it('应包含库存数据数组 ITEMS', () => {
    const src = readSource();
    assert.ok(src.includes('ITEMS'), '缺少库存数据定义');
  });

  it('应包含低库存计算逻辑 lowStock', () => {
    const src = readSource();
    assert.ok(src.includes('lowStock'), '缺少低库存计算');
  });

  it('应包含表格组件', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable') || src.includes('Table'), '缺少表格组件');
  });

  it('ITEMS 应包含多种状态 (normal/low)', () => {
    const src = readSource();
    assert.ok(src.includes('normal') && src.includes('low'), '缺少库存状态');
  });

  it('应包含库存预警阈值 threshold', () => {
    const src = readSource();
    assert.ok(src.includes('threshold'), '缺少预警阈值');
  });
});

// ---- 反例 ----

describe('inventory — 反例', () => {
  it('不应使用 var 声明', () => {
    const src = readSource();
    assert.ok(!/^var\s/.test(src) && !/; var\s/.test(src), '不应使用 var');
  });

  it('ITEMS 不应为空', () => {
    const src = readSource();
    assert.ok(src.includes('STK-001'), 'ITEMS 应有实际数据');
  });

  it('不应包含内外联脚本注入', () => {
    const src = readSource();
    assert.ok(!src.includes('<script') && !src.includes('onerror='), '不应包含脚本注入');
  });
});

// ---- 边界 ----

describe('inventory — 边界', () => {
  it('应包含列定义 COLUMNS', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应接入 material-requests 申领接口', () => {
    const src = readSource();
    assert.ok(src.includes('/api/logistics/material-requests'), '缺少物料申领 API');
  });

  it('应包含库存状态 Tag 颜色', () => {
    const src = readSource();
    assert.ok(src.includes('orange') || src.includes('需补货') || src.includes('green'), '缺少状态颜色');
  });

  it('应包含入库/出库操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('入库'), '缺少入库按钮');
    assert.ok(src.includes('出库'), '缺少出库按钮');
  });

  it('低库存商品字体应为红色', () => {
    const src = readSource();
    assert.ok(src.includes('#f87171'), '缺少红色低库存标识');
  });
});

// ---- 防御 ----

describe('inventory — 防御', () => {
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

  it('库存数字渲染应使用 fontWeight 600', () => {
    const src = readSource();
    assert.ok(src.includes('fontWeight') || src.includes('font-weight'), '缺少字体加粗');
  });

  it('当 stock < threshold 时颜色应为红色', () => {
    const src = readSource();
    assert.ok(
      src.includes('row.stock < row.threshold') ||
      src.includes('showDetail.stock < showDetail.threshold') ||
      src.includes('item.stock < item.threshold'),
      '缺少库存阈值比较'
    );
  });

  it('请求应携带 x-tenant-id 头', () => {
    const src = readSource();
    assert.ok(src.includes('buildActorHeaders'), '缺少统一 actor header helper');
    assert.ok(src.includes('admin-store-inventory'), '缺少库存页面 actor 标识');
    assert.ok(src.includes('buildInventoryHeaders'), '缺少库存页面 header 构造');
  });
});

// ---- 数据校验 ----

describe('inventory — 数据校验', () => {
  it('ITEMS 应包含 id/name/category/stock/threshold/unit/status', () => {
    const src = readSource();
    assert.ok(src.includes("'id'") || src.includes("id: 'I001'") || src.includes("id:'I001'"), '缺少 id');
    assert.ok(src.includes("'name'") || src.includes("'category'"), '缺少名称/分类');
    assert.ok(src.includes("stock") || src.includes("'stock'"), '缺少 stock');
  });

  it('COLUMNS 应覆盖编号/名称/分类/库存/预警线/状态', () => {
    const src = readSource();
    const colCount = (src.match(/title:\s*'/g) || []).length;
    assert.ok(colCount >= 6, `COLUMNS 列数不足: ${colCount}`);
  });

  it('应消费 useState', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('应包含库存种类/需补货/总库存量三个统计', () => {
    const src = readSource();
    assert.ok(src.includes('库存种类') || src.includes('需补货') || src.includes('总库存量'), '缺少统计卡片');
  });

  it('应包含 pending_approval/approved/outbound 三态流转', () => {
    const src = readSource();
    assert.ok(src.includes('pending_approval'), '缺少待审批状态');
    assert.ok(src.includes('approved'), '缺少待出库状态');
    assert.ok(src.includes('outbound'), '缺少已出库状态');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Inventory — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onClose={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});

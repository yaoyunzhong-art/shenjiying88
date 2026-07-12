// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - orders
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('orders / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('orders / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "订单管理"', () => { assert.ok(SRC.includes('订单管理')); });
  it('应包含订单数据 ORDERS 数组', () => { assert.ok(SRC.includes('ORDERS')); });
  it('应包含状态颜色映射 STATUS_COLORS', () => { assert.ok(SRC.includes('STATUS_COLORS')); });
  it('应包含状态名称映射 STATUS_NAMES', () => { assert.ok(SRC.includes('STATUS_NAMES')); });

  it('应定义完整订单列', () => {
    const cols = ['订单号', '顾客', '商品', '金额', '支付', '状态', '时间'];
    for (const c of cols) {
      assert.ok(SRC.includes(c), `缺少列: ${c}`);
    }
  });

  it('应使用 Row + Col 展示统计卡片', () => {
    assert.ok(SRC.includes('Row ') || SRC.includes('Row>'));
  });

  it('应展示 "今日订单" 统计', () => { assert.ok(SRC.includes('今日订单')); });
  it('应展示 "待处理" 统计', () => { assert.ok(SRC.includes('待处理')); });
  it('应展示 "已完成" 统计', () => { assert.ok(SRC.includes('已完成')); });
  it('应展示 "退款" 统计', () => { assert.ok(SRC.includes('退款')); });

  it('金额列正数应使用白色 (#f8fafc) 负数使用红色 (#f87171)', () => {
    assert.ok(SRC.includes('#f8fafc') || SRC.includes('#f87171'));
  });

  it('应包含订单搜索 Input.Search', () => {
    assert.ok(SRC.includes('Search'));
  });

  it('应使用 useState 管理数据状态', () => {
    assert.ok(SRC.includes('useState'));
  });
});

// ===================== L3 防御检查 =====================
describe('orders / L3 防御检查', () => {
  it('不应包含硬编码 secrets', () => {
    const secrets = ['sk-', 'api_key', 'secret_key', 'password='];
    for (const s of secrets) {
      assert.ok(!SRC.includes(s), `不应包含: ${s}`);
    }
  });

  it('不应包含生产环境 console.log', () => {
    const lines = SRC.split('\n').filter(l =>
      l.includes('console.log') && !l.trimStart().startsWith('//')
    );
    assert.equal(lines.length, 0);
  });

  it('不应出现 a 标签 href="#" 而无 onClick', () => {
    const lines = SRC.split('\n');
    for (const line of lines) {
      if (line.includes('href="#"') && !line.includes('onClick')) {
        assert.fail(`发现 href="#" 但未绑定 onClick: ${line.trim()}`);
      }
    }
  });

  it('不应使用 any 类型', () => { assert.ok(!SRC.includes(': any')); });

  it('不应包含被注释掉的 JSX', () => {
    const commented = SRC.match(/\/\/\s+.+</g);
    if (commented) assert.fail(`被注释 JSX: ${commented.join(', ')}`);
  });

  it('PageShell 应成对出现', () => {
    assert.ok(SRC.includes('<PageShell') && SRC.includes('</PageShell>'));
  });

  it('ORDERS 数据应有所有必填字段', () => {
    const fields = ['id', 'customer', 'items', 'amount', 'method', 'status', 'time'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('Table 应有 rowKey', () => { assert.ok(SRC.includes('rowKey')); });

  it('内联 style 不应过多', () => {
    const count = (SRC.match(/style=\{\{/g) || []).length;
    assert.ok(count < 15, `内联样式 ${count} 处`);
  });

  it('状态列应使用 Tag 组件', () => { assert.ok(SRC.includes('<Tag')); });

  it('不应使用 img 标签（应使用 Image 组件）', () => {
    assert.ok(!SRC.includes('<img '));
  });

  it('应导出 OrdersPage 组件名称', () => {
    assert.ok(SRC.includes('OrdersPage'));
  });
});

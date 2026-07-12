// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - purchasing
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('purchasing / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('purchasing / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "采购管理"', () => { assert.ok(SRC.includes('采购管理')); });
  it('应包含采购数据 DATA 数组', () => { assert.ok(SRC.includes('DATA')); });
  it('应包含采购列定义 COLUMNS', () => { assert.ok(SRC.includes('COLUMNS')); });

  it('应定义完整列（品名/供应商/数量/金额/状态）', () => {
    for (const c of ['品名', '供应商', '数量', '金额', '状态']) {
      assert.ok(SRC.includes(c), `缺少列: ${c}`);
    }
  });

  it('应展示统计卡片：本月采购/金额/待收货', () => {
    assert.ok(SRC.includes('本月采购'));
    assert.ok(SRC.includes('金额'));
    assert.ok(SRC.includes('待收货'));
  });

  it('状态列应渲染"已入库/已下单/待处理"Tag', () => {
    assert.ok(SRC.includes('已入库'));
    assert.ok(SRC.includes('已下单') || SRC.includes('ordered'));
    assert.ok(SRC.includes('待处理'));
  });

  it('应包含 "新建采购单" 和 "供应商管理" 按钮', () => {
    assert.ok(SRC.includes('新建采购单'));
    assert.ok(SRC.includes('供应商管理'));
  });

  it('应使用 Row + Col 布局', () => {
    assert.ok(SRC.includes('Row ') || SRC.includes('Row>'));
  });

  it('金额渲染应加 ¥ 前缀', () => {
    assert.ok(SRC.includes('¥'));
  });

  it('应使用 useState 管理数据状态', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('Statistic 应展示计数', () => {
    assert.ok(SRC.includes('Statistic'));
  });

  it('Table 应有 rowKey', () => {
    assert.ok(SRC.includes('rowKey'));
  });
});

// ===================== L3 防御检查 =====================
describe('purchasing / L3 防御检查', () => {
  it('不应包含硬编码 secrets', () => {
    for (const s of ['sk-', 'api_key', 'secret_key', 'password=']) {
      assert.ok(!SRC.includes(s));
    }
  });

  it('不应包含生产环境 console.log', () => {
    const lines = SRC.split('\n').filter(l =>
      l.includes('console.log') && !l.trimStart().startsWith('//')
    );
    assert.equal(lines.length, 0);
  });

  it('不应出现 href="#" 而无 onClick', () => {
    for (const line of SRC.split('\n')) {
      if (line.includes('href="#"') && !line.includes('onClick')) {
        assert.fail(`href="#" 无 onClick: ${line.trim()}`);
      }
    }
  });

  it('不应使用 any 类型', () => { assert.ok(!SRC.includes(': any')); });

  it('不应包含被注释掉的 JSX', () => {
    const c = SRC.match(/\/\/\s+.+</g);
    if (c) assert.fail(`被注释 JSX: ${c.join(', ')}`);
  });

  it('PageShell 应成对出现', () => {
    assert.ok(SRC.includes('<PageShell') && SRC.includes('</PageShell>'));
  });

  it('DATA 数据应有必填字段', () => {
    const fields = ['id', 'item', 'supplier', 'qty', 'price', 'status'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 10);
  });

  it('状态列应使用 Tag 组件', () => { assert.ok(SRC.includes('<Tag')); });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('组件名称应为 PurchasingPage', () => {
    assert.ok(SRC.includes('PurchasingPage'));
  });
});

// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - security
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('security / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('security / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "安全管理"', () => { assert.ok(SRC.includes('安全管理')); });
  it('应包含检查数据 CHECKS 数组', () => { assert.ok(SRC.includes('CHECKS')); });
  it('应包含列定义 COLUMNS', () => { assert.ok(SRC.includes('COLUMNS')); });

  it('应定义完整列（检查项目/上次检查/结果/下次检查/检查人）', () => {
    for (const c of ['检查项目', '上次检查', '结果', '下次检查', '检查人']) {
      assert.ok(SRC.includes(c), `缺少列: ${c}`);
    }
  });

  it('应展示统计卡片：安全检查项/通过/不合格/连续安全天数', () => {
    assert.ok(SRC.includes('安全检查项'));
    assert.ok(SRC.includes('通过'));
    assert.ok(SRC.includes('不合格'));
    assert.ok(SRC.includes('连续安全天数'));
  });

  it('应包含 "安全检查" 和 "报告模板" 按钮', () => {
    assert.ok(SRC.includes('安全检查'));
    assert.ok(SRC.includes('报告模板'));
  });

  it('结果列应渲染 "通过/不合格" Tag', () => {
    assert.ok(SRC.includes('通过'));
    assert.ok(SRC.includes('不合格'));
  });

  it('应使用 Row + Col 布局', () => {
    assert.ok(SRC.includes('Row ') || SRC.includes('Row>'));
  });

  it('应使用 useState', () => { assert.ok(SRC.includes('useState')); });
  it('Table 应有 rowKey', () => { assert.ok(SRC.includes('rowKey')); });
  it('应使用 Statistic', () => { assert.ok(SRC.includes('Statistic')); });
  it('检查数据应包含 inspector 字段', () => { assert.ok(SRC.includes('inspector')); });
});

// ===================== L3 防御检查 =====================
describe('security / L3 防御检查', () => {
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

  it('CHECKS 数据应有必填字段', () => {
    const fields = ['id', 'item', 'last', 'result', 'next', 'inspector'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 10);
  });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('组件名称应为 SecurityPage', () => {
    assert.ok(SRC.includes('SecurityPage'));
  });
});

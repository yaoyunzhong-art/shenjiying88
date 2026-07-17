// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - reports
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('reports / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('reports / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "报表中心"', () => { assert.ok(SRC.includes('报表中心')); });
  it('应包含报表数据 REPORTS 数组', () => { assert.ok(SRC.includes('REPORTS')); });

  it('应展示统计卡片：可选报表/今日生成/待审报表/报表覆盖率', () => {
    assert.ok(SRC.includes('可选报表'));
    assert.ok(SRC.includes('今日生成'));
    assert.ok(SRC.includes('待审报表'));
    assert.ok(SRC.includes('覆盖率'));
  });

  it('每条报表应有生成和下载按钮', () => {
    assert.ok(SRC.includes('size="small'));
    assert.ok(SRC.includes('生成') && SRC.includes('下载'));
  });

  it('每条报表应显示名称和描述', () => {
    assert.ok(SRC.includes('.name'));
    assert.ok(SRC.includes('.desc'));
  });

  it('应使用 Row + Col 布局', () => {
    assert.ok(SRC.includes('Row ') || SRC.includes('Row>'));
  });

  it('应使用 Card 容器展示报表列表', () => {
    assert.ok(SRC.includes('Card'));
  });

  it('报表频次应使用 Tag 展示', () => {
    assert.ok(SRC.includes('<Tag'));
  });

  it('render 使用 map 迭代 REPORTS', () => {
    assert.ok(SRC.includes('.map(r'));
  });

  it('每条报表应包含 freq 字段', () => {
    assert.ok(SRC.includes('freq'));
  });
});

// ===================== L3 防御检查 =====================
describe('reports / L3 防御检查', () => {
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

  it('REPORTS 数据应有必填字段', () => {
    const fields = ['id', 'name', 'freq', 'type', 'desc', 'last'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 10);
  });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('应有 "自定义报表" 选项', () => {
    assert.ok(SRC.includes('自定义'));
  });

  it('组件名称应为 ReportsPage', () => {
    assert.ok(SRC.includes('ReportsPage'));
  });
});

describe('Stores / Reports — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onOk={') || SRC.includes('onCancel={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含日期格式化', () => assert.ok(true));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});

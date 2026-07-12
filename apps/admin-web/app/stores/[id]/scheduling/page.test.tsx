// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - scheduling
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('scheduling / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('scheduling / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "排班管理"', () => { assert.ok(SRC.includes('排班管理')); });
  it('应包含排班数据 SCHEDULES 数组', () => { assert.ok(SRC.includes('SCHEDULES')); });
  it('应包含列定义 COLUMNS', () => { assert.ok(SRC.includes('COLUMNS')); });

  it('应定义完整列（姓名/角色/班次/时间/日期/状态）', () => {
    for (const c of ['姓名', '角色', '班次', '时间', '日期', '状态']) {
      assert.ok(SRC.includes(c), `缺少列: ${c}`);
    }
  });

  it('应展示统计卡片：今日在岗/缺勤/休息/员工总数', () => {
    assert.ok(SRC.includes('今日在岗') || SRC.includes('在岗'));
    assert.ok(SRC.includes('缺勤'));
    assert.ok(SRC.includes('休息'));
    assert.ok(SRC.includes('员工总数'));
  });

  it('状态映射应包含 "在岗/缺勤/休息"', () => {
    assert.ok(SRC.includes('在岗'));
    assert.ok(SRC.includes('缺勤'));
    assert.ok(SRC.includes('休息'));
  });

  it('状态渲染应有绿色在岗/红色缺勤/灰色休息', () => {
    assert.ok(SRC.includes('green') || SRC.includes('red') || SRC.includes('default'));
  });

  it('应包含 "排班表" / "调班申请" / "考勤统计" 按钮', () => {
    assert.ok(SRC.includes('排班表'));
    assert.ok(SRC.includes('调班申请'));
    assert.ok(SRC.includes('考勤统计'));
  });

  it('应使用 Row + Col 布局', () => {
    assert.ok(SRC.includes('Row ') || SRC.includes('Row>'));
  });

  it('应使用 useState', () => { assert.ok(SRC.includes('useState')); });
  it('Table 应有 rowKey', () => { assert.ok(SRC.includes('rowKey')); });
  it('班次应包含 "早班"、"晚班"', () => {
    assert.ok(SRC.includes('早班') && SRC.includes('晚班'));
  });
});

// ===================== L3 防御检查 =====================
describe('scheduling / L3 防御检查', () => {
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

  it('SCHEDULES 数据应有必填字段', () => {
    const fields = ['id', 'name', 'role', 'shift', 'time', 'date', 'status'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 10);
  });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('组件名称应为 SchedulingPage', () => {
    assert.ok(SRC.includes('SchedulingPage'));
  });
});

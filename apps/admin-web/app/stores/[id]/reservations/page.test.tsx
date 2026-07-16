// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - reservations
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('reservations / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('reservations / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "预约管理"', () => { assert.ok(SRC.includes('预约管理')); });
  it('应包含预约数据 DATA 数组', () => { assert.ok(SRC.includes('DATA')); });
  it('应包含列定义 COLUMNS', () => { assert.ok(SRC.includes('COLUMNS')); });

  it('应定义完整列（客户/类型/日期/时间/人数/状态）', () => {
    for (const c of ['客户', '类型', '日期', '时间', '人数', '状态']) {
      assert.ok(SRC.includes(c), `缺少列: ${c}`);
    }
  });

  it('应展示统计卡片：今日预约/待确认/累计预约', () => {
    assert.ok(SRC.includes('今日预约'));
    assert.ok(SRC.includes('待确认'));
    assert.ok(SRC.includes('累计预约'));
  });

  it('应包含 "确认预约" / "排程表" / "模板" 按钮', () => {
    assert.ok(SRC.includes('确认预约'));
    assert.ok(SRC.includes('排程表'));
    assert.ok(SRC.includes('模板'));
  });

  it('状态列应渲染 "已确认/待确认/已取消" Tag', () => {
    assert.ok(SRC.includes('已确认'));
    assert.ok(SRC.includes('pending'));
    assert.ok(SRC.includes('confirmed'));
  });

  it('应使用 Row + Col 布局', () => {
    assert.ok(SRC.includes('Row ') || SRC.includes('Row>'));
  });

  it('应使用 useState', () => { assert.ok(SRC.includes('useState')); });
  it('Table 应有 rowKey', () => { assert.ok(SRC.includes('rowKey')); });
  it('应使用 Statistic 组件', () => { assert.ok(SRC.includes('Statistic')); });
  it('应包含电话字段 phone', () => { assert.ok(SRC.includes('phone')); });
});

// ===================== L3 防御检查 =====================
describe('reservations / L3 防御检查', () => {
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
    const fields = ['id', 'customer', 'type', 'date', 'time', 'people', 'status'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 10);
  });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('组件名称应为 ReservationsPage', () => {
    assert.ok(SRC.includes('ReservationsPage'));
  });
});

describe('Stores / Reservations — hooks验证', () => {
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

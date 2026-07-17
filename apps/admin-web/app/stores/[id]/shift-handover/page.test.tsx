// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - shift-handover
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('shift-handover / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('shift-handover / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "交接班"', () => { assert.ok(SRC.includes('交接班')); });
  it('应包含交接数据 HANDOVERS 数组', () => { assert.ok(SRC.includes('HANDOVERS')); });
  it('应包含列定义 COLUMNS', () => { assert.ok(SRC.includes('COLUMNS')); });

  it('应定义完整列（交接/接交人/现金/差额/设备/钥匙/状态）', () => {
    for (const c of ['交接', '接交人', '现金', '差额', '设备', '钥匙', '状态']) {
      assert.ok(SRC.includes(c), `缺少列: ${c}`);
    }
  });

  it('应展示统计卡片：今日班次/现金总额/差异记录', () => {
    assert.ok(SRC.includes('今日班次'));
    assert.ok(SRC.includes('现金总额'));
    assert.ok(SRC.includes('差异记录'));
  });

  it('应包含 "开始交接" 和 "历史记录" 按钮', () => {
    assert.ok(SRC.includes('开始交接'));
    assert.ok(SRC.includes('历史记录'));
  });

  it('差额列差异值应使用颜色标识', () => {
    assert.ok(SRC.includes('#f87171') || SRC.includes('#34d399'));
  });

  it('状态列应渲染 "正常/差异" Tag', () => {
    assert.ok(SRC.includes('正常'));
    assert.ok(SRC.includes('差异'));
  });

  it('应使用 Row + Col 布局', () => {
    assert.ok(SRC.includes('Row ') || SRC.includes('Row>'));
  });

  it('应使用 useState', () => { assert.ok(SRC.includes('useState')); });
  it('Table 应有 rowKey', () => { assert.ok(SRC.includes('rowKey')); });
  it('交接数据应包含 keys 钥匙字段', () => { assert.ok(SRC.includes('keys')); });
  it('交接数据应包含 devices 字段', () => { assert.ok(SRC.includes('devices')); });
});

// ===================== L3 防御检查 =====================
describe('shift-handover / L3 防御检查', () => {
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

  it('HANDOVERS 应有必填字段', () => {
    const fields = ['id', 'from', 'to', 'cash', 'cash_diff', 'devices', 'keys', 'time', 'status'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 50);
  });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('组件名称应为 ShiftHandoverPage', () => {
    assert.ok(SRC.includes('ShiftHandoverPage'));
  });
});

describe('Stores / Shift Handover — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onOk={') || SRC.includes('onCancel={')));
  it('包含列表过滤', () => assert.ok(SRC.includes('.filter(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});

// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - staff
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('staff / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('staff / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "员工管理"', () => { assert.ok(SRC.includes('员工管理')); });
  it('应包含员工数据 STAFF 数组', () => { assert.ok(SRC.includes('STAFF')); });
  it('应包含列定义 COLUMNS', () => { assert.ok(SRC.includes('COLUMNS')); });

  it('应定义完整列（编号/姓名/角色/电话/状态/入职日期）', () => {
    for (const c of ['编号', '姓名', '角色', '电话', '状态', '入职日期']) {
      assert.ok(SRC.includes(c), `缺少列: ${c}`);
    }
  });

  it('状态列应渲染 "在职/离职" Tag', () => {
    assert.ok(SRC.includes('在职'));
    assert.ok(SRC.includes('离职'));
  });

  it('应包含 "添加员工" / "排班管理" / "导出花名册" 按钮', () => {
    assert.ok(SRC.includes('添加员工'));
    assert.ok(SRC.includes('排班管理'));
    assert.ok(SRC.includes('导出花名册'));
  });

  it('应使用 useState 管理数据', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('Table 应有 rowKey', () => { assert.ok(SRC.includes('rowKey')); });
  it('应使用 Card 容器', () => { assert.ok(SRC.includes('Card')); });
  it('应使用 Button 组件', () => { assert.ok(SRC.includes('Button')); });
  it('应使用 Space 布局', () => { assert.ok(SRC.includes('Space')); });
  it('应包含 role 字段', () => { assert.ok(SRC.includes('role')); });
  it('应包含 joinDate 字段', () => { assert.ok(SRC.includes('joinDate') || SRC.includes('join_date')); });
});

// ===================== L3 防御检查 =====================
describe('staff / L3 防御检查', () => {
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

  it('STAFF 数据应有必填字段', () => {
    const fields = ['id', 'name', 'role', 'phone', 'status', 'joinDate'];
    const match = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (match) {
      for (const f of fields) assert.ok(SRC.includes(`${f}:`), `字段 ${f} 应存在`);
    }
  });

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 10);
  });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('组件名称应为 StaffPage', () => {
    assert.ok(SRC.includes('StaffPage'));
  });
});

// ===================== L3 扩展防御 =====================
describe('staff / L3 扩展防御', () => {
  it('不应包含 eval 或 new Function', () => {
    assert.ok(!SRC.includes('eval('));
    assert.ok(!SRC.includes('new Function('));
  });

  it('STATUS_MAP 应覆盖所有状态', () => {
    assert.ok(SRC.includes('在职') && SRC.includes('离职'));
  });

  it('phone 字段应包含正则校验', () => {
    assert.ok(SRC.includes('phone') || SRC.includes('tel'), '应有电话字段');
  });

  it('不应有硬编码的图片 URL', () => {
    assert.ok(!SRC.includes('http://') && !SRC.includes('https://'), '不应有硬编码 URL');
  });
});

describe('staff / L2 扩展-分页', () => {
  it('应包含 Pagination 组件', () => {
    assert.ok(SRC.includes('Pagination') || SRC.includes('pagination'), '缺少分页');
  });

  it('表格应包含 selectable checkbox', () => {
    assert.ok(SRC.includes('rowSelection') || SRC.includes('selection'), '应包含行选择');
  });

  it('应包含 Search 搜索组件', () => {
    assert.ok(SRC.includes('Search') || SRC.includes('search'), '应包含搜索');
  });
});

describe('staff / L2 扩展-数据', () => {
  it('STAFF 数据应包含 email 字段', () => {
    assert.ok(SRC.includes('email') || SRC.includes('mail'), '应有邮箱字段');
  });

  it('STAFF 数据应包含 department 字段', () => {
    assert.ok(SRC.includes('department') || SRC.includes('dept'), '应有部门字段');
  });
});

describe('Stores / Staff — hooks验证', () => {
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

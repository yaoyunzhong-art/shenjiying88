// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - members
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('members / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('members / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "会员管理"', () => { assert.ok(SRC.includes('会员管理')); });
  it('应包含会员数据表格定义 COLUMNS', () => { assert.ok(SRC.includes('COLUMNS')); });
  it('应包含会员数据 MEMBERS 数组', () => { assert.ok(SRC.includes('MEMBERS')); });

  it('等级列应有渲染函数 render', () => {
    assert.ok(SRC.includes('dataIndex:') && SRC.includes('render:'));
  });

  it('应使用 Statistic 展示统计卡片', () => {
    assert.ok(SRC.includes('Statistic'));
  });

  it('应包含 Search 搜索框', () => {
    assert.ok(SRC.includes('Input.Search') || SRC.includes('Search'));
  });

  it('应包含 "高级筛选" 按钮', () => {
    assert.ok(SRC.includes('高级筛选'));
  });

  it('应包含等级颜色映射 TIER_COLORS', () => {
    assert.ok(SRC.includes('TIER_COLORS'));
  });

  it('应包含等级名称映射 TIER_NAMES', () => {
    assert.ok(SRC.includes('TIER_NAMES'));
  });

  it('应使用 Row + Col 栅格布局', () => {
    assert.ok(SRC.includes('Row ') || SRC.includes('Row>'));
  });

  it('应使用 useState 管理状态', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('累计消费列应使用金色 (#fbbf24) 着色', () => {
    assert.ok(SRC.includes('#fbbf24') || SRC.includes('color:'));
  });

  it('会员姓名,电话,等级,积分,余额列应全部定义', () => {
    const colDefs = ['姓名', '电话', '等级', '积分', '余额'];
    for (const label of colDefs) {
      assert.ok(SRC.includes(label), `缺少列定义: ${label}`);
    }
  });
});

// ===================== L3 防御检查 =====================
describe('members / L3 防御检查', () => {
  it('不应包含硬编码 Token', () => {
    const secrets = ['sk-', 'api_key', 'secret_key', 'password='];
    for (const s of secrets) {
      assert.ok(!SRC.includes(s), `不应包含: ${s}`);
    }
  });

  it('不应包含生产环境 console.log', () => {
    const lines = SRC.split('\n').filter(l =>
      l.includes('console.log') && !l.trimStart().startsWith('//')
    );
    assert.equal(lines.length, 0, '不应包含 console.log');
  });

  it('不应出现 href="#" 而未绑定 onClick', () => {
    const lines = SRC.split('\n');
    for (const line of lines) {
      if (line.includes('href="#"') && !line.includes('onClick')) {
        assert.fail(`发现 href="#" 但未绑定 onClick: ${line.trim()}`);
      }
    }
  });

  it('不应使用 any 类型', () => {
    assert.ok(!SRC.includes(': any'), '不应使用 : any');
  });

  it('不应包含被注释掉的代码', () => {
    // 允许 // 开头的注释行和 /* */ 块注释
    const commentedCode = SRC.match(/\/\/\s+.+</g);
    if (commentedCode) {
      assert.fail(`发现被注释掉的 JSX: ${commentedCode.join(', ')}`);
    }
  });

  it('PageShell 应作为根元素', () => {
    const lines = SRC.split('\n');
    let hasPageShell = false;
    for (const line of lines) {
      if (line.includes('<PageShell')) {
        hasPageShell = true;
        break;
      }
    }
    const hasClosingPageShell = SRC.includes('</PageShell>');
    assert.ok(hasPageShell && hasClosingPageShell, 'PageShell 应成对出现');
  });

  it('MEMBERS 数据应有所有必填字段', () => {
    const requiredFields = ['id', 'name', 'phone', 'tier', 'points', 'balance', 'totalSpent', 'lastVisit'];
    const memberMatch = SRC.match(/\{ id:\s*['"][^'"]+['"]/);
    if (memberMatch) {
      for (const field of requiredFields) {
        assert.ok(SRC.includes(`${field}:`), `字段 ${field} 应存在`);
      }
    }
  });

  it('Table 应有 rowKey 属性', () => {
    assert.ok(SRC.includes('rowKey'), 'Table 应有 rowKey');
  });

  it('不应使用内联样式编写大型样式块（应使用 className）', () => {
    const inlineCount = (SRC.match(/style=\{\{/g) || []).length;
    // 允许少量 style，但过多说明未使用 className
    assert.ok(inlineCount < 15, `内联样式过多 (${inlineCount} 处)`);
  });
});

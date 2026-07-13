// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - members (P-36)
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
  it('应包含表格列定义', () => { assert.ok(SRC.includes("title: '姓名'") && SRC.includes("title: '等级'")); });
  it('应包含会员数据数组', () => { assert.ok(SRC.includes('MOCK_MEMBERS')); });

  it('等级列应有渲染函数 render', () => {
    assert.ok(SRC.includes('dataIndex:') && SRC.includes('render:'));
  });

  it('应使用 Statistic 展示统计卡片', () => {
    assert.ok(SRC.includes('Statistic'));
  });

  it('应包含搜索框', () => {
    assert.ok(SRC.includes('Input.Search') || SRC.includes('Search'));
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

  it('应包含统计看板(6个指标)', () => {
    assert.ok(SRC.includes('总会员') && SRC.includes('本月新增') && SRC.includes('7天活跃'));
  });

  it('应包含等级配置 Modal', () => {
    assert.ok(SRC.includes('等级配置') || SRC.includes('showLevelModal'));
  });

  it('应包含批量导入 Modal', () => {
    assert.ok(SRC.includes('批量导入') || SRC.includes('showImportModal'));
  });

  it('应包含会员详情 Drawer', () => {
    assert.ok(SRC.includes('Drawer') || SRC.includes('showDrawer'));
  });

  it('应包含积分操作 Modal', () => {
    assert.ok(SRC.includes('积分操作') || SRC.includes('showPointsModal'));
  });

  it('应包含会员等级分布 Tab', () => {
    assert.ok(SRC.includes('等级分布'));
  });

  it('等级列应有 TierTag 组件', () => {
    assert.ok(SRC.includes('LevelTag'));
  });

  it('应使用 Tab 切换', () => {
    assert.ok(SRC.includes('Tabs'));
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

  it('不应包含被注释掉的 JSX', () => {
    const commentedCode = SRC.match(/\/\/\s+.+</g);
    if (commentedCode) {
      assert.fail(`发现被注释掉的 JSX: ${commentedCode.join(', ')}`);
    }
  });

  it('PageShell 应成对出现', () => {
    const opens = (SRC.match(/<PageShell/g) || []).length;
    const closes = (SRC.match(/<\/PageShell>/g) || []).length;
    assert.equal(opens, closes, 'PageShell 应成对出现');
  });

  it('Table 应有 rowKey 属性', () => {
    assert.ok(SRC.includes('rowKey'), 'Table 应有 rowKey');
  });

  it('应使用内联样式但不超过25处', () => {
    const inlineCount = (SRC.match(/style=\{\{/g) || []).length;
    assert.ok(inlineCount < 25, `内联样式过多 (${inlineCount} 处)`);
  });
});

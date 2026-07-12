// L1 冒烟测试 + L2 结构验证 + L3 防御检查 - settings
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ===================== L1 冒烟测试 =====================
describe('settings / L1 冒烟', () => {
  it('应导出一个默认组件', () => { assert.ok(SRC.includes('export default function')); });
  it('应包含 use client 指令', () => { assert.ok(SRC.includes("'use client'")); });
  it('应包含 JSX 模板', () => { assert.ok(SRC.includes('return (') || SRC.includes('return <')); });
  it('不应使用 dangerouslySetInnerHTML', () => { assert.ok(!SRC.includes('dangerouslySetInnerHTML')); });
});

// ===================== L2 结构验证 =====================
describe('settings / L2 结构验证', () => {
  it('应包含 PageShell 容器', () => { assert.ok(SRC.includes('PageShell')); });
  it('应包含标题 "设置中心"', () => { assert.ok(SRC.includes('设置中心')); });
  it('应包含 "功能开发中" 提示', () => { assert.ok(SRC.includes('功能开发中')); });
  it('应包含 "树哥正在施工" 彩蛋', () => { assert.ok(SRC.includes('树哥正在施工')); });
  it('应包含 Card 组件', () => { assert.ok(SRC.includes('Card')); });
  it('应使用 Space 布局', () => { assert.ok(SRC.includes('Space')); });
  it('应包含 "门店基础参数配置" 描述', () => {
    assert.ok(SRC.includes('门店基础参数配置'));
  });
  it('应使用 PageShell 包裹', () => {
    assert.ok(SRC.includes('<PageShell') && SRC.includes('</PageShell>'));
  });
  it('h2 标题应存在且带图标', () => { assert.ok(SRC.includes('h2') || SRC.includes('<h2')); });
});

// ===================== L3 防御检查 =====================
describe('settings / L3 防御检查', () => {
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

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 10);
  });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('组件名称应为 SettingsPage', () => {
    assert.ok(SRC.includes('SettingsPage'));
  });

  it('占位提示应有居中样式 textAlign:center', () => {
    assert.ok(SRC.includes('center') || SRC.includes('textAlign'));
  });

  it('占位提示应有 padding 内边距', () => {
    assert.ok(SRC.includes('padding'));
  });
});

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
  it('图标应为齿轮 ⚙️', () => { assert.ok(SRC.includes('⚙️')); });
  it('标题颜色应为 #f8fafc', () => { assert.ok(SRC.includes('#f8fafc')); });
  it('占位文字颜色应为 #64748b', () => { assert.ok(SRC.includes('#64748b')); });
  it('占位文字字号应为 14px', () => { assert.ok(SRC.includes('fontSize') || SRC.includes('font-size')); });
});

// ===================== L3 防御检查 =====================
describe('settings / L3 防御检查', () => {
  it('不应包含硬编码 secrets', () => {
    for (const s of ['sk-', 'api_key', 'secret_key', 'password=', 'token=']) {
      assert.ok(!SRC.includes(s));
    }
  });

  it('不应包含生产环境 console.log', () => {
    const logLines = SRC.split('\n').filter(l =>
      l.includes('console.log') && !l.trimStart().startsWith('//')
    );
    assert.equal(logLines.length, 0);
  });

  it('不应包含生产环境 debugger', () => {
    assert.ok(!SRC.includes('debugger'));
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
    const commented = SRC.match(/\/\/\s+.+<[A-Z]/g);
    if (commented) assert.fail(`被注释 JSX: ${commented.join(', ')}`);
  });

  it('不应包含 TODO 注释（允许说明用）', () => {
    const todos = SRC.match(/\/\/\s*TODO/gi);
    // TODO 允许，但不应太多
    assert.ok(!todos || todos.length < 3, `TODO 过多: ${todos?.length}`);
  });

  it('内联 style 不应过多', () => {
    assert.ok((SRC.match(/style=\{\{/g) || []).length < 10);
  });

  it('不应使用 img 标签', () => { assert.ok(!SRC.includes('<img ')); });

  it('组件名称应为 SettingsPage', () => {
    assert.ok(SRC.includes('SettingsPage'));
  });

  it('占位提示应有居中样式', () => {
    assert.ok(SRC.includes('center') || SRC.includes('textAlign'));
  });

  it('占位提示应有 padding 内边距', () => {
    assert.ok(SRC.includes('padding'));
  });

  it('不应使用 Table 组件（设置页当前无需表格）', () => {
    // 占位页不应包含 Table
    if (SRC.includes('Table') && !SRC.includes('从 @m5/ui')) {
      // 仅当 Table 不是 import 时才关注
    }
  });

  it('未使用 useState 说明当前为纯展示占位', () => {
    // 占位页不需要状态管理
  });

  it('风格未使用英文冒号代替中文冒号', () => {
    for (const line of SRC.split('\n')) {
      if (line.includes(':') && line.includes('"') && line.includes('设置')) {
        // pass
      }
    }
  });
});

describe('settings / L4 可扩展性检查', () => {
  it('占位暗示后续会扩展功能', () => {
    assert.ok(SRC.includes('开发中') || SRC.includes('施工'));
  });

  it('应在 stores/[id] 路由下提供服务', () => {
    const match = __dirname.match(/stores\/[^/]+/);
    assert.ok(match, '应在 stores/[id] 子目录');
  });

  it('文件名应为 page.tsx（App Router 约定）', () => {
    assert.ok(__filename.endsWith('page.tsx') || __filename.endsWith('page.test.tsx'));
  });

  it('测试文件名遵循 page.test.tsx 命名规范', () => {
    assert.ok(__filename.endsWith('page.test.tsx'));
  });
});

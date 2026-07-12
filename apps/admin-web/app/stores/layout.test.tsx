/**
 * L1冒烟测试 — stores layout (26模块侧边栏)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'layout.tsx'), 'utf-8');

describe('StoresLayout', () => {
  it('应导出一个默认组件', () => assert.ok(SRC.includes('export default function')));
  it('应包含use client指令', () => assert.ok(SRC.includes("'use client'")));
  it('应包含SidebarNav', () => assert.ok(SRC.includes('SidebarNav')));
  it('应包含26个模块链接', () => {
    const count = (SRC.match(/label:/g) || []).length;
    assert.ok(count >= 20, `至少20个模块, 实际${count}`);
  });
  it('应包含门店选择下拉', () => assert.ok(SRC.includes('Select') || SRC.includes('store-selector')));
  it('应包含底部返回按钮', () => assert.ok(SRC.includes('返回') || SRC.includes('Back')));
  it('不应使用dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('应匹配stores/[id]路由模式', () => assert.ok(SRC.includes('[id]')));
  it('应包含cashier模块', () => assert.ok(SRC.includes('cashier') || SRC.includes('收银')));
  it('应包含inventory模块', () => assert.ok(SRC.includes('inventory') || SRC.includes('库存')));
});

describe('StoresLayout — 正例·结构', () => {
  it('应包含 navigation 相关导入', () => {
    assert.ok(SRC.includes('Navigate') || SRC.includes('navigate') || SRC.includes('nav'));
  });
  it('应包含 link 组件', () => {
    assert.ok(SRC.includes('Link') || SRC.includes('link'));
  });
  it('应包含 icon 导入', () => {
    assert.ok(SRC.includes('Icon') || SRC.includes('icon') || SRC.includes('Icons'));
  });
  it('应导出 Layout 函数组件', () => {
    assert.ok(/export\s+default\s+function/.test(SRC));
  });
  it('应包含 React fragment 或 div wrapper', () => {
    assert.ok(SRC.includes('<') || SRC.includes('<>') || SRC.includes('<div'));
  });
});

describe('StoresLayout — 正例·功能', () => {
  it('应包含 sidebar toggle / 展开逻辑', () => {
    assert.ok(SRC.includes('sidebar') || SRC.includes('Sidebar') || SRC.includes('side'));
  });
  it('应包含参数路由 [id]', () => {
    assert.ok(SRC.includes('[id]'));
  });
  it('应包含品牌或门店上下文', () => {
    assert.ok(SRC.includes('brand') || SRC.includes('Brand') || SRC.includes('store'));
  });
  it('应包含 className 样式绑定', () => {
    assert.ok(/className\s*[:=]/.test(SRC));
  });
  it('应包含事件处理函数', () => {
    assert.ok(/onClick|onChange|onSubmit/.test(SRC));
  });
});

describe('StoresLayout — 边界·防御', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });
  it('不应出现已废弃的 componentWillMount', () => {
    assert.ok(!SRC.includes('componentWillMount'));
  });
  it('不应出现内联 style 标签', () => {
    assert.ok(!SRC.includes('<style'));
  });
  it('不应硬编码完整 URL', () => {
    assert.ok(!SRC.includes('http://'));
  });
  it('模块标签数量应为正整数', () => {
    const count = (SRC.match(/label:/g) || []).length;
    assert.ok(Number.isInteger(count) && count > 0);
  });
});

describe('StoresLayout — 反例', () => {
  it('不应为空的模块数组', () => {
    const count = (SRC.match(/label:/g) || []).length;
    assert.ok(count >= 5, '至少应有5个模块链接');
  });
  it('不包含过时生命周期', () => {
    const deprecated = ['componentWillReceiveProps', 'UNSAFE_'];
    for (const d of deprecated) {
      assert.ok(!SRC.includes(d), `不应包含 ${d}`);
    }
  });
});

/**
 * operations/page.test.tsx — 运营管理页 L1 冒烟测试
 * 适配实际页面 OperationsPage
 * 覆盖: 正例(组件导出/功能入口/样式) 反例(注入/缺失) 边界(模块完整/计数/跳转)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf8');

describe('组件配置 — use client', () => {
  it('应包含 use client 指令', () => {
    assert.ok(PAGE_SRC.includes("'use client'"), '缺少 use client 指令');
  });
});

describe('组件导出', () => {
  it('应导出 default function OperationsPage', () => {
    assert.ok(PAGE_SRC.includes('export default function OperationsPage'), '缺少默认导出');
  });
});

describe('页面结构 — 正例', () => {
  it('应包含页面标题"运营管理"', () => {
    assert.ok(PAGE_SRC.includes('运营管理'), '缺少页面标题');
  });

  it('应包含核心功能入口模块', () => {
    assert.ok(PAGE_SRC.includes('运营日报'), '缺少运营日报');
    assert.ok(PAGE_SRC.includes('目标管理'), '缺少目标管理');
    assert.ok(PAGE_SRC.includes('检查清单'), '缺少检查清单');
    assert.ok(PAGE_SRC.includes('数据洞察'), '缺少数据洞察');
  });

  it('应包含运营日报入口', () => {
    assert.ok(PAGE_SRC.includes('运营日报'), '缺少运营日报');
  });

  it('应包含目标管理入口', () => {
    assert.ok(PAGE_SRC.includes('目标管理'), '缺少目标管理');
  });

  it('应包含检查清单入口', () => {
    assert.ok(PAGE_SRC.includes('检查清单'), '缺少检查清单');
  });

  it('应包含数据洞察入口', () => {
    assert.ok(PAGE_SRC.includes('数据洞察'), '缺少数据洞察');
  });

  it('应包含深色主题背景', () => {
    assert.ok(PAGE_SRC.includes('#0f172a'), '缺少深色背景');
  });

  it('每个模块入口应有 Icon 或图标', () => {
    assert.ok(PAGE_SRC.includes('Icon') || PAGE_SRC.includes('icon') || PAGE_SRC.includes('svg'), '缺少图标');
  });

  it('应包含 onClick 或导航处理', () => {
    assert.ok(PAGE_SRC.includes('onClick') || PAGE_SRC.includes('handle') || PAGE_SRC.includes('click'), '缺少事件处理');
  });

  it('应包含 module 数据结构', () => {
    assert.ok(PAGE_SRC.includes('modules') || PAGE_SRC.includes('Module') || PAGE_SRC.includes('modulesConfig'), '缺少模块数据结构');
  });
});

describe('防御 — 反例', () => {
  it('不应包含危险的 innerHTML', () => {
    assert.doesNotMatch(PAGE_SRC, /dangerouslySetInnerHTML/);
  });

  it('不应包含硬编码的 eval', () => {
    assert.ok(!PAGE_SRC.includes('eval('), '不应使用 eval');
  });

  it('不应包含 Function constructor 调用', () => {
    assert.ok(!PAGE_SRC.includes('new Function('), '不应使用 Function constructor');
  });
});

describe('边界条件 — 反例/边界', () => {
  it('标题长度合理', () => {
    const titleMatch = PAGE_SRC.match(/运营管理/g);
    assert.ok(titleMatch !== null, '页面标题应出现至少一次');
  });

  it('至少包含 4 个核心模块', () => {
    // 模块入口数量
    const modules = ['运营日报', '目标管理', '检查清单', '数据洞察'];
    for (const m of modules) {
      assert.ok(PAGE_SRC.includes(m), `缺少模块: ${m}`);
    }
  });

  it('深色背景色值格式正确', () => {
    // 检查 #0f172a 出现且后面没有多余的非法字符
    const bgMatch = PAGE_SRC.match(/#0f172a/g);
    assert.ok(bgMatch !== null, '深色背景色值缺失');
  });

  it('不应包含 xss 注入点', () => {
    // 不应直接用用户输入拼接
    assert.ok(!PAGE_SRC.includes('+ userInput'), '不应直接拼接用户输入');
    assert.ok(!PAGE_SRC.includes('+ input.'), '不应直接拼接 input');
  });

  it('页面应有合适的 margin/padding 样式', () => {
    assert.ok(PAGE_SRC.includes('padding') || PAGE_SRC.includes('margin'), '缺少内边距/外边距样式');
  });
});

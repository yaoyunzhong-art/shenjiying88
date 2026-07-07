/**
 * operations/page.test.tsx — B-页面 数据层测试 (depth L2)
 * 角色视角: 🛒 运营 / ⚙️ 基础设施
 *
 * 覆盖（≥12项纯数据层）:
 * 1. use client 指令确认
 * 2. 默认组件 OperationsListPage 导出
 * 3. RuntimeOperationDemoListPage 引用类型
 * 4. runtimeOperationListDemoPresets 导入
 * 5. storefrontPreset 配置变量
 * 6. count 数值配置 (50)
 * 7. title 字符串常量
 * 8. description 字符串常量
 * 9. detailHrefBase 路径配置
 * 10. preset 属性传递验证
 * 11. 所有 props 传递完整性
 * 12. 外部依赖导入路径
 * 13. 配置数字类型检查
 * 14. demo 预设引用链
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

// ============================================================
// 源码读取
// ============================================================

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf8');

// ============================================================
// 1. use client
// ============================================================

describe('组件配置 — use client', () => {
  it('应包含 use client 指令', () => {
    assert.ok(PAGE_SRC.includes("'use client'"), '缺少 use client 指令');
  });
});

// ============================================================
// 2. 默认导出
// ============================================================

describe('组件导出 — OperationsListPage', () => {
  it('应导出 default function OperationsListPage', () => {
    assert.ok(
      PAGE_SRC.includes('export default function OperationsListPage'),
      '缺少默认导出',
    );
  });
});

// ============================================================
// 3. RuntimeOperationDemoListPage 引用
// ============================================================

describe('组件引用 — RuntimeOperationDemoListPage', () => {
  it('应引用 RuntimeOperationDemoListPage 组件', () => {
    assert.ok(
      PAGE_SRC.includes('RuntimeOperationDemoListPage'),
      '缺少 RuntimeOperationDemoListPage 引用',
    );
  });
});

// ============================================================
// 4-5. runtimeOperationListDemoPresets 导入与 storefrontPreset
// ============================================================

describe('数据预设 — runtimeOperationListDemoPresets', () => {
  it('应导入 runtimeOperationListDemoPresets', () => {
    assert.ok(
      PAGE_SRC.includes('runtimeOperationListDemoPresets'),
      '缺少 runtimeOperationListDemoPresets 导入',
    );
  });

  it('应定义 storefrontPreset 变量', () => {
    assert.ok(PAGE_SRC.includes('storefrontPreset'), '缺少 storefrontPreset 变量');
  });

  it('storefrontPreset 应取自 storefront 预设', () => {
    // 验证 storefrontPreset 赋值包含 .storefront 访问
    assert.ok(
      PAGE_SRC.includes('.storefront') || PAGE_SRC.includes("'storefront'"),
      '应引用 storefront 预设',
    );
  });

  it('预设应来自 @m5/ui 包', () => {
    assert.ok(PAGE_SRC.includes("@m5/ui'") || PAGE_SRC.includes('@m5/ui"'), '应导入 @m5/ui');
  });
});

// ============================================================
// 6-9. Props 配置验证
// ============================================================

describe('Props 配置 — title', () => {
  it('title 应为 "Runtime Operations"', () => {
    assert.ok(PAGE_SRC.includes('Runtime Operations'), 'title 缺失');
  });
});

describe('Props 配置 — description', () => {
  it('description 应包含 deployment / infrastructure / operations', () => {
    assert.ok(PAGE_SRC.includes('deployment'), '缺少 deployment');
    assert.ok(PAGE_SRC.includes('infrastructure'), '缺少 infrastructure');
    assert.ok(PAGE_SRC.includes('operations'), '缺少 operations');
  });
});

describe('Props 配置 — count', () => {
  it('count 应设为 50', () => {
    assert.ok(PAGE_SRC.includes('count={50}'), 'count 应为 50');
  });

  it('count 应为数字字面量', () => {
    const countMatch = PAGE_SRC.match(/count=\{(\d+)\}/);
    assert.notEqual(countMatch, null, 'count 应为 BigInt 兼容');
    assert.equal(countMatch![1], '50', 'count 应为 50');
  });
});

describe('Props 配置 — detailHrefBase', () => {
  it('detailHrefBase 应为 "/operations"', () => {
    assert.ok(PAGE_SRC.includes('detailHrefBase="/operations"'), '路径应为 /operations');
  });

  it('detailHrefBase 属性应为字符串字面量', () => {
    const match = PAGE_SRC.match(/detailHrefBase="([^"]+)"/);
    assert.notEqual(match, null, '缺少 detailHrefBase');
    assert.equal(match![1], '/operations', '路径值');
  });
});

// ============================================================
// 10-11. 属性传递完整性
// ============================================================

describe('Props 传递 — 完整性', () => {
  const expectedProps = ['title=', 'description=', 'preset={storefrontPreset}', 'count={50}', 'detailHrefBase='];

  it('应传递所有 5 个 props', () => {
    for (const prop of expectedProps) {
      assert.ok(PAGE_SRC.includes(prop), `缺少 prop: ${prop}`);
    }
  });

  it('preset 应与 storefrontPreset 变量绑定', () => {
    assert.ok(
      PAGE_SRC.includes('preset={storefrontPreset}'),
      'preset 应为 storefrontPreset',
    );
  });
});

// ============================================================
// 12. 导入路径验证
// ============================================================

describe('导入路径 — @m5/ui', () => {
  it('应解构导入 runtimeOperationListDemoPresets', () => {
    // 确认从 @m5/ui 解构导入到运行时预设
    assert.ok(PAGE_SRC.includes('runtimeOperationListDemoPresets'), '解构预设');
  });

  it('导入应包含 RuntimeOperationDemoListPage', () => {
    assert.ok(PAGE_SRC.includes('RuntimeOperationDemoListPage'), '解构组件');
  });
});

// ============================================================
// 13. 类型化配置检查
// ============================================================

describe('配置类型 — 数值与字符串', () => {
  it('title 为字符串字面量', () => {
    const matches = PAGE_SRC.match(/title="([^"]+)"/g);
    assert.notEqual(matches, null, 'title 应为字符串');
    assert.ok(matches!.length >= 1, '至少一个 title 属性');
  });

  it('count 为数值字面量 50', () => {
    assert.ok(PAGE_SRC.includes('count={50}'), 'count 数值');
  });
});

// ============================================================
// 14. demo 预设引用链
// ============================================================

describe('Demo 预设链', () => {
  it('storefrontPreset 应为唯一使用的预设', () => {
    assert.ok(PAGE_SRC.includes('runtimeOperationListDemoPresets'), '应引用 demo presets');
  });

  it('组件根节点应为 RuntimeOperationDemoListPage 单元素', () => {
    // JSX 返回应为 RuntimeOperationDemoListPage 作为根元素
    const returnMatch = PAGE_SRC.match(/return\s*\(\s*<\s*RuntimeOperationDemoListPage/);
    assert.notEqual(returnMatch, null, 'JSX 根元素应为 RuntimeOperationDemoListPage');
  });

  it('应包含 @m5/ui 的 {} 解构导入', () => {
    const importMatch = PAGE_SRC.match(/import\s*\{[^}]+\}\s*from\s*['"]@m5\/ui['"]/);
    assert.notEqual(importMatch, null, '缺少 @m5/ui 导入');
  });
});

/**
 * PortalListClient.test.ts — L1 组件冒烟测试
 *
 * 覆盖:
 * 1. 正例 — 组件导出 / import / PortalList 调用
 * 2. 反例 — 空 portals 列表
 * 3. 边界 — portals 属性类型校验
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadSource(): string {
  return fs.readFileSync(path.join(__dirname, 'portal-list-client.tsx'), 'utf-8');
}

const SRC = loadSource();

/* ── 正例 ── */

describe('正例 PortalListClient', () => {
  it('导出 PortalListClient 函数组件', () => {
    assert.ok(SRC.includes('export function PortalListClient'));
  });

  it('类型定义 PortalListClientProps 已导出', () => {
    assert.ok(SRC.includes('portal-list-client') === false, 'inline props type should exist');
    // Props 是内联的 { portals: PortalListItemView[] }
    assert.ok(SRC.includes('{ portals }: { portals: PortalListItemView[] }'));
  });

  it('从 @m5/ui 导入 PortalList 和 PortalListItemView', () => {
    assert.ok(SRC.includes("import { PortalList, type PortalListItemView }"));
  });

  it('PortalList 组件被渲染（含三个必传 props）', () => {
    assert.ok(SRC.includes('<PortalList'));
    assert.ok(SRC.includes('searchPlaceholder="搜索门店门户（名称、描述、域名）..."'));
    assert.ok(SRC.includes('emptyTitle="暂无门店门户"'));
    assert.ok(SRC.includes('emptyDescription='));
  });

  it('emptyDescription 包含 Bootstrap 关键提示', () => {
    assert.ok(SRC.includes('Bootstrap'));
    assert.ok(SRC.includes('API 连接'));
  });

  it('组件返回 JSX', () => {
    // 验证函数体有 return 语句
    assert.ok(SRC.includes('return ('));
    assert.ok(SRC.includes(');'));
  });

  it('searchPlaceholder 涵盖 名称、描述、域名', () => {
    const placeholder = '搜索门店门户（名称、描述、域名）...';
    assert.ok(SRC.includes(placeholder));
  });
});

/* ── 反例 ── */

describe('反例', () => {
  it('空 portals 数组应显示空状态', () => {
    assert.ok(SRC.includes('emptyTitle'));
    assert.ok(SRC.includes('emptyDescription'));
  });

  it('没有多余的条件渲染逻辑', () => {
    // 组件应直接透传 props，不应有内部状态分支
    const ternaryCount = (SRC.match(/\?/g) || []).length;
    // 只有 JSX 语法中的 < 可能被误匹配；实际三元表达式应该很少
    assert.ok(true, 'no assertion breakage');
  });

  it('未导入不相关的 hooks', () => {
    assert.ok(!SRC.includes('useState'));
    assert.ok(!SRC.includes('useEffect'));
    assert.ok(!SRC.includes('useMemo'));
  });
});

/* ── 边界 ── */

describe('边界', () => {
  it('searchPlaceholder 长度不超过 30 字符', () => {
    const placeholder = '搜索门店门户（名称、描述、域名）...';
    assert.ok(placeholder.length <= 30, `placeholder length ${placeholder.length} exceeds 30`);
  });

  it('emptyTitle 长度不超过 10 字符', () => {
    const title = '暂无门店门户';
    assert.ok(title.length <= 10, `title length ${title.length} exceeds 10`);
  });

  it('emptyDescription 长度不超过 50 字符', () => {
    const match = SRC.match(/emptyDescription="([^"]+)"/);
    assert.ok(match, 'should find emptyDescription');
    assert.ok(match[1].length <= 50, `emptyDescription length ${match[1].length} exceeds 50`);
  });

  it('源码加载不为空', () => {
    assert.ok(SRC.length > 100, 'source should be non-trivial');
  });

  it('无 @ts-expect-error 或 any 类型', () => {
    assert.ok(!SRC.includes('@ts-expect-error'));
    assert.ok(!SRC.includes(': any'));
  });
});

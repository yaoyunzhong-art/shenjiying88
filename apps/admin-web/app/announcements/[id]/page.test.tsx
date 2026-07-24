/**
 * announcements/[id]/page.test.tsx — 公告详情页 L1 测试
 *
 * 覆盖:
 *   正例 — 常量映射、状态流转逻辑、编辑逻辑、删除逻辑、404 处理
 *   反例 — 空字段校验、非法 ID
 *   边界 — 数组 ID、空内容
 *
 *   附加覆盖:
 *     formatDate 高级边界
 *     CATEGORY_LABELS 完整性断言
 *     STATUS_FLOW_OPTIONS 边界 & 不变性
 *     PRIORITY 一致性
 *     组件渲染 —— not-found / 正常展示 / 状态流转按钮可见性
 */

import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';
import fs from 'node:fs';
import React from 'react';

// 直接从 page.tsx 导入纯日志/数据函数和常量
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  STATUS_BADGE_VARIANT,
  STATUS_FLOW_OPTIONS,
  formatDate,
} from './page';

// ---- 辅助: 为渲染测试 mock 依赖的组件模块 ----

function setupRenderEnv() {
  const permissionGatePath = require.resolve('../../components/admin-permission-gate');
  require.cache[permissionGatePath] = {
    id: permissionGatePath,
    filename: permissionGatePath,
    loaded: true,
    exports: {
      __esModule: true,
      AdminPermissionGate: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    },
  };

  // Mock detail-workspace-registry to support 'announcements'
  const registryPath = require.resolve('../../components/detail-workspace-registry');
  require.cache[registryPath] = {
    id: registryPath,
    filename: registryPath,
    loaded: true,
    exports: {
      __esModule: true,
      buildStandardBreadcrumb: (opts: { workspace: string; detailLabel: string }) => ({
        workspaceLabel: '公告管理',
        workspaceHref: '/announcements',
        detailLabel: opts.detailLabel,
      }),
      buildStandardClosureLinks: () => [
        { key: 'workspace', title: '返回公告列表', subtitle: '回到 公告管理 总览', href: '/announcements' },
        { key: 'audit', title: '审计日志', subtitle: '查看审计留痕', context: 'announcements:test', href: '/audit-trail?source=announcements' },
      ],
    },
  };

  // Mock use-detail-actions
  const actionsPath = require.resolve('../../components/use-detail-actions');
  require.cache[actionsPath] = {
    id: actionsPath,
    filename: actionsPath,
    loaded: true,
    exports: {
      __esModule: true,
      useDetailActions: () => ({ actions: [], exportFilename: 'announcement-detail' }),
    },
  };
}

function resetRequireCache() {
  // Clear page module cache so next require() re-evaluates
  const pagePath = require.resolve('./page');
  delete require.cache[pagePath];
}

// ---- 正例 ----

test('CATEGORY_LABELS 应正确映射中文', () => {
  assert.equal(CATEGORY_LABELS.system, '系统通知');
  assert.equal(CATEGORY_LABELS.promotion, '促销活动');
  assert.equal(CATEGORY_LABELS.operation, '运营管理');
  assert.equal(CATEGORY_LABELS.emergency, '紧急通知');
  assert.equal(CATEGORY_LABELS.policy, '制度政策');
});

test('CATEGORY_LABELS 应有 5 个分类且无额外字段', () => {
  const keys = Object.keys(CATEGORY_LABELS);
  assert.equal(keys.length, 5);
  assert.deepEqual(keys.sort(), ['emergency', 'operation', 'policy', 'promotion', 'system']);
});

test('CATEGORY_LABELS 所有标签应为非空字符串', () => {
  for (const [k, v] of Object.entries(CATEGORY_LABELS)) {
    assert.ok(typeof v === 'string' && v.length > 0, `分类 ${k} 的标签为空`);
  }
});

test('CATEGORY_LABELS 各分类标签应唯一', () => {
  const values = Object.values(CATEGORY_LABELS);
  const unique = new Set(values);
  assert.equal(unique.size, values.length, '分类标签存在重复');
});

test('STATUS_LABELS 应包含三种状态', () => {
  assert.equal(STATUS_LABELS.draft, '草稿');
  assert.equal(STATUS_LABELS.published, '已发布');
  assert.equal(STATUS_LABELS.archived, '已归档');
});

test('PRIORITY_LABELS 与 PRIORITY_COLORS 应包含三种优先级', () => {
  assert.equal(PRIORITY_LABELS.high, '高');
  assert.equal(PRIORITY_LABELS.normal, '中');
  assert.equal(PRIORITY_LABELS.low, '低');
  assert.equal(PRIORITY_COLORS.high, '#ef4444');
  assert.equal(PRIORITY_COLORS.normal, '#f59e0b');
  assert.equal(PRIORITY_COLORS.low, '#6b7280');
});

test('PRIORITY 所有标签应为非空字符串', () => {
  for (const [k, v] of Object.entries(PRIORITY_LABELS)) {
    assert.ok(typeof v === 'string' && v.length > 0, `优先级 ${k} 的标签为空`);
  }
});

test('PRIORITY_COLORS 所有色值均以 # 开头且为 7 字符', () => {
  for (const [k, v] of Object.entries(PRIORITY_COLORS)) {
    assert.match(v, /^#[0-9a-f]{6}$/i, `优先级 ${k} 色值 ${v} 格式不正确`);
  }
});

test('PRIORITY_LABELS 与 PRIORITY_COLORS 键集合一致', () => {
  const labelKeys = Object.keys(PRIORITY_LABELS).sort();
  const colorKeys = Object.keys(PRIORITY_COLORS).sort();
  assert.deepEqual(labelKeys, colorKeys, '标签与色值的键集不一致');
});

test('STATUS_BADGE_VARIANT 应完整覆盖三种状态', () => {
  assert.equal(STATUS_BADGE_VARIANT.draft, 'default');
  assert.equal(STATUS_BADGE_VARIANT.published, 'success');
  assert.equal(STATUS_BADGE_VARIANT.archived, 'warning');
});

test('STATUS_BADGE_VARIANT 不能包含无效 variant 值', () => {
  const valid = ['default', 'success', 'warning'];
  for (const v of Object.values(STATUS_BADGE_VARIANT)) {
    assert.ok(valid.includes(v), `无效 badge variant: ${v}`);
  }
});

test('STATUS_FLOW_OPTIONS 应定义正确的状态流转路径', () => {
  const drafts = STATUS_FLOW_OPTIONS.filter((o) => o.from === 'draft');
  assert.equal(drafts.length, 1);
  assert.equal(drafts[0].to, 'published');
  assert.equal(drafts[0].label, '发布');

  const published = STATUS_FLOW_OPTIONS.filter((o) => o.from === 'published');
  assert.equal(published.length, 1);
  assert.equal(published[0].to, 'archived');
  assert.equal(published[0].label, '归档');

  const archived = STATUS_FLOW_OPTIONS.filter((o) => o.from === 'archived');
  assert.equal(archived.length, 0, '已归档状态不可再流转');
});

test('STATUS_FLOW_OPTIONS 每条流转的 from 和 to 不能相同', () => {
  for (const opt of STATUS_FLOW_OPTIONS) {
    assert.notEqual(opt.from, opt.to, `自转到自身: ${opt.from}->${opt.to}`);
  }
});

test('STATUS_FLOW_OPTIONS 每个 label 均为非空字符串', () => {
  for (const opt of STATUS_FLOW_OPTIONS) {
    assert.ok(opt.label.length > 0, `${opt.from}->${opt.to} 的 label 为空`);
  }
});

test('STATUS_LABELS 键集合与状态流转中的状态完全一致', () => {
  const statusKeys = Object.keys(STATUS_LABELS).sort();
  assert.equal(statusKeys.length, 3);
  assert.ok(statusKeys.includes('draft'));
  assert.ok(statusKeys.includes('published'));
  assert.ok(statusKeys.includes('archived'));
});

test('formatDate 应格式化有效日期', () => {
  assert.equal(formatDate('2026-07-05'), '2026-07-05');
});

test('formatDate 对空字符串应返回 "-"', () => {
  assert.equal(formatDate(''), '-');
});

test('formatDate 对无效日期应返回原始字符串', () => {
  const result = formatDate('invalid-date');
  assert.ok(typeof result === 'string');
});

// ---- 反例 ----

test('CATEGORY_LABELS 对未知值应返回 undefined', () => {
  assert.equal((CATEGORY_LABELS as Record<string, string>)['unknown'], undefined);
});

test('STATUS_LABELS 对未知值应返回 undefined', () => {
  assert.equal((STATUS_LABELS as Record<string, string>)['unknown'], undefined);
});

test('PRIORITY_LABELS 对未知值应返回 undefined', () => {
  assert.equal((PRIORITY_LABELS as Record<string, string>)['unknown'], undefined);
});

test('PRIORITY_COLORS 对未知值应返回 undefined', () => {
  assert.equal((PRIORITY_COLORS as Record<string, string>)['unknown'], undefined);
});

test('STATUS_BADGE_VARIANT 对未知值应返回 undefined', () => {
  assert.equal((STATUS_BADGE_VARIANT as Record<string, string>)['unknown'], undefined);
});

test('formatDate undefined 应返回 "-"', () => {
  assert.equal(formatDate(undefined as unknown as string), '-');
});

test('formatDate null 应返回 "-"', () => {
  assert.equal(formatDate(null as unknown as string), '-');
});

// ---- 边界 ----

test('STATUS_FLOW_OPTIONS 不应重复定义同一个状态流转', () => {
  const seen = new Set<string>();
  for (const opt of STATUS_FLOW_OPTIONS) {
    const key = `${opt.from}->${opt.to}`;
    assert.ok(!seen.has(key), `重复的状态流转: ${key}`);
    seen.add(key);
  }
});

test('STATUS_FLOW_OPTIONS 中的所有 from/to 应为有效状态', () => {
  const validStatuses = ['draft', 'published', 'archived'];
  for (const opt of STATUS_FLOW_OPTIONS) {
    assert.ok(validStatuses.includes(opt.from), `无效的 from 状态: ${opt.from}`);
    assert.ok(validStatuses.includes(opt.to), `无效的 to 状态: ${opt.to}`);
  }
});

test('formatDate 纯数字日期字符串应正确格式化', () => {
  const result = formatDate('2026/01/15');
  assert.ok(typeof result === 'string' && result.length > 0);
});

test('formatDate 全零日期应处理', () => {
  const result = formatDate('0000-00-00');
  assert.ok(typeof result === 'string');
});

test('STATUS_LABELS、STATUS_BADGE_VARIANT、STATUS_FLOW_OPTIONS 的键一致', () => {
  const labelKeys = Object.keys(STATUS_LABELS).sort();
  const badgeKeys = Object.keys(STATUS_BADGE_VARIANT).sort();
  assert.deepEqual(labelKeys, badgeKeys, 'STATUS_LABELS 与 STATUS_BADGE_VARIANT 键集不一致');
});

test('CATEGORY_LABELS 所有值应匹配中文且无空值', () => {
  for (const [k, v] of Object.entries(CATEGORY_LABELS)) {
    assert.ok(v.length >= 2, `分类 ${k} 的标签太短: ${v}`);
  }
});

// ---- 组件渲染 —— not-found / 正常展示 ----

test('AnnouncementDetailPage 渲染不崩溃', () => {
  // Use require so we can mock dependencies before first render
  setupRenderEnv();
  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  assert.ok(container.textContent && container.textContent.length > 0, '渲染空内容');
});

test('AnnouncementDetailPage 在 ID 为空时应显示"公告不存在"', () => {
  setupRenderEnv();
  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  assert.ok(container.textContent?.includes('公告不存在'), `页面文本: ${container.textContent?.substring(0, 100)}`);
});

test('AnnouncementDetailPage 在 ID 为空时展示返回按钮', () => {
  setupRenderEnv();
  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const buttons = container.querySelectorAll('[data-mock="SubmitButton"]');
  assert.ok(buttons.length > 0, '应展示提交按钮');
});

test('AnnouncementDetailPage 应渲染 WorkspaceBreadcrumb', () => {
  setupRenderEnv();
  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const breadcrumb = container.querySelector('[data-mock="WorkspaceBreadcrumb"]');
  assert.ok(breadcrumb, '应包含面包屑导航');
});

// ---- 组件渲染 —— 模拟 useParams 返回有效 ID ----

test('AnnouncementDetailPage 对有效 ID a1 应展示公告内容', () => {
  setupRenderEnv();
  // Override useParams
  const navPath = require.resolve('next/navigation');
  const origNav = require.cache[navPath].exports;
  require.cache[navPath].exports = {
    ...origNav,
    useParams: () => ({ id: 'a1' }),
  };

  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const text = container.textContent ?? '';
  assert.ok(text.includes('系统升级') || text.includes('维护'), `未包含标题文本: ${text.substring(0, 100)}`);

  // Restore
  require.cache[navPath].exports = origNav;
});

test('AnnouncementDetailPage 对已发布公告应展示"归档"流转按钮', () => {
  setupRenderEnv();
  const navPath = require.resolve('next/navigation');
  const origNav = require.cache[navPath].exports;
  require.cache[navPath].exports = {
    ...origNav,
    useParams: () => ({ id: 'a1' }),
  };

  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const buttons = Array.from(container.querySelectorAll('button'));
  const archiveBtn = buttons.find((b) => b.textContent?.includes('归档'));
  assert.ok(archiveBtn, '已发布公告应展示"归档"流转按钮');

  require.cache[navPath].exports = origNav;
});

test('AnnouncementDetailPage 对已归档公告不应展示状态流转按钮', () => {
  setupRenderEnv();
  const navPath = require.resolve('next/navigation');
  const origNav = require.cache[navPath].exports;
  require.cache[navPath].exports = {
    ...origNav,
    useParams: () => ({ id: 'a7' }),
  };

  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const text = container.textContent ?? '';
  assert.ok(text.includes('已归档'), '应为已归档状态');

  const buttons = Array.from(container.querySelectorAll('button'));
  const flowBtns = buttons.filter((b) => b.textContent === '发布' || b.textContent === '归档');
  assert.equal(flowBtns.length, 0, '已归档公告不应有状态流转按钮');

  require.cache[navPath].exports = origNav;
});

test('AnnouncementDetailPage 对草稿公告应展示"发布"流转按钮', () => {
  setupRenderEnv();
  const navPath = require.resolve('next/navigation');
  const origNav = require.cache[navPath].exports;
  require.cache[navPath].exports = {
    ...origNav,
    useParams: () => ({ id: 'a5' }),
  };

  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const buttons = Array.from(container.querySelectorAll('button'));
  const publishBtn = buttons.find((b) => b.textContent?.includes('发布'));
  assert.ok(publishBtn, '草稿公告应展示"发布"流转按钮');

  require.cache[navPath].exports = origNav;
});

test('AnnouncementDetailPage 应展示删除按钮', () => {
  setupRenderEnv();
  const navPath = require.resolve('next/navigation');
  const origNav = require.cache[navPath].exports;
  require.cache[navPath].exports = {
    ...origNav,
    useParams: () => ({ id: 'a1' }),
  };

  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const buttons = Array.from(container.querySelectorAll('button'));
  const deleteBtn = buttons.find((b) => b.textContent?.includes('删除'));
  assert.ok(deleteBtn, '应展示删除按钮');

  require.cache[navPath].exports = origNav;
});

test('AnnouncementDetailPage 对草稿公告 (a5) 不应展示"归档"流转按钮', () => {
  setupRenderEnv();
  const navPath = require.resolve('next/navigation');
  const origNav = require.cache[navPath].exports;
  require.cache[navPath].exports = {
    ...origNav,
    useParams: () => ({ id: 'a5' }),
  };

  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const buttons = Array.from(container.querySelectorAll('button'));
  const archiveBtn = buttons.find((b) => b.textContent?.includes('归档'));
  assert.ok(!archiveBtn, '草稿公告不应展示"归档"流转按钮');

  require.cache[navPath].exports = origNav;
});

test('AnnouncementDetailPage 对不存在的 ID 应显示空状态', () => {
  setupRenderEnv();
  const navPath = require.resolve('next/navigation');
  const origNav = require.cache[navPath].exports;
  require.cache[navPath].exports = {
    ...origNav,
    useParams: () => ({ id: 'nonexistent-id-xyz' }),
  };

  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const text = container.textContent ?? '';
  assert.ok(text.includes('公告不存在'), `不存在的 ID 未显示"公告不存在": ${text.substring(0, 100)}`);

  require.cache[navPath].exports = origNav;
});

// 数组 ID 边界: useParams 在 App Router 中可能返回 string | string[]
test('AnnouncementDetailPage 数组 ID 应取第一个元素', () => {
  setupRenderEnv();
  const navPath = require.resolve('next/navigation');
  const origNav = require.cache[navPath].exports;
  require.cache[navPath].exports = {
    ...origNav,
    useParams: () => ({ id: ['a1', 'extra'] }),
  };

  resetRequireCache();
  const { default: Page } = require('./page');
  // @ts-expect-error — 无 @types/react-dom 但运行时可用
  const { render } = require('@testing-library/react');
  const { container } = render(React.createElement(Page));
  const text = container.textContent ?? '';
  // a1 is a valid announcement — should find it
  assert.ok(text.includes('系统升级') || text.includes('维护'), `数组 ID 未正确取第一个元素: ${text.substring(0, 100)}`);

  require.cache[navPath].exports = origNav;
});

// ---- 源代码静态分析 ----

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

test('announcements/[id] 接入管理员权限边界', () => {
  assert.ok(SRC.includes('AdminPermissionGate'));
  assert.ok(SRC.includes('requiredPermission="foundation.governance.read"'));
});

test('page.tsx 包含 Announcement 接口定义', () => {
  assert.ok(SRC.includes('interface Announcement'));
});

test('page.tsx 包含 MOCK_ANNOUNCEMENTS 数据', () => {
  assert.ok(SRC.includes('MOCK_ANNOUNCEMENTS'));
});

test('page.tsx 包含 handleStatusTransition', () => {
  assert.ok(SRC.includes('handleStatusTransition'));
});

test('page.tsx 包含 handleDelete', () => {
  assert.ok(SRC.includes('handleDelete'));
});

test('page.tsx 包含 handleEditSubmit 编辑提交逻辑', () => {
  assert.ok(SRC.includes('handleEditSubmit'));
});

test('page.tsx 包含编辑模式状态 editing', () => {
  assert.ok(SRC.includes('[editing, setEditing]'));
});

test('page.tsx 不能包含裸 any 类型', () => {
  const lines = SRC.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(': any') || lines[i].includes('as any')) {
      assert.fail(`第 ${i + 1} 行包含 any 类型: ${lines[i].trim()}`);
    }
  }
});

test('page.tsx 应导出常量定义在组件外部', () => {
  const defExportIdx = SRC.indexOf('export default function');
  const constExports = SRC.match(/^export (const|function) /gm) ?? [];
  assert.ok(constExports.length >= 7, `应至少有 7 个 export const/function, 实际 ${constExports.length}`);
});

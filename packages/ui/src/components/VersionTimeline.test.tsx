import React from 'react';
import type { VersionEntry } from './VersionTimeline';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { VersionTimeline } = require('./VersionTimeline');

describe('VersionTimeline', () => {
  const sampleVersions: VersionEntry[] = [
    {
      version: '2.0.0',
      date: '2026-06-15',
      type: 'major',
      title: '系统架构重构，全新 UI 上线',
      changes: [
        { type: 'feature', description: '全新菜单导航系统' },
        { type: 'enhance', description: '性能提升 40%' },
        { type: 'security', description: '升级认证协议' },
      ],
      isCurrent: true,
    },
    {
      version: '1.5.0',
      date: '2026-04-01',
      type: 'minor',
      title: '新增报表导出与数据看板',
      changes: [
        { type: 'feature', description: '报表导出支持 PDF/Excel' },
        { type: 'fix', description: '修复日期筛选不准确问题' },
      ],
      author: '张三',
    },
    {
      version: '1.4.2',
      date: '2026-02-18',
      type: 'patch',
      title: '紧急问题修复',
      changes: [
        { type: 'fix', description: '修复内存泄漏' },
        { type: 'deprecate', description: '废弃旧版 API' },
      ],
    },
  ];

  // ========== 基础渲染 ==========
  test('renders all versions when maxEntries is 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: sampleVersions }),
    );
    assert.ok(html.includes('v2.0.0'));
    assert.ok(html.includes('v1.5.0'));
    assert.ok(html.includes('v1.4.2'));
    assert.ok(html.includes('大版本'));
    assert.ok(html.includes('小版本'));
    assert.ok(html.includes('补丁'));
  });

  test('renders limited entries when maxEntries is set', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: sampleVersions, maxEntries: 2 }),
    );
    assert.ok(html.includes('v2.0.0'));
    assert.ok(html.includes('v1.5.0'));
    assert.ok(!html.includes('v1.4.2'));
  });

  // ========== 标题 ==========
  test('renders title when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: sampleVersions, title: '更新日志' }),
    );
    assert.ok(html.includes('更新日志'));
  });

  test('does not render title when omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: sampleVersions }),
    );
    assert.ok(!html.includes('更新日志'));
  });

  // ========== 空状态 ==========
  test('renders empty state when versions is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: [], title: '版本历史' }),
    );
    assert.ok(html.includes('暂无版本记录'));
    assert.ok(html.includes('版本历史'));
  });

  test('renders custom empty text', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: [], emptyText: '尚未发布任何版本' }),
    );
    assert.ok(html.includes('尚未发布任何版本'));
  });

  // ========== 当前版本标记 ==========
  test('marks current version with badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: sampleVersions }),
    );
    assert.ok(html.includes('当前'));
  });

  // ========== 变更类型标签 ==========
  test('renders all change type labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: sampleVersions }),
    );
    assert.ok(html.includes('新增'));
    assert.ok(html.includes('优化'));
    assert.ok(html.includes('修复'));
    assert.ok(html.includes('弃用'));
    assert.ok(html.includes('安全'));
    assert.ok(html.includes('全新菜单导航系统'));
    assert.ok(html.includes('废弃旧版 API'));
  });

  // ========== 作者信息 ==========
  test('renders author when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: sampleVersions }),
    );
    assert.ok(html.includes('by 张三'));
  });

  // ========== ARIA ==========
  test('renders with proper ARIA attributes', () => {
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: sampleVersions, title: '版本日志' }),
    );
    assert.ok(html.includes('role="region"'));
    assert.ok(html.includes('aria-label'));
    assert.ok(html.includes('role="list"'));
    assert.ok(html.includes('role="listitem"'));
  });

  // ========== 版本类型颜色 ==========
  test('renders all version type variants', () => {
    const allTypes = sampleVersions;
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: allTypes }),
    );
    assert.ok(html.includes('大版本'));
    assert.ok(html.includes('小版本'));
    assert.ok(html.includes('补丁'));
  });

  // ========== 单版本 ==========
  test('renders single version correctly', () => {
    const single: VersionEntry[] = [{
      version: '1.0.0',
      date: '2026-01-01',
      type: 'hotfix',
      title: '紧急热修复',
      changes: [{ type: 'fix', description: '修复关键 bug' }],
    }];
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: single }),
    );
    assert.ok(html.includes('v1.0.0'));
    assert.ok(html.includes('热修复'));
    assert.ok(html.includes('紧急热修复'));
    assert.ok(html.includes('修复关键 bug'));
  });

  // ========== 自定义 className & style ==========
  test('applies custom className and style', () => {
    const style = { maxWidth: '600px' };
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, {
        versions: sampleVersions,
        className: 'my-timeline',
        style,
      }),
    );
    assert.ok(html.includes('class="my-timeline"'));
    assert.ok(html.includes('max-width:600px') || html.includes('max-width: 600px'));
  });

  // ========== beta 类型 ==========
  test('renders beta version type', () => {
    const betaVersions: VersionEntry[] = [{
      version: '3.0.0-beta.1',
      date: '2026-07-01',
      type: 'beta',
      title: '内测版本',
      changes: [{ type: 'feature', description: 'AI 推荐系统' }],
    }];
    const html = renderToStaticMarkup(
      React.createElement(VersionTimeline, { versions: betaVersions }),
    );
    assert.ok(html.includes('测试版'));
  });
});

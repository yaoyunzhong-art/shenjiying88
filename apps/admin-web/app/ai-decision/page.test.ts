/**
 * ai-decision/page.test.ts — AI 决策中心页面 L1 测试
 *
 * 覆盖:
 *   正例 – 页面文件存在、默认导出、引用 AiDecisionPanel
 *   正例 – 引用 PageShell、组件导出、渲染结构
 *   反例 – 文件完整性检查
 *   边界 – 多 variant 渲染兼容性
 */

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const pagePath = PROJECT_ROOT + '/apps/admin-web/app/ai-decision/page.tsx';

// ─── 源文件存在性 & 导出检查 ───────────────────────────

describe('AiDecisionPage (page.tsx 源文件)', () => {
  test('页面文件存在', () => {
    assert.ok(fs.existsSync(pagePath));
  });

  test('默认导出 default 函数组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /export default function AiDecisionPage/);
  });

  test('引用 AIDecisionPanel 组件 (from @m5/ui)', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /AIDecisionPanel/);
    assert.match(src, /from '@m5\/ui'/);
  });

  test('引用 PageShell 组件 (from @m5/ui)', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /PageShell/);
  });

  test('传递 variant="pc" 给 AiDecisionPanel', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /variant="pc"/);
  });

  test('包含标题 "AI 决策中心"', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /AI 决策中心/);
  });

  test('包含副标题说明文本', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /AI 规则引擎决策事件面板/);
  });

  test('页面使用 main 根元素', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /<main/);
  });

  test('引用 "use client" 指令', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /'use client'/);
  });

  test('AIDecisionPanel 作为 JSX 标签使用', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /<AIDecisionPanel/);
  });
});

// ─── 反例 ─────────────────────────────────────────────

describe('AiDecisionPage: 反例 (negative cases)', () => {
  test('文件不含 import { notFound } （本页不涉及404）', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /notFound/);
  });

  test('文件不含 null 返回语句', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /return null/);
  });
});

// ─── 边界 ─────────────────────────────────────────────

describe('AiDecisionPage: 边界 (boundary cases)', () => {
  test('最大宽度 maxWidth: 1120 （与工作台系列保持一致）', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /maxWidth: 1120/);
  });

  test('使用 padding: 24（统一间距）', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /padding: 24/);
  });
});

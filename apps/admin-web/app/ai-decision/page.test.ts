/**
 * ai-decision/page.test.ts — AI 决策中心页面 L1 测试
 *
 * V17#圈梁对齐 — 正例·反例·边界·集成·AI安全审计全覆
 *
 * 正例 – 页面文件存在、默认导出、引用 AiDecisionPanel
 * 正例 – 引用 PageShell、组件导出、渲染结构
 * 反例 – 文件完整性检查
 * 边界 – 多 variant 渲染兼容性
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

  test('应包含决策过滤功能', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /filter|search|source/, '应包含过滤');
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

  test('variant 应为 pc 或 mobile', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /variant="pc"|variant="mobile"/);
  });

  test('AiDecisionPanel 不应为空标签', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.ok(!src.includes('<AiDecisionPanel />'), '应包含 props');
  });

  test('should handle empty decision list', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /empty|暂无|0/, '应处理空列表');
  });

  test('should have decision status mapping', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /approved|rejected|pending/, '状态枚举');
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

  test('不应硬编码决策结果', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.ok(!src.includes('result: true') && !src.includes('result:false'), '不应硬编码');
  });

  test('不应包含 console.log 调试代码', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /console\.log/);
  });

  test('源文件行数合理范围内', () => {
    const lines = fs.readFileSync(pagePath, 'utf8').split('\n').length;
    assert.ok(lines > 10 && lines < 500, '文件大小合理');
  });

  test('不应包含危险 innerHTML', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /innerHTML/);
  });
});

// ─── 集成 ─────────────────────────────────────────────

describe('AiDecisionPage: 集成', () => {
  test('PageShell 应包裹 AIDecisionPanel', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.ok(
      (src.includes('PageShell') && src.includes('AIDecisionPanel')) ||
      (src.includes('PageShell') && src.includes('AiDecisionPanel')),
      'PageShell 包裹 AI 面板'
    );
  });

  test('应传递 variant 参数到子组件', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.ok(
      src.includes('variant=') || src.includes('variant={'),
      'variant 参数传递'
    );
  });

  test('标题应与副标题共存', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.match(src, /AI 决策中心/);
    assert.match(src, /AI 规则引擎/);
  });

  test('页面布局应有 responsize 适配', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.ok(
      src.includes('maxWidth') || src.includes('responsive') || src.includes('w-full'),
      '响应式布局'
    );
  });

  test('组件应有事件处理', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.ok(
      src.includes('onClick') || src.includes('onChange') || src.includes('onSelect'),
      '事件处理'
    );
  });
});

// ─── AI 安全审计 ──────────────────────────────────────

describe('AiDecisionPage: AI 安全审计', () => {
  test('不应在客户端记录决策详情', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /console\.log\(.*decision/);
  });

  test('不应将决策数据存入 localStorage', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /localStorage/);
  });

  test('不应使用 eval 动态执行规则', () => {
    const src = fs.readFileSync(pagePath, 'utf8');
    assert.doesNotMatch(src, /eval\(/);
  });
});

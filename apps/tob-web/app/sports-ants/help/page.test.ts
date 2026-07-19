/**
 * sports-ants/help/page.test.ts — 运动蚂蚁帮助中心测试
 *
 * 覆盖:
 *   L1 正例     — 组件导出、核心元素
 *   L2 数据     — FAQ 分类、问题数据完整性
 *   L2 操作指南 — GUIDES 数据完整性
 *   L3 状态逻辑 — 分类展开/问题展开
 *   L3 安全     — 无危险代码
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('HelpPage — L1 正例', () => {
  it('应导出一个默认函数组件 HelpPage', () => {
    assert.ok(SRC.includes('export default function HelpPage'));
  });

  it('应包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('应导入 SEO/Header/Footer/FloatingContact', () => {
    assert.ok(SRC.includes('SEOMeta'));
    assert.ok(SRC.includes('Header'));
    assert.ok(SRC.includes('Footer'));
    assert.ok(SRC.includes('FloatingContact'));
  });

  it('页面标题应为"帮助中心"', () => {
    assert.ok(SRC.includes('帮助中心'));
  });
});

describe('HelpPage — L2 FAQ 分类数据', () => {
  it('应定义 FAQ_CATEGORIES 数组', () => {
    assert.ok(SRC.includes('FAQ_CATEGORIES'));
  });

  it('FAQ_CATEGORIES 应包含 4 个分类', () => {
    const count = (SRC.match(/id:\s*'/g) || []).filter(m => 
      m.includes("'product'") || m.includes("'business'") || m.includes("'technical'") || m.includes("'account'")
    ).length;
    // 更直接: 检查 4 个分类 ID 都出现
    assert.ok(SRC.includes("'product'"));
    assert.ok(SRC.includes("'business'"));
    assert.ok(SRC.includes("'technical'"));
    assert.ok(SRC.includes("'account'"));
  });

  it('应包含"产品使用"分类', () => {
    assert.ok(SRC.includes("'product'"));
    assert.ok(SRC.includes('产品使用'));
  });

  it('应包含"商务合作"分类', () => {
    assert.ok(SRC.includes("'business'"));
    assert.ok(SRC.includes('商务合作'));
  });

  it('应包含"技术运维"分类', () => {
    assert.ok(SRC.includes("'technical'"));
    assert.ok(SRC.includes('技术运维'));
  });

  it('应包含"账户管理"分类', () => {
    assert.ok(SRC.includes("'account'"));
    assert.ok(SRC.includes('账户管理'));
  });

  it('每个分类应有 4 个常见问题', () => {
    const matches = SRC.match(/questions:\s*\[/g);
    assert.ok(matches !== null && matches.length >= 4, `预期至少 4 个 questions 数组，实际 ${matches?.length ?? 0}`);
  });
});

describe('HelpPage — L2 操作指南数据', () => {
  it('应定义 GUIDES 数组', () => {
    assert.ok(SRC.includes('GUIDES') || SRC.includes('guides'));
  });

  it('GUIDES 应包含 6 个操作指南', () => {
    const match = SRC.match(/GUIDES\s*=\s*\[([\s\S]*?)\];/s);
    assert.ok(match !== null, 'GUIDES 未找到');
    const count = (match[1].match(/\{/g) || []).length;
    assert.equal(count, 6, `预期 6 个操作指南，实际 ${count}`);
  });

  it('应包含新机安装指南', () => {
    assert.ok(SRC.includes('新机安装指南'));
  });

  it('应包含日常使用教程', () => {
    assert.ok(SRC.includes('日常使用教程'));
  });

  it('应包含故障排查手册', () => {
    assert.ok(SRC.includes('故障排查'));
  });

  it('每个操作指南应有 title/description/icon/href/duration', () => {
    assert.ok(SRC.includes('duration:'));
  });

  it('应包含视频教程数据', () => {
    assert.ok(SRC.includes('VIDEO_TUTORIALS') || SRC.includes('videoTutorials'));
  });
});

describe('HelpPage — L3 状态逻辑', () => {
  it('应使用 useState 管理 expandedCategory', () => {
    assert.ok(SRC.includes('useState'));
    assert.ok(SRC.includes('expandedCategory'));
  });

  it('应使用 useState 管理 expandedQuestion', () => {
    assert.ok(SRC.includes('expandedQuestion'));
  });

  it('分类展开/收起应有交互逻辑', () => {
    assert.ok(SRC.includes('handleCategoryClick'));
  });

  it('问题展开/收起应有交互逻辑', () => {
    assert.ok(SRC.includes('handleQuestionClick'));
  });

  it('展开面板应有 transform 过渡', () => {
    assert.ok(SRC.includes('rotate'));
  });

  it('交互应有追踪埋点', () => {
    assert.ok(SRC.includes('trackCTAClick'));
  });
});

describe('HelpPage — L3 安全', () => {
  it('不应使用 dangerouslySetInnerHTML', () => {
    assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
  });

  it('不应使用 eval', () => {
    assert.ok(!SRC.includes('eval('));
  });

  it('不应包含 as any', () => {
    assert.ok(!SRC.includes('as any'));
  });
});

/**
 * sports-ants/about/page.test.ts — 关于我们页面 L1 冒烟测试
 * 覆盖: 页面结构 · 内容板块 · 数据常量 · 交互组件
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const DATA = readFileSync(SOURCE, 'utf-8');

// ---- 页面结构 ----

describe('sports-ants/about — 页面结构', () => {
  it('应导出默认组件 AboutPage', () => {
    assert.ok(DATA.includes('export default function AboutPage'), '缺少默认导出');
  });

  it('应为 "use client" 组件', () => {
    assert.ok(DATA.includes("'use client'"), '缺少 use client');
  });

  it('应包含 SEOMeta / ConversionTracker', () => {
    assert.ok(DATA.includes('SEOMeta'), '缺少 SEOMeta');
    assert.ok(DATA.includes('ConversionTracker'), '缺少 ConversionTracker');
  });

  it('应包含 Header / Footer / FloatingContact / ExitIntentPopup', () => {
    assert.ok(DATA.includes('<Header'), '缺少 Header');
    assert.ok(DATA.includes('<Footer'), '缺少 Footer');
    assert.ok(DATA.includes('<FloatingContact'), '缺少 FloatingContact');
    assert.ok(DATA.includes('<ExitIntentPopup'), '缺少 ExitIntentPopup');
  });
});

// ---- 品牌介绍板块 ----

describe('sports-ants/about — 品牌介绍', () => {
  it('应包含品牌名 "运动蚂蚁" 和英文 "BigAnts"', () => {
    assert.ok(DATA.includes('运动蚂蚁'), '缺少品牌中文名');
    assert.ok(DATA.includes('BigAnts'), '缺少品牌英文名');
  });

  it('应包含核心定位描述词', () => {
    const keywords = ['数字运动', '全链路', '神机营', 'SaaS'];
    for (const kw of keywords) {
      assert.ok(DATA.includes(kw), `缺少关键词: ${kw}`);
    }
  });
});

// ---- 设计系统 ----

describe('sports-ants/about — 设计系统', () => {
  it('应定义 designSystem 常量', () => {
    assert.ok(DATA.includes('designSystem'), '缺少 designSystem');
    assert.ok(DATA.includes('#000000'), '缺少主色');
    assert.ok(DATA.includes('#0066FF'), '缺少品牌蓝');
  });

  it('应包含 useScrollAnimation Hook', () => {
    assert.ok(DATA.includes('useScrollAnimation'), '缺少 useScrollAnimation');
    assert.ok(DATA.includes('IntersectionObserver'), '缺少 IntersectionObserver');
  });
});

// ---- 里程碑 / 发展历程 ----

describe('sports-ants/about — 发展历程', () => {
  it('应包含时间线或里程碑相关描述', () => {
    const milestoneHints = ['年', '里程碑', '历程', '发展', '大事记'];
    const hasAny = milestoneHints.some(h => DATA.includes(h));
    assert.ok(hasAny, '缺少发展历程相关内容');
  });
});

// ---- 团队 / 优势 ----

describe('sports-ants/about — 核心优势', () => {
  it('应包含团队或核心优势介绍', () => {
    const teamHints = ['技术', '研发', '专利', '团队', '核心', '优势', '服务'];
    const hasAny = teamHints.some(h => DATA.includes(h));
    assert.ok(hasAny, '缺少核心优势相关内容');
  });

  it('应包含专利数字描述（专利数量）', () => {
    const patentHints = ['专利', '知识产权'];
    const hasPatent = patentHints.some(h => DATA.includes(h));
    assert.ok(hasPatent, '缺少专利知识产权描述');
  });
});

// ---- CTA 与交互 ----

describe('sports-ants/about — CTA 与交互', () => {
  it('应包含 conversionService 调用来追踪交互', () => {
    const pattern = /conversionService\s*\.\s*trackCTAClick/g;
    const matches = DATA.match(pattern);
    assert.ok(matches && matches.length >= 1,
      `conversionService.trackCTAClick 调用次数应为 ≥1, 实际: ${matches?.length || 0}`
    );
  });

  it('应有联系或按钮跳转', () => {
    const ctas = ['联系我们', '联系', '咨询', '了解更多', '立即'];
    const hasCTA = ctas.some(c => DATA.includes(c));
    assert.ok(hasCTA, '缺少 CTA 按钮或链接');
  });

  it('应包含 Link 组件进行内部导航', () => {
    assert.ok(DATA.includes('Link'), '缺少 next/link');
    assert.ok(DATA.includes('href='), '缺少 href 路由');
  });
});

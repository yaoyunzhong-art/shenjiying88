/**
 * enterprise/page.test.tsx — 企业门户入口页 L1 冒烟测试
 * 覆盖: 正例·导出·布局·核心内容·边界
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('enterprise — 正例', () => {
  it('应导出一个默认组件 EnterpriseLandingPage', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function EnterpriseLandingPage'),
      '缺少 EnterpriseLandingPage 默认导出',
    );
  });

  it('应包含 "企业智能运营平台" 标题', () => {
    const src = readSource();
    assert.ok(src.includes('企业智能运营平台'), '缺少标题文案');
  });

  it('应包含 HeroSection 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('HeroSection'), '缺少 HeroSection');
  });

  it('应包含 StatsBar 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('StatsBar'), '缺少 StatsBar');
  });

  it('应包含 FeaturesSection 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('FeaturesSection'), '缺少 FeaturesSection');
  });

  it('应包含 QuickLinksSection 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('QuickLinksSection'), '缺少 QuickLinksSection');
  });

  it('应包含 Footer 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('Footer'), '缺少 Footer');
  });

  it('应包含 6 个核心功能卡片', () => {
    const src = readSource();
    const matches = src.match(/title:/g);
    // FEATURES has 6 items, plus section titles => more than 6
    assert.ok(matches && matches.length >= 6, '功能卡片不足');
  });

  it('FEATURES 应定义 6 项', () => {
    const src = readSource();
    const regex = /{ title:/g;
    const matches = src.match(regex);
    assert.ok(matches && matches.length >= 6, 'FEATURES 中 title 数量不足');
  });

  it('应包含注册链接 /enterprise/register', () => {
    const src = readSource();
    assert.ok(src.includes('/enterprise/register'), '缺少注册链接');
  });

  it('应包含登录链接 /enterprise/login', () => {
    const src = readSource();
    assert.ok(src.includes('/enterprise/login'), '缺少登录链接');
  });

  it('应包含控制台链接 /enterprise/console', () => {
    const src = readSource();
    assert.ok(src.includes('/enterprise/console'), '缺少控制台链接');
  });

  it('应使用 Button 和 Card 组件', () => {
    const src = readSource();
    assert.ok(src.includes('Button'), '缺少 Button 组件');
    assert.ok(src.includes('Card'), '缺少 Card 组件');
  });

  it('应使用 StatCard 展示统计数据', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '缺少 StatCard 组件');
  });

  it('STATS_ITEMS 应定义 4 项统计', () => {
    const src = readSource();
    const matches = src.match(/label:/g);
    assert.ok(matches && matches.length >= 4, 'STATS_ITEMS 数量不足');
  });
});

// ---- 边界 ----

describe('enterprise — 边界', () => {
  it('Footer 应使用动态年份 getFullYear()', () => {
    const src = readSource();
    assert.ok(src.includes('getFullYear()'), '年份应为动态生成，而非硬编码');
  });

  it('应包含 Next.js Link 组件', () => {
    const src = readSource();
    assert.ok(src.includes('from \'next/link\''), '缺少 next/link 导入');
  });

  it('不应包含硬编码的版权年为固定值', () => {
    const src = readSource();
    // Should not have hardcoded "2024" or "2025" in copyright
    assert.ok(!src.includes('© 2024'), '不应硬编码 2024');
    assert.ok(!src.includes('© 2025'), '不应硬编码 2025');
  });

  it('应包含 "免费注册" 按钮文本', () => {
    const src = readSource();
    assert.ok(src.includes('免费注册'), '缺少免费注册按钮');
  });

  it('应包含 "登录控制台" 按钮文本', () => {
    const src = readSource();
    assert.ok(src.includes('登录控制台'), '缺少登录控制台按钮');
  });

  it('应包含 "进入控制台" 快捷入口', () => {
    const src = readSource();
    assert.ok(src.includes('进入控制台'), '缺少进入控制台');
  });

  it('应包含 "帮助文档" 快捷入口', () => {
    const src = readSource();
    assert.ok(src.includes('帮助文档'), '缺少帮助文档');
  });

  it('应包含 "企业套餐" 快捷入口', () => {
    const src = readSource();
    assert.ok(src.includes('企业套餐'), '缺少企业套餐');
  });

  it('应包含 "核心功能" 章节标题', () => {
    const src = readSource();
    assert.ok(src.includes('核心功能'), '缺少核心功能标题');
  });

  it('应使用 "沪ICP备" 备案号占位', () => {
    const src = readSource();
    assert.ok(src.includes('沪ICP备'), '缺少备案号');
  });
});

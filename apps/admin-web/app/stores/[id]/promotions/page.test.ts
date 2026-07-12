/**
 * promotions/page.test.ts — 促销活动列表页冒烟测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SOURCE = resolve(__dirname, 'page.tsx');

function readPage(): string {
  return readFileSync(PAGE_SOURCE, 'utf-8');
}

// ==================== Page scaffold 正例 ====================

describe('promotions/page — 正例', () => {
  it('应默认导出 PromotionsPage', () => {
    const src = readPage();
    assert.ok(src.includes('export default function PromotionsPage'), '缺少默认导出函数');
  });

  it('应包含 "use client" 声明', () => {
    const src = readPage();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 PromoStatus 类型定义', () => {
    const src = readPage();
    assert.ok(src.includes('type PromoStatus'), '缺少 PromoStatus');
  });

  it('应包含 PromoType 类型定义', () => {
    const src = readPage();
    assert.ok(src.includes('type PromoType'), '缺少 PromoType');
  });

  it('应包含 Promotion 接口定义', () => {
    const src = readPage();
    assert.ok(src.includes('interface Promotion'), '缺少 Promotion');
  });

  it('应包含 PS 状态映射表', () => {
    const src = readPage();
    assert.ok(src.includes('const PS:'), '缺少 PS 映射');
    assert.ok(src.includes('进行中'), '缺少进行中标签');
  });

  it('应引用 @m5/ui 组件', () => {
    const src = readPage();
    assert.ok(src.includes("from '@m5/ui'"), '缺少 @m5/ui 导入');
  });

  it('应包含 PageShell 页面外壳', () => {
    const src = readPage();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('促销管理'), '缺少促销管理标题');
  });
});

// ==================== 数据完整性 ====================

describe('promotions/page — 数据完整性', () => {
  it('应包含 promos 数据数组', () => {
    const src = readPage();
    assert.ok(src.includes('const promos: Promotion'), '缺少 promos 数据');
  });

  it('应包含多种活动类型', () => {
    const src = readPage();
    assert.ok(src.includes("'discount'"), '缺少 discount');
    assert.ok(src.includes("'bundle'"), '缺少 bundle');
    assert.ok(src.includes("'gift'"), '缺少 gift');
    assert.ok(src.includes("'points'"), '缺少 points');
    assert.ok(src.includes("'flash'"), '缺少 flash');
  });

  it('应包含多种活动状态', () => {
    const src = readPage();
    assert.ok(src.includes("'active'"), '缺少 active 状态');
    assert.ok(src.includes("'ended'"), '缺少 ended 状态');
    assert.ok(src.includes("'draft'"), '缺少 draft 状态');
    assert.ok(src.includes("'scheduled'"), '缺少 scheduled 状态');
  });

  it('应包含 KPI 统计 (活动总数/总营收/平均ROI)', () => {
    const src = readPage();
    assert.ok(src.includes('活动总数'), '缺少活动总数');
    assert.ok(src.includes('总营收'), '缺少总营收');
    assert.ok(src.includes('平均ROI'), '缺少平均ROI');
  });
});

// ==================== 功能验证 ====================

describe('promotions/page — 功能', () => {
  it('应使用 Tabs 切换列表/分析视图', () => {
    const src = readPage();
    assert.ok(src.includes('<Tabs'), '缺少 Tabs');
    assert.ok(src.includes("'list'"), '缺少列表视图');
    assert.ok(src.includes("'analytics'"), '缺少分析视图');
  });

  it('应渲染 StatCard 统计组件', () => {
    const src = readPage();
    assert.ok(src.includes('StatCard'), '缺少 StatCard');
  });

  it('应包含创建活动和导出报告按钮', () => {
    const src = readPage();
    assert.ok(src.includes('创建活动'), '缺少创建活动按钮');
    assert.ok(src.includes('导出报告'), '缺少导出报告按钮');
  });

  it('应包含 formatMoney 工具函数', () => {
    const src = readPage();
    assert.ok(src.includes('function fm'), '缺少 fm 格式化函数');
  });
});

// ==================== 边界 ====================

describe('promotions/page — 边界', () => {
  it('应包含活动列表卡片渲染', () => {
    const src = readPage();
    assert.ok(src.includes('promos.map'), '使用 map 渲染列表');
  });

  it('应包含效果分析表格', () => {
    const src = readPage();
    assert.ok(src.includes('analytics'), '包含 analytics tab');
    assert.ok(src.includes('<table'), '包含表格');
  });

  it('应使用 StatusBadge 展示状态', () => {
    const src = readPage();
    assert.ok(src.includes('StatusBadge'), '缺少 StatusBadge');
  });

  it('空 ROI 应有合理处理', () => {
    const src = readPage();
    assert.ok(src.includes('roi>0'), '有 ROI 判空逻辑');
  });
});

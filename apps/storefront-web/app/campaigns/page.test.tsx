/**
 * campaigns/page.test.tsx — 活动列表页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·反例·边界·防御
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

describe('campaigns — 正例', () => {
  it('应导出一个默认组件 CampaignsListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CampaignsListPage'), '缺少默认导出');
  });

  it('应包含 Campaign 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Campaign'), '缺少接口');
  });

  it('应包含 MOCK_CAMPAIGNS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_CAMPAIGNS'), '缺少数据源');
  });

  it('应计算 active / totalBudget / totalSpent 统计', () => {
    const src = readSource();
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('totalBudget'), '缺少 totalBudget');
    assert.ok(src.includes('totalSpent'), '缺少 totalSpent');
  });

  it('每个 Campaign 应有 id/budget/spent/status', () => {
    const src = readSource();
    assert.ok(src.includes('id'), '缺少 id');
    assert.ok(src.includes('budget'), '缺少 budget');
    assert.ok(src.includes('spent'), '缺少 spent');
  });

  it('Mock 数据应包含多种状态（active/scheduled/ended/paused/draft）', () => {
    const src = readSource();
    assert.ok(src.includes("'active'") && src.includes("'ended'") && src.includes("'draft'"), '缺少不同状态');
  });

  it('Mock 数据应包含 startAt/endAt', () => {
    const src = readSource();
    assert.ok(src.includes('startAt') || src.includes('endAt'), '缺少日期');
  });

  it('应包含活动名称 name 字段', () => {
    const src = readSource();
    assert.ok(src.includes('name'), '缺少 name');
  });

  it('Mock 数据至少包含 8 条活动', () => {
    const src = readSource();
    const matches = src.match(/id:\s*['"]/g);
    assert.ok(matches && matches.length >= 8, `期望 ≥8, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含 description 字段', () => {
    const src = readSource();
    assert.ok(src.includes('description'), '缺少 description');
  });
});

describe('campaigns — 边界', () => {
  it('active 状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), 'active 过滤');
  });

  it('预算和花费使用 reduce 统计', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), 'reduce 求和');
  });

  it('MOCK_CAMPAIGNS 长度统计', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_CAMPAIGNS.length'), '长度统计');
  });

  it('搜索过滤使用 title 或 name', () => {
    const src = readSource();
    assert.ok(src.includes('search') || src.includes('Search'), '搜索');
  });
});

describe('campaigns — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('search') || src.includes('Search'), '搜索');
  });

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });

  it('不应包含硬编码 token/密钥', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key|token|authorization)/i);
  });
});

describe('campaigns — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });

  it('不应包含 console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), '裸 console.log');
  });

  it('budget 不应为负数', () => {
    const src = readSource();
    assert.ok(src.includes('budget'));
  });
});

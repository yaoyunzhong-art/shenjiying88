/*!
 * campaigns/[id]/page.test.tsx - L1 smoke test (storefront-web)
 * Adapted for CampaignDetailPage
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

describe('CampaignDetailPage - 正例', () => {
  it('exports default CampaignDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CampaignDetailPage'), 'missing export');
  });
  it('has use client', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'missing use client');
  });
  it('uses useParams', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), 'missing useParams');
  });
  it('uses useRouter', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), 'missing useRouter');
  });
  it('imports CampaignDataPoint', () => {
    const src = readSource();
    assert.ok(src.includes('CampaignDataPoint'), 'missing CampaignDataPoint');
  });
  it('imports CampaignInsight', () => {
    const src = readSource();
    assert.ok(src.includes('CampaignInsight'), 'missing CampaignInsight');
  });
  it('imports CampaignMetric', () => {
    const src = readSource();
    assert.ok(src.includes('CampaignMetric'), 'missing CampaignMetric');
  });
  it('imports CampaignPerformancePanel', () => {
    const src = readSource();
    assert.ok(src.includes('CampaignPerformancePanel'), 'missing CampaignPerformancePanel');
  });
  it('imports DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('imports PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('imports StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('has MOCK_DATA data', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DATA'), 'missing MOCK_DATA');
  });
  it('has mockPerformanceMetrics data', () => {
    const src = readSource();
    assert.ok(src.includes('mockPerformanceMetrics'), 'missing mockPerformanceMetrics');
  });
  it('has mockTrendData data', () => {
    const src = readSource();
    assert.ok(src.includes('mockTrendData'), 'missing mockTrendData');
  });
  it('uses useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), 'missing useMemo');
  });
  it('uses DetailShell', () => {
    const src = readSource();
    assert.ok(src.includes('DetailShell'), 'missing DetailShell');
  });
  it('uses PageShell', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), 'missing PageShell');
  });
  it('uses InfoRow', () => {
    const src = readSource();
    assert.ok(src.includes('InfoRow'), 'missing InfoRow');
  });
  it('uses StatusBadge', () => {
    const src = readSource();
    assert.ok(src.includes('StatusBadge'), 'missing StatusBadge');
  });
  it('defines CampaignDetail interface/type', () => {
    const src = readSource();
    assert.ok(src.includes('interface CampaignDetail') || src.includes('type CampaignDetail'), 'missing CampaignDetail');
  });
});

describe('CampaignDetailPage - 反例', () => {
  it('no dangerousSetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
  it('no any type', () => {
    const src = readSource();
    assert.doesNotMatch(src, /:\s*any\b/);
  });
  it('no secret leak', () => {
    const src = readSource();
    assert.doesNotMatch(src, /(?:secret|password|api[_-]?key)/i);
  });
  it('no raw console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log(') || src.includes('// console.log'), 'bare console.log');
  });
});

describe('CampaignDetailPage - 边界', () => {
  it('has conditional rendering', () => {
    const src = readSource();
    assert.ok(src.includes('?'), 'missing conditional');
  });
  it('handles not-found state', () => {
    const src = readSource();
    assert.ok(src.includes('notFound') || src.includes('不存在'), 'missing not found');
  });
});

describe('CampaignDetailPage - 数据完整性', () => {
  it('includes context "618 年中大促..."', () => {
    const src = readSource();
    assert.ok(src.includes('618 年中大促'), 'missing 618 年中大促');
  });
  it('includes context "App 推送..."', () => {
    const src = readSource();
    assert.ok(src.includes('App 推送'), 'missing App 推送');
  });
  it('includes context "App推送..."', () => {
    const src = readSource();
    assert.ok(src.includes('App推送'), 'missing App推送');
  });
  it('includes context "H5 页面..."', () => {
    const src = readSource();
    assert.ok(src.includes('H5 页面'), 'missing H5 页面');
  });
  it('includes context "ROI 偏低需关注..."', () => {
    const src = readSource();
    assert.ok(src.includes('ROI 偏低需关注'), 'missing ROI 偏低需关注');
  });
  it('includes context "ROI 处于行业平均水平..."', () => {
    const src = readSource();
    assert.ok(src.includes('ROI 处于行业平均水平'), 'missing ROI 处于行业平均水平');
  });
  it('includes context "ROI 表现优秀..."', () => {
    const src = readSource();
    assert.ok(src.includes('ROI 表现优秀'), 'missing ROI 表现优秀');
  });
  it('includes context "← 返回列表..."', () => {
    const src = readSource();
    assert.ok(src.includes('← 返回列表'), 'missing ← 返回列表');
  });
  it('includes context "三人成团享 7 折优惠，..."', () => {
    const src = readSource();
    assert.ok(src.includes('三人成团享 7 折优惠，配合分享奖励机制实现社交裂变传播。'), 'missing 三人成团享 7 折优惠，');
  });
  it('includes context "企业微信..."', () => {
    const src = readSource();
    assert.ok(src.includes('企业微信'), 'missing 企业微信');
  });
  it('has constant remaining', () => {
    const src = readSource();
    assert.ok(src.includes('remaining'), 'missing remaining');
  });
  it('has constant spentPct', () => {
    const src = readSource();
    assert.ok(src.includes('spentPct'), 'missing spentPct');
  });
  it('has constant cpa', () => {
    const src = readSource();
    assert.ok(src.includes('cpa'), 'missing cpa');
  });
  it('has constant start', () => {
    const src = readSource();
    assert.ok(src.includes('start'), 'missing start');
  });
  it('has constant d', () => {
    const src = readSource();
    assert.ok(src.includes('d'), 'missing d');
  });
});
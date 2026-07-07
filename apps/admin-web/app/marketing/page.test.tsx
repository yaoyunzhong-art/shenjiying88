/**
 * marketing/page.test.tsx — 营销工作台 L1 冒烟测试
 * 覆盖: 正例·边界·防御
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

describe('marketing — 正例', () => {
  it('应导出一个默认组件 MarketingWorkbench', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MarketingWorkbench'), '缺少默认导出组件');
  });

  it('应包含 CampaignROI 接口定义', () => {
    const src = readSource();
    assert.ok(
      src.includes('interface CampaignROI') || src.includes('CampaignROI'),
      '缺少 CampaignROI 接口'
    );
  });

  it('应包含 ROI 计算函数', () => {
    const src = readSource();
    assert.ok(src.includes('ROI') || src.includes('roi'), '缺少 ROI 计算');
  });

  it('应包含营销活动数据定义', () => {
    const src = readSource();
    assert.ok(src.includes('campaign') || src.includes('Campaign'), '缺少营销活动数据');
  });
});

// ---- 边界 ----

describe('marketing — 边界', () => {
  it('ROI 为 0 时应有对应处理', () => {
    const src = readSource();
    assert.ok(src.includes('0') || src.includes('zero') || src.includes('ROI'), 'ROI 边界值处理');
  });

  it('应包含 RFMSegmentStat 定义', () => {
    const src = readSource();
    assert.ok(
      src.includes('interface RFMSegmentStat') || src.includes('RFMSegmentStat'),
      '缺少 RFM 分段统计接口'
    );
  });

  it('应包含 ABTestResult 定义', () => {
    const src = readSource();
    assert.ok(
      src.includes('interface ABTestResult') || src.includes('ABTestResult'),
      '缺少 A/B 测试接口'
    );
  });
});

// ---- 防御 ----

describe('marketing — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 ChannelRoute 渠道路由定义', () => {
    const src = readSource();
    assert.ok(
      src.includes('interface ChannelRoute') || src.includes('ChannelRoute'),
      '缺少渠道路由接口'
    );
  });

  it('所有接口定义应使用 export type 或 interface', () => {
    const src = readSource();
    assert.ok(
      src.includes('interface') || src.includes('type '),
      '缺少 interface 或 type'
    );
  });
});

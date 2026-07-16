import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('CampaignPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function CampaignPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('CampaignPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
});

describe('CampaignPage — 活动模块', () => {
  it('应包含 CAMPAIGNS 数据', () => assert.ok(SRC.includes('CAMPAIGNS')));
  it('应包含 Campaign 接口', () => assert.ok(SRC.includes('interface Campaign')));
  it('应包含 Table 展示', () => assert.ok(SRC.includes('Table')));
  it('应支持渠道筛选', () => assert.ok(SRC.includes('channelFilter')));
  it('应支持创建活动 Modal', () => assert.ok(SRC.includes('showCreate') && SRC.includes('Modal')));
});

describe('CampaignPage — 指标', () => {
  it('应计算总预算', () => assert.ok(SRC.includes('totalBudget')));
  it('应计算总消耗', () => assert.ok(SRC.includes('totalSpent')));
  it('应计算总曝光', () => assert.ok(SRC.includes('totalImpressions')));
  it('应展示统计卡片', () => assert.ok(SRC.includes('Statistic')));
});

describe('CampaignPage — 状态覆盖', () => {
  it('应处理 active 状态', () => assert.ok(SRC.includes("'active'")));
  it('应处理 paused 状态', () => assert.ok(SRC.includes("'paused'")));
  it('应处理 ended 状态', () => assert.ok(SRC.includes("'ended'")));
});

describe('CampaignPage — 渠道覆盖', () => {
  it('应支持多渠道筛选', () => assert.ok(SRC.includes('CHANNELS')));
});

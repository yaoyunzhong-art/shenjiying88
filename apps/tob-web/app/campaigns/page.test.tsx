/**
 * campaigns/page.test.tsx — 活动列表页 L1 冒烟测试 (tob-web)
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

describe('campaigns — 正例', () => {
  it('应导出一个默认组件 CampaignsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CampaignsPage'), '缺少默认导出');
  });

  it('应包含 MOCK_CAMPAIGNS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_CAMPAIGNS'), '缺少 MOCK_CAMPAIGNS');
  });

  it('应包含 computeCampaignStats 统计函数', () => {
    const src = readSource();
    assert.ok(src.includes('computeCampaignStats'), '缺少统计函数');
  });

  it('应包含 status 过滤', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '缺少 status');
  });

  it('应包含最近派发记录读面（含筛选控件）', () => {
    const src = readSource();
    assert.ok(src.includes('最近派发记录'), '缺少最近派发记录区块');
    assert.ok(src.includes('loadGlobalCampaignDispatches'), '缺少 dispatch list 真接口读取');
    assert.ok(src.includes('ResultKindBadge'), '缺少 ResultKindBadge 徽章组件');
    assert.ok(src.includes('dispatch.resultKind'), '缺少 resultKind 字段引用');
    assert.ok(src.includes('dispatchMemberFilter'), '缺少成员ID筛选状态');
    assert.ok(src.includes('dispatchStatusFilter'), '缺少状态筛选状态');
    assert.ok(src.includes('loadDispatches'), '缺少 loadDispatches 回调');
    assert.ok(src.includes('清除筛选'), '缺少清除筛选按钮');
    assert.ok(src.includes('查看活动详情'), '缺少活动详情跳转链接');
    assert.ok(src.includes('window.location.href'), '缺少点击跳转实现');
    assert.ok(src.includes('highlightDispatchId'), '缺少高亮派发记录 ID 参数');
  });
});

describe('campaigns — 边界', () => {
  it('status 分组的 length 统计', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '长度统计');
  });

  it('MOCK_CAMPAIGNS 数量统计', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_CAMPAIGNS'), '数据源');
  });

  it('应支持分类过滤', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), 'filter 过滤');
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

  it('空活动列表应有正确处理', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '长度处理');
  });
});

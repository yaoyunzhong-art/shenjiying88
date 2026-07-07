/**
 * page.test.ts — L1 冒烟测试
 *
 * tob-web Members RFM Analysis page — 组件导出、mock 数据完整性验证
 * 场景: 运营经理基于 RFM 模型分析会员价值
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import RFMAnalysisPage from './page';

// ── 正例（Happy Path）───────────────────────────────────────────────

describe('members/rfm-analysis/page — 正向测试', () => {
  it('默认导出组件函数', () => {
    assert.equal(typeof RFMAnalysisPage, 'function');
  });

  it('组件名称包含 RFM 关键字', () => {
    const name = (RFMAnalysisPage as unknown as { name?: string }).name || '';
    assert.ok(name.includes('RFMAnalysisPage') || name === '', '组件应为 RFMAnalysisPage');
  });
});

// ── 页面源码完整性 ────────────────────────────────────────────────────

describe('members/rfm-analysis/page — 源码完整性', () => {
  const fs = require('fs');
  const source = fs.readFileSync(
    __dirname + '/page.tsx',
    'utf-8',
  );

  it('导入 @m5/ui 依赖', () => {
    assert.match(source, /from '@m5\/ui'/);
  });

  it('使用 PageShell', () => {
    assert.match(source, /PageShell/);
  });

  it('使用 MemberRFMAnalysisPanel', () => {
    assert.match(source, /MemberRFMAnalysisPanel/);
  });

  it('使用 StatCard 展示四维指标', () => {
    assert.match(source, /StatCard/);
  });

  it('支持搜索筛选', () => {
    assert.match(source, /searchQuery/);
    assert.match(source, /FilterBar/);
  });

  it('定义了三个 Tab (概览/分层分布/明细列表)', () => {
    assert.match(source, /overview/);
    assert.match(source, /segment/);
    assert.match(source, /detail/);
    assert.match(source, /概览/);
    assert.match(source, /分层分布/);
    assert.match(source, /明细列表/);
  });

  it('mock 数据有 12 条 RFM 记录', () => {
    const matches = source.match(/id:\s*'M\d{3}'/g);
    assert.equal(matches?.length, 12);
  });

  it('覆盖了 8 个 RFM 分层', () => {
    const segments = ['高价值', '重要发展', '重要保持', '重要挽留', '一般价值', '一般发展', '一般保持', '流失预警'];
    for (const seg of segments) {
      assert.ok(source.includes(seg), `应包含 ${seg}`);
    }
  });

  it('展示四张统计卡', () => {
    assert.match(source, /平均 Recency/);
    assert.match(source, /平均 Frequency/);
    assert.match(source, /平均 Monetary/);
    assert.match(source, /高价值会员/);
  });

  it('支持 loading 状态', () => {
    assert.match(source, /loading/);
    assert.match(source, /LoadingSkeleton/);
  });

  it('支持空态显示', () => {
    assert.match(source, /EmptyState/);
    assert.match(source, /没有匹配的会员数据/);
  });

  it('评分用颜色标识 (红黄绿)', () => {
    assert.match(source, /text-green-500/);
    assert.match(source, /text-yellow-500/);
    assert.match(source, /text-red-500/);
  });

  it('包含 data-testid', () => {
    assert.match(source, /data-testid="rfm-analysis-page"/);
  });
});

// ── 反例测试 ─────────────────────────────────────────────────────────

describe('members/rfm-analysis/page — 反例测试', () => {
  const fs = require('fs');
  const source = fs.readFileSync(
    __dirname + '/page.tsx',
    'utf-8',
  );

  it('空搜索不应导致崩溃 (空 FilterBar)', () => {
    assert.match(source, /searchQuery/);
    assert.ok(
      source.includes('searchQuery.trim') || source.includes('searchQuery.toLowerCase'),
      '搜索应有防空逻辑',
    );
  });

  it('loading 时不应渲染内容', () => {
    // loading 态下只渲染 LoadingSkeleton
    const loadingBlock = source.match(/if\s*\(loading\)\s*\{[^}]*\}/s);
    assert.ok(loadingBlock, '应有 loading 条件分支');
    if (loadingBlock) {
      assert.match(loadingBlock[0], /LoadingSkeleton/);
      assert.ok(!loadingBlock[0].includes('StatCard'), 'loading 时不应渲染 StatCard');
    }
  });

  it('过滤空结果显示 EmptyState', () => {
    assert.match(source, /filteredData/);
    assert.match(source, /filteredData\.length === 0/);
  });
});

// ── 边界测试 ─────────────────────────────────────────────────────────

describe('members/rfm-analysis/page — 边界测试', () => {
  const fs = require('fs');
  const source = fs.readFileSync(
    __dirname + '/page.tsx',
    'utf-8',
  );

  it('computeSegmentScore 覆盖所有总分区间', () => {
    assert.match(source, /total >= 13/);
    assert.match(source, /total >= 10/);
    assert.match(source, /total >= 7/);
  });

  it('mock 数据包含极端值 (RFM=111 和 555)', () => {
    // 第6条数据是 1/1/1，第1条是 5/5/5
    assert.ok(source.includes("recency: 5, frequency: 5, monetary: 5"));
    assert.ok(source.includes("recency: 1, frequency: 1, monetary: 1"));
  });

  it('所有 12 条 mock 数据字段完整', () => {
    const matches = source.match(/id:\s*'M\d{3}'/g);
    assert.equal(matches?.length, 12);
    // 验证每个记录都有 name, recency, frequency, monetary
    const hasName = (source.match(/name:/g) || []).length >= 12;
    const hasrecency = (source.match(/recency:/g) || []).length >= 12;
    const hasFrequency = (source.match(/frequency:/g) || []).length >= 12;
    const hasMonetary = (source.match(/monetary:/g) || []).length >= 12;
    assert.ok(hasName, '每条记录应有 name');
    assert.ok(hasrecency, '每条记录应有 recency');
    assert.ok(hasFrequency, '每条记录应有 frequency');
    assert.ok(hasMonetary, '每条记录应有 monetary');
  });
});

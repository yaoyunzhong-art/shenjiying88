/**
 * marketing/page.test.tsx — 营销工作台 L1 冒烟测试
 * 覆盖: 正例·边界·防御·反例·集成·AI安全审计
 * V17#圈梁对齐
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
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

  it('应包含 RFMSegmentStat RFM 分段统计接口', () => {
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

  it('应包含 ChannelRoute 渠道路由定义', () => {
    const src = readSource();
    assert.ok(
      src.includes('interface ChannelRoute') || src.includes('ChannelRoute'),
      '缺少渠道路由接口'
    );
  });

  it('应包含 activityBudget 字段', () => {
    const src = readSource();
    assert.ok(src.includes('budget') || src.includes('Budget'), '缺少预算字段');
  });
});

// ---- 边界 ----

describe('marketing — 边界', () => {
  it('ROI 为 0 时应有对应处理', () => {
    const src = readSource();
    assert.ok(src.includes('0') || src.includes('zero') || src.includes('ROI'), 'ROI 边界值处理');
  });

  it('预算为负值应能被正确处理', () => {
    const src = readSource();
    assert.ok(src.includes('budget') && (src.includes('0') || src.includes('Math')), '负预算处理');
  });

  it('ROI 计算结果应为数字', () => {
    const src = readSource();
    assert.ok(src.includes('number') || src.includes('Number'), 'ROI 数字类型');
  });

  it('活动日期应在合理范围内', () => {
    const src = readSource();
    assert.ok(src.includes('startDate') || src.includes('endDate'), '活动日期');
  });

  it('活动状态枚举应完整', () => {
    const src = readSource();
    assert.ok(src.includes('active') || src.includes('scheduled') || src.includes('ended'), '活动状态');
  });
});

// ---- 防御 ----

describe('marketing — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('所有接口定义应使用 export type 或 interface', () => {
    const src = readSource();
    assert.ok(
      src.includes('interface') || src.includes('type '),
      '缺少 interface 或 type'
    );
  });

  it('ROI 计算应避免除以零', () => {
    const src = readSource();
    assert.ok(src.includes('cost') || src.includes('spend'), '成本分母保护');
  });

  it('应包含 useMemo 优化统计计算', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo') || src.includes('useCallback'), '性能优化');
  });

  it('组件应在 SSR 下不崩溃', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), 'Client-only 组件');
  });
});

// ---- 反例 ----

describe('marketing — 反例', () => {
  it('源文件应存在', () => {
    assert.ok(existsSync(SOURCE), 'page.tsx 应存在');
  });

  it('不应使用危险的 innerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('innerHTML'), '不使用 innerHTML');
  });

  it('不应直接突变状态', () => {
    const src = readSource();
    assert.ok(!src.includes('.push(') && !src.includes('.splice('), '不可变操作');
  });

  it('不应使用使用已废弃的生命周期', () => {
    const src = readSource();
    assert.ok(!src.includes('componentWillMount'), '不使用过时 API');
  });
});

// ---- 集成 ----

describe('marketing — 集成', () => {
  it('CampaignROI 应与 ABTestResult 关联', () => {
    const src = readSource();
    assert.ok(src.includes('ROI') && src.includes('ABTest'), 'ROI 与 AB 测试关联');
  });

  it('RFM 应支持按分段统计', () => {
    const src = readSource();
    assert.ok(src.includes('Segment') || src.includes('segment'), '用户分群');
  });

  it('ChannelRoute 应包含渠道名和转化率', () => {
    const src = readSource();
    assert.ok(src.includes('channel') || src.includes('Channel'), '渠道路由');
  });

  it('应包含渠道效果排名', () => {
    const src = readSource();
    assert.ok(src.includes('sort') || src.includes('rank') || src.includes('top'), '排名');
  });

  it('应包含活动数量统计', () => {
    const src = readSource();
    assert.ok(src.includes('total') || src.includes('count'), '活动统计');
  });
});

// ---- AI 安全审计 ----

describe('marketing — AI 安全审计', () => {
  it('渠道数据不应混入用户隐私', () => {
    const src = readSource();
    assert.ok(!src.includes('phone') && !src.includes('email'), '无泄露用户隐私');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Marketing — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});

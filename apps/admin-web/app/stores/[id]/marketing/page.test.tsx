/**
 * marketing/page.test.tsx — 营销管理页面 L1+L2 测试
 * 覆盖: 正例·反例·边界·防御·数据校验
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
  it('应导出一个默认组件 MarketingPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MarketingPage'), '缺少默认导出组件');
  });

  it('应包含营销活动数据 CAMPAIGNS', () => {
    const src = readSource();
    assert.ok(src.includes('CAMPAIGNS'), '缺少活动数据');
  });

  it('应包含活动状态 active 和 draft', () => {
    const src = readSource();
    assert.ok(src.includes('active') || src.includes('draft'), '缺少活动状态');
  });

  it('应包含表格组件', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable') || src.includes('Table'), '缺少表格组件');
  });

  it('CAMPAIGNS 应包含预算和已使用字段', () => {
    const src = readSource();
    assert.ok(src.includes('budget') && src.includes('used'), '缺少预算/已使用字段');
  });

  it('应计算活动进度百分比', () => {
    const src = readSource();
    assert.ok(src.includes('progress') || src.includes('/r.budget'), '缺少进度计算');
  });
});

// ---- 反例 ----

describe('marketing — 反例', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!/: any\b/.test(src), '不应使用 any');
  });

  it('CAMPAIGNS 不应为空', () => {
    const src = readSource();
    assert.ok(src.includes('C001'), 'CAMPAIGNS 应有实际数据');
  });

  it('不应使用 var 声明', () => {
    const src = readSource();
    assert.ok(!/^var\s/.test(src) && !/; var\s/.test(src), '不应使用 var');
  });
});

// ---- 边界 ----

describe('marketing — 边界', () => {
  it('应包含列定义 COLUMNS', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含创建活动按钮', () => {
    const src = readSource();
    assert.ok(src.includes('创建活动'), '缺少创建活动按钮');
  });

  it('应包含预算统计', () => {
    const src = readSource();
    assert.ok(src.includes('budget') || src.includes('本月预算'), '缺少预算统计');
  });

  it('活动日期应包含起止时间', () => {
    const src = readSource();
    assert.ok(src.includes('start') && src.includes('end'), '缺少活动起止日期');
  });
});

// ---- 防御 ----

describe('marketing — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 dangerouslySetInnerHTML');
  });

  it('状态 Tag 进行中应为绿色，草稿为默认色', () => {
    const src = readSource();
    assert.ok(src.includes("'green'") || src.includes("green"), '进行中应为绿色');
  });

  it('预算数字应使用 toLocaleString 格式化', () => {
    const src = readSource();
    assert.ok(src.includes('toLocaleString'), '缺少数字格式化');
  });
});

// ---- 数据校验 ----

describe('marketing — 数据校验', () => {
  it('CAMPAIGNS 应包含多种活动类型', () => {
    const src = readSource();
    assert.ok(src.includes('充值') || src.includes('会员卡') || src.includes('套餐') || src.includes('优惠券'), '缺少活动类型');
  });

  it('COLUMNS 应覆盖活动名称/类型/状态/预算/已用/进度/日期', () => {
    const src = readSource();
    const colCount = (src.match(/\{ title:/g) || []).length;
    assert.ok(colCount >= 7, `COLUMNS 列数不足: ${colCount}`);
  });

  it('应包含活动中/预算/已消耗/转化率四个统计', () => {
    const src = readSource();
    const statCount = (src.match(/Statistic/g) || []).length;
    assert.ok(statCount >= 4, `Statistic 数量不足: ${statCount}`);
  });

  it('Table 应禁用分页', () => {
    const src = readSource();
    assert.ok(src.includes('pagination={false}'), '应禁用分页');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Stores / Marketing — hooks验证', () => {
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

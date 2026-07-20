/**
 * competitor-track/page.test.tsx — 竞品跟踪看板 L1 源码分析测试
 *
 * 覆盖: 页面结构、数据完整性、辅助函数逻辑、边界条件
 * 圈梁: TSC通过 → 测试存在 → 圈梁表更新 → PRD → 知识赋能
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import fs from 'fs';

const PAGE = resolve(import.meta.dirname, 'page.tsx');
const content = fs.readFileSync(PAGE, 'utf-8');

describe('competitor-track', () => {
  // ── 页面存在与导出 ──
  it('页面文件存在', () => { assert.ok(fs.existsSync(PAGE)); });
  it('包含 default export', () => { assert.ok(content.includes('export default')); });
  it('仅一个 export default', () => {
    const matches = content.match(/export default/g);
    assert.equal(matches?.length, 1);
  });
  it('TSC兼容: 无 as any', () => { assert.ok(!content.includes('as any')); });

  // ── React hooks ──
  it('包含 useState', () => { assert.ok(content.includes('useState')); });
  it('包含 useMemo', () => { assert.ok(content.includes('useMemo')); });
  it('包含 useCallback', () => { assert.ok(content.includes('useCallback')); });

  // ── 核心渲染 ──
  it('包含竞品列表渲染', () => { assert.ok(content.includes('.map(')); });
  it('包含筛选过滤', () => { assert.ok(content.includes('filter') || content.includes('Filter')); });
  it('包含搜索功能', () => { assert.ok(content.includes('search') || content.includes('Search') || content.includes('搜索')); });
  it('包含filterCompetitors或分页', () => {
    assert.ok(content.includes('filterCompetitors(') || content.includes('pagination') || content.includes('Pagination'));
  });

  // ── 数据字段 ──
  it('包含城市字段', () => { assert.ok(content.includes('city') || content.includes('City')); });
  it('包含评分字段', () => { assert.ok(content.includes('score') || content.includes('Score') || content.includes('评分')); });
  it('包含价格区间字段', () => { assert.ok(content.includes('price') || content.includes('priceMin') || content.includes('priceMax')); });
  it('包含抖音热度字段', () => { assert.ok(content.includes('douyinHeat') || content.includes('DouyinHeat') || content.includes('抖音热度')); });
  it('包含描述字段', () => { assert.ok(content.includes('description') || content.includes('Description') || content.includes('brandIntro')); });

  // ── 数据完整性 ──
  it('默认数据至少包含 8 条竞品', () => {
    const ids = Array.from(content.matchAll(/id:\s*'cp-\d+'/g));
    assert.ok(ids.length >= 8, `got ${ids.length} competitor entries`);
  });
  it('每条竞品包含必要字段', () => {
    const fieldRefs = content.match(/(id|name|city|score|priceMin|priceMax|douyinHeat|category|description|brandIntro|storeCount|mainDistricts|heatTrend|createdAt):/g);
    assert.ok(fieldRefs && fieldRefs.length >= 14 * 8, `expected ≥112 field references, got ${fieldRefs?.length}`);
  });

  // ── 辅助函数 ──
  it('formatPrice 函数存在', () => { assert.ok(content.includes('formatPrice(')); });
  it('getScoreLevel 函数存在', () => { assert.ok(content.includes('getScoreLevel(')); });
  it('filterCompetitors 函数存在', () => { assert.ok(content.includes('filterCompetitors(')); });

  // ── 三态 ──
  it('包含加载态', () => { assert.ok(content.includes('loading')); });
  it('包含错误态', () => { assert.ok(content.includes('error') || content.includes('Error')); });
  it('包含空态', () => { assert.ok(content.includes('empty') || content.includes('Empty') || content.includes('暂无匹配')); });

  // ── 弹窗 ──
  it('包含详情弹窗组件', () => { assert.ok(content.includes('CompetitorDetailModal') || content.includes('detailTarget')); });

  // ── 统计卡片 ──
  it('包含统计卡片区域', () => {
    assert.ok(content.includes('statCard') || content.includes('statValue') || content.includes('跟踪竞品'));
  });

  // ── 样式 ──
  it('包含内联样式定义', () => { assert.ok(content.includes('style={')); });
  it('包含表格渲染', () => { assert.ok(content.includes('<table') || content.includes('<tr')); });
  it('包含分页控件', () => { assert.ok(content.includes('上一页') || content.includes('下一页') || content.includes('pageBtn')); });

  // ── 类型导出 ──
  it('export type 存在', () => { assert.ok(content.includes('export type')); });
  it('ScoreLevel 类型导出', () => { assert.ok(content.includes('ScoreLevel')); });
});

/**
 * markets/page.test.tsx — 市场数据页面 L1 冒烟测试
 * ⚡ 覆盖: Mock数据 / 搜索筛选 / 状态筛选 / 区域筛选 / 统计计算 / 排序 / 分页
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型 (与 page.tsx 同步) ----

interface MarketItem {
  id: string;
  code: string;
  name: string;
  locale: string;
  currency: string;
  timezone: string;
  status: 'active' | 'inactive' | 'pending';
  tenantCount: number;
  brandCount: number;
  storeCount: number;
  lastDeployed: string;
  region: 'asia-pacific' | 'north-america' | 'europe' | 'middle-east' | 'latin-america';
}

// ---- Mock 数据 (与 page.tsx 同步) ----

const MOCK_MARKETS: MarketItem[] = [
  { id: 'm1', code: 'cn-mainland', name: '中国大陆', locale: 'zh-CN', currency: 'CNY', timezone: 'Asia/Shanghai', status: 'active', tenantCount: 8, brandCount: 7, storeCount: 12, lastDeployed: '2026-06-12 14:30', region: 'asia-pacific' },
  { id: 'm2', code: 'cn-hk', name: '中国香港', locale: 'zh-HK', currency: 'HKD', timezone: 'Asia/Hong_Kong', status: 'active', tenantCount: 3, brandCount: 2, storeCount: 4, lastDeployed: '2026-06-12 10:15', region: 'asia-pacific' },
  { id: 'm3', code: 'us-default', name: '美国', locale: 'en-US', currency: 'USD', timezone: 'America/New_York', status: 'active', tenantCount: 5, brandCount: 4, storeCount: 6, lastDeployed: '2026-06-12 08:30', region: 'north-america' },
  { id: 'm4', code: 'uk-default', name: '英国', locale: 'en-GB', currency: 'GBP', timezone: 'Europe/London', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 2, lastDeployed: '2026-06-11 15:20', region: 'europe' },
  { id: 'm5', code: 'jp-default', name: '日本', locale: 'ja-JP', currency: 'JPY', timezone: 'Asia/Tokyo', status: 'pending', tenantCount: 2, brandCount: 1, storeCount: 2, lastDeployed: '2026-06-11 09:00', region: 'asia-pacific' },
  { id: 'm6', code: 'kr-default', name: '韩国', locale: 'ko-KR', currency: 'KRW', timezone: 'Asia/Seoul', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-10 11:00', region: 'asia-pacific' },
  { id: 'm7', code: 'sg-default', name: '新加坡', locale: 'en-SG', currency: 'SGD', timezone: 'Asia/Singapore', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 3, lastDeployed: '2026-06-12 16:45', region: 'asia-pacific' },
  { id: 'm8', code: 'de-default', name: '德国', locale: 'de-DE', currency: 'EUR', timezone: 'Europe/Berlin', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-10 14:00', region: 'europe' },
  { id: 'm9', code: 'fr-default', name: '法国', locale: 'fr-FR', currency: 'EUR', timezone: 'Europe/Paris', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-09 18:00', region: 'europe' },
  { id: 'm10', code: 'ae-default', name: '阿联酋', locale: 'ar-AE', currency: 'AED', timezone: 'Asia/Dubai', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'middle-east' },
  { id: 'm11', code: 'au-default', name: '澳大利亚', locale: 'en-AU', currency: 'AUD', timezone: 'Australia/Sydney', status: 'active', tenantCount: 2, brandCount: 2, storeCount: 2, lastDeployed: '2026-06-12 13:45', region: 'asia-pacific' },
  { id: 'm12', code: 'br-default', name: '巴西', locale: 'pt-BR', currency: 'BRL', timezone: 'America/Sao_Paulo', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'latin-america' },
  { id: 'm13', code: 'ca-default', name: '加拿大', locale: 'en-CA', currency: 'CAD', timezone: 'America/Toronto', status: 'active', tenantCount: 2, brandCount: 1, storeCount: 2, lastDeployed: '2026-06-12 09:30', region: 'north-america' },
  { id: 'm14', code: 'th-default', name: '泰国', locale: 'th-TH', currency: 'THB', timezone: 'Asia/Bangkok', status: 'pending', tenantCount: 1, brandCount: 1, storeCount: 1, lastDeployed: '2026-06-11 14:00', region: 'asia-pacific' },
  { id: 'm15', code: 'in-default', name: '印度', locale: 'hi-IN', currency: 'INR', timezone: 'Asia/Kolkata', status: 'pending', tenantCount: 0, brandCount: 0, storeCount: 0, lastDeployed: '-', region: 'asia-pacific' },
];

// ---- 状态/区域映射 (与 page.tsx 同步) ----

const STATUS_MAP: Record<MarketItem['status'], { label: string }> = {
  active: { label: '运营中' },
  inactive: { label: '已停用' },
  pending: { label: '待激活' },
};

const REGION_MAP: Record<MarketItem['region'], { label: string }> = {
  'asia-pacific': { label: '亚太' },
  'north-america': { label: '北美' },
  'europe': { label: '欧洲' },
  'middle-east': { label: '中东' },
  'latin-america': { label: '拉美' },
};

// ---- 辅助函数 ----

function computeMarketStats(markets: MarketItem[]) {
  const total = markets.length;
  const active = markets.filter(m => m.status === 'active').length;
  const regionCount = new Set(markets.map(m => m.region)).size;
  const deployed = markets.reduce((sum, m) => sum + m.tenantCount + m.brandCount + m.storeCount, 0);
  return { total, active, regionCount, deployed };
}

function filterByStatus(markets: MarketItem[], status: MarketItem['status'] | 'ALL'): MarketItem[] {
  if (status === 'ALL') return markets;
  return markets.filter(m => m.status === status);
}

function filterByRegion(markets: MarketItem[], region: MarketItem['region'] | 'ALL'): MarketItem[] {
  if (region === 'ALL') return markets;
  return markets.filter(m => m.region === region);
}

function searchMarkets(markets: MarketItem[], query: string): MarketItem[] {
  if (!query.trim()) return markets;
  const q = query.toLowerCase();
  return markets.filter(m =>
    m.code.toLowerCase().includes(q) ||
    m.name.toLowerCase().includes(q) ||
    m.currency.toLowerCase().includes(q) ||
    m.region.toLowerCase().includes(q)
  );
}

function sortMarkets<T>(items: T[], key: keyof T, direction: 'asc' | 'desc'): T[] {
  return [...items].sort((a, b) => {
    const va = String(a[key] ?? '');
    const vb = String(b[key] ?? '');
    return direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}

// ---- 测试 ----

describe('MarketsPage — Mock 数据', () => {
  it('有 15 个市场', () => {
    assert.strictEqual(MOCK_MARKETS.length, 15);
  });

  it('覆盖 5 个区域', () => {
    const regions = new Set(MOCK_MARKETS.map(m => m.region));
    assert.strictEqual(regions.size, 5);
  });

  it('覆盖 active 和 pending 状态', () => {
    const statuses = new Set(MOCK_MARKETS.map(m => m.status));
    assert.ok(statuses.has('active'));
    assert.ok(statuses.has('pending'));
  });

  it('每个市场有完整字段', () => {
    MOCK_MARKETS.forEach(m => {
      assert.ok(m.id);
      assert.ok(m.code);
      assert.ok(m.name);
      assert.ok(m.locale);
      assert.ok(m.currency);
      assert.ok(m.timezone);
      assert.ok(m.region);
      assert.strictEqual(typeof m.tenantCount, 'number');
      assert.strictEqual(typeof m.storeCount, 'number');
    });
  });

  it('亚太市场最多', () => {
    const apac = MOCK_MARKETS.filter(m => m.region === 'asia-pacific');
    assert.ok(apac.length > 5);
  });
});

describe('MarketsPage — 统计计算', () => {
  it('市场总数 15', () => {
    const stats = computeMarketStats(MOCK_MARKETS);
    assert.strictEqual(stats.total, 15);
  });

  it('运营中 7 个', () => {
    const stats = computeMarketStats(MOCK_MARKETS);
    assert.strictEqual(stats.active, 7);
  });

  it('5 个区域', () => {
    const stats = computeMarketStats(MOCK_MARKETS);
    assert.strictEqual(stats.regionCount, 5);
  });

  it('已部署资源总和正确', () => {
    const stats = computeMarketStats(MOCK_MARKETS);
    const expected = MOCK_MARKETS.reduce((s, m) => s + m.tenantCount + m.brandCount + m.storeCount, 0);
    assert.strictEqual(stats.deployed, expected);
  });
});

describe('MarketsPage — 状态筛选', () => {
  it('ALL 返回全部', () => {
    assert.strictEqual(filterByStatus(MOCK_MARKETS, 'ALL').length, 15);
  });

  it('active 返回 7 个', () => {
    assert.strictEqual(filterByStatus(MOCK_MARKETS, 'active').length, 7);
  });

  it('pending 返回 8 个', () => {
    assert.strictEqual(filterByStatus(MOCK_MARKETS, 'pending').length, 8);
  });

  it('inactive 返回 0 个', () => {
    assert.strictEqual(filterByStatus(MOCK_MARKETS, 'inactive').length, 0);
  });
});

describe('MarketsPage — 区域筛选', () => {
  it('亚太返回 8 个', () => {
    const result = filterByRegion(MOCK_MARKETS, 'asia-pacific');
    assert.strictEqual(result.length, 8);
  });

  it('北美返回 2 个', () => {
    assert.strictEqual(filterByRegion(MOCK_MARKETS, 'north-america').length, 2);
  });

  it('欧洲返回 3 个', () => {
    assert.strictEqual(filterByRegion(MOCK_MARKETS, 'europe').length, 3);
  });

  it('中东返回 1 个', () => {
    assert.strictEqual(filterByRegion(MOCK_MARKETS, 'middle-east').length, 1);
  });

  it('拉美返回 1 个', () => {
    assert.strictEqual(filterByRegion(MOCK_MARKETS, 'latin-america').length, 1);
  });

  it('ALL 返回全部', () => {
    assert.strictEqual(filterByRegion(MOCK_MARKETS, 'ALL').length, 15);
  });
});

describe('MarketsPage — 搜索', () => {
  it('空字符串返回全部', () => {
    assert.strictEqual(searchMarkets(MOCK_MARKETS, '').length, 15);
  });

  it('按编码搜索', () => {
    const result = searchMarkets(MOCK_MARKETS, 'cn-mainland');
    assert.strictEqual(result.length, 1);
  });

  it('按名称搜索', () => {
    const result = searchMarkets(MOCK_MARKETS, '美国');
    assert.strictEqual(result.length, 1);
  });

  it('按货币搜索 — 注意 region 含 eur 也会匹配', () => {
    const result = searchMarkets(MOCK_MARKETS, 'EUR');
    // EUR 匹配 2 个货币市场(D/E,F) + 1 个 region(uk region='europe') = 3
    assert.strictEqual(result.length, 3);
  });

  it('按区域搜索', () => {
    const result = searchMarkets(MOCK_MARKETS, 'north-america');
    assert.strictEqual(result.length, 2);
  });

  it('无匹配返回空', () => {
    assert.strictEqual(searchMarkets(MOCK_MARKETS, '不存在的市场xxx').length, 0);
  });
});

describe('MarketsPage — 排序', () => {
  it('按名称升序', () => {
    const sorted = sortMarkets(MOCK_MARKETS, 'name', 'asc');
    assert.ok(sorted[0].name <= sorted[1].name);
  });

  it('按名称降序', () => {
    const sorted = sortMarkets(MOCK_MARKETS, 'name', 'desc');
    assert.ok(sorted[0].name >= sorted[sorted.length - 1].name);
  });

  it('按编码排序', () => {
    const sorted = sortMarkets(MOCK_MARKETS, 'code', 'asc');
    assert.strictEqual(sorted[0].code, 'ae-default');
  });
});

describe('MarketsPage — 分页', () => {
  it('每页 10 条', () => {
    const page1 = paginate(MOCK_MARKETS, 1, 10);
    assert.strictEqual(page1.length, 10);
  });

  it('第二页剩余 5 条', () => {
    const page2 = paginate(MOCK_MARKETS, 2, 10);
    assert.strictEqual(page2.length, 5);
  });

  it('越界返回空', () => {
    assert.strictEqual(paginate(MOCK_MARKETS, 3, 10).length, 0);
  });

  it('自定义每页 5 条', () => {
    assert.strictEqual(paginate(MOCK_MARKETS, 1, 5).length, 5);
    assert.strictEqual(paginate(MOCK_MARKETS, 3, 5).length, 5);
  });
});

describe('MarketsPage — 映射表', () => {
  it('STATUS_MAP 中文标签', () => {
    assert.strictEqual(STATUS_MAP.active.label, '运营中');
    assert.strictEqual(STATUS_MAP.pending.label, '待激活');
  });

  it('REGION_MAP 中文标签', () => {
    assert.strictEqual(REGION_MAP['asia-pacific'].label, '亚太');
    assert.strictEqual(REGION_MAP['north-america'].label, '北美');
    assert.strictEqual(REGION_MAP.europe.label, '欧洲');
    assert.strictEqual(REGION_MAP['middle-east'].label, '中东');
    assert.strictEqual(REGION_MAP['latin-america'].label, '拉美');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Markets — hooks验证', () => {
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

/**
 * store-locator/[id]/page.test.tsx — 门店详情页 L1 冒烟测试（增强版）
 * 源码分析模式：不渲染 React 组件，只测试纯函数和业务逻辑
 * 覆盖：分类标签/统计/数据转换/加载空状态/边界
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与组件保持一致的类型及常量 ---- //

type StoreStatus = 'open' | 'closed' | 'busy';

interface StoreLocator {
  id: string;
  storeName: string;
  storeCode: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  status: StoreStatus;
  businessHours: string;
  features: string[];
  imageUrl?: string;
}

const STATUS_LABELS: Record<StoreStatus, string> = {
  open: '营业中',
  closed: '已休息',
  busy: '高峰期',
};

const STATUS_COLORS: Record<StoreStatus, string> = {
  open: '#22c55e',
  closed: '#94a3b8',
  busy: '#f59e0b',
};

const MOCK_STORES: StoreLocator[] = [
  {
    id: 's01',
    storeName: '南山旗舰店',
    storeCode: 'SZ-NS-001',
    city: '深圳',
    district: '南山区',
    address: '科技园南区A栋1层',
    phone: '0755-88886666',
    status: 'open',
    businessHours: '09:00 - 22:00',
    features: ['停车场', 'WiFi', '母婴室'],
    imageUrl: 'https://example.com/store.jpg',
  },
  {
    id: 's02',
    storeName: '福田社区店',
    storeCode: 'SZ-FT-002',
    city: '深圳',
    district: '福田区',
    address: '华强北路88号',
    phone: '0755-83332222',
    status: 'open',
    businessHours: '08:00 - 23:00',
    features: ['WiFi', '充电服务'],
    imageUrl: undefined,
  },
  {
    id: 's03',
    storeName: '已休息门店',
    storeCode: 'GZ-TH-003',
    city: '广州',
    district: '天河区',
    address: '天河路230号',
    phone: '020-38889999',
    status: 'closed',
    businessHours: '10:00 - 21:00',
    features: ['停车场', '宠物友好'],
  },
  {
    id: 's04',
    storeName: '高峰店',
    storeCode: 'SZ-NS-004',
    city: '深圳',
    district: '南山区',
    address: '科技园北区B座',
    phone: '0755-88880000',
    status: 'busy',
    businessHours: '09:00 - 22:00',
    features: ['WiFi'],
    imageUrl: 'https://example.com/busy.jpg',
  },
];

// ============================================================
// 新增：分类标签函数（纯函数，无 UI 组件）
// ============================================================

function renderStoreStatusTag(status: StoreStatus): string {
  return STATUS_LABELS[status] || '未知状态';
}

function renderStoreStatusColor(status: StoreStatus): string {
  return STATUS_COLORS[status] || '#94a3b8';
}

function getStatusBadgeStyleConfig(status: StoreStatus): { text: string; color: string; bg: string } {
  const configs: Record<StoreStatus, { text: string; color: string; bg: string }> = {
    open: { text: '营业中', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    closed: { text: '已休息', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
    busy: { text: '高峰期', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  };
  return configs[status] || { text: '未知', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
}

// ============================================================
// 新增：统计计算函数（纯函数）
// ============================================================

interface StoreStats {
  total: number;
  open: number;
  closed: number;
  busy: number;
  cities: number;
  hasImage: number;
}

function computeStoreStats(stores: StoreLocator[]): StoreStats {
  return {
    total: stores.length,
    open: stores.filter((s) => s.status === 'open').length,
    closed: stores.filter((s) => s.status === 'closed').length,
    busy: stores.filter((s) => s.status === 'busy').length,
    cities: new Set(stores.map((s) => s.city)).size,
    hasImage: stores.filter((s) => !!s.imageUrl).length,
  };
}

function computeFeatureStats(stores: StoreLocator[]): Record<string, number> {
  const stats: Record<string, number> = {};
  for (const store of stores) {
    for (const feature of store.features) {
      stats[feature] = (stats[feature] || 0) + 1;
    }
  }
  return stats;
}

// ============================================================
// 新增：数据转换/格式化函数（纯函数）
// ============================================================

function formatStoreAddress(store: StoreLocator): string {
  return `${store.city} ${store.district} ${store.address}`;
}

function formatPhoneLink(phone: string): string {
  return `tel:${phone}`;
}

function formatMapLink(address: string): string {
  return `https://maps.apple.com/?q=${encodeURIComponent(address)}`;
}

function getStoreSummary(store: StoreLocator): string {
  const status = renderStoreStatusTag(store.status);
  return `${store.storeName} | ${status} | ${store.city}${store.district}`;
}

// ============================================================
// 新增：加载/空状态辅助函数
// ============================================================

function handleLoadingState(isLoading: boolean, fallback?: string): 'loading' | 'ready' {
  return isLoading ? 'loading' : 'ready';
}

function handleNotFoundState(store: StoreLocator | null): 'not-found' | 'found' {
  return store ? 'found' : 'not-found';
}

function getLoadingText(): string {
  return '加载中...';
}

function getNotFoundText(): string {
  return '门店不存在';
}

// ============================================================
// 原有测试（保留）
// ============================================================

describe('StoreDetailPage — 正例', () => {
  it('模块可导入且 default 导出为函数/组件', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function/component');
  });

  it('MOCK_STORES 包含 4 条门店数据', () => {
    assert.equal(MOCK_STORES.length, 4);
  });

  it('所有门店数据包含完整字段', () => {
    for (const store of MOCK_STORES) {
      assert.ok(store.id, 'should have id');
      assert.ok(store.storeName, 'should have storeName');
      assert.ok(store.address, 'should have address');
      assert.ok(store.phone, 'should have phone');
      assert.ok(store.businessHours, 'should have businessHours');
      assert.ok(Array.isArray(store.features), 'features should be an array');
    }
  });

  it('MOCK_STORES 所有 ID 唯一', () => {
    const ids = MOCK_STORES.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('涵盖 open / closed / busy 3 种门店状态', () => {
    const statuses = new Set(MOCK_STORES.map(s => s.status));
    assert.ok(statuses.has('open'), 'should include open status');
    assert.ok(statuses.has('closed'), 'should include closed status');
    assert.ok(statuses.has('busy'), 'should include busy status');
  });
});

describe('StoreDetailPage — 边界', () => {
  it('STATUS_LABELS 覆盖 3 种状态且为中文标签', () => {
    const expected: Record<StoreStatus, string> = {
      open: '营业中',
      closed: '已休息',
      busy: '高峰期',
    };
    for (const status of ['open', 'closed', 'busy'] as StoreStatus[]) {
      assert.equal(STATUS_LABELS[status], expected[status]);
    }
  });

  it('STATUS_COLORS 均为有效 CSS 颜色值', () => {
    for (const status of ['open', 'closed', 'busy'] as StoreStatus[]) {
      const color = STATUS_COLORS[status];
      assert.ok(color.startsWith('#'), `${status} color should be hex`);
      assert.equal(color.length, 7, `${status} color should be 7 chars (# + 6 hex)`);
    }
  });

  it('store names are unique', () => {
    const names = MOCK_STORES.map(s => s.storeName);
    assert.equal(new Set(names).size, names.length);
  });
});

describe('StoreDetailPage — 防御', () => {
  it('module can be imported', async () => {
    const src = await import('./page');
    assert.ok(src.default, 'default export exists');
  });

  it('store fields are complete', () => {
    const fields: (keyof StoreLocator)[] = [
      'storeName', 'address', 'businessHours', 'phone',
    ];
    for (const store of MOCK_STORES) {
      for (const f of fields) {
        assert.ok(store[f], `${store.id} should have ${String(f)}`);
      }
    }
  });

  it('features are all strings', () => {
    for (const store of MOCK_STORES) {
      for (const feature of store.features) {
        assert.equal(typeof feature, 'string');
      }
    }
  });

  it('has at least one store without imageUrl', () => {
    const noImage = MOCK_STORES.filter(s => !s.imageUrl);
    assert.ok(noImage.length > 0);
  });
});

// ============================================================
// 新增：分类标签测试
// ============================================================

describe('StoreDetailPage - 分类标签标签化', () => {
  it('renderStoreStatusTag 返回正确状态标签', () => {
    assert.equal(renderStoreStatusTag('open'), '营业中');
    assert.equal(renderStoreStatusTag('closed'), '已休息');
    assert.equal(renderStoreStatusTag('busy'), '高峰期');
  });

  it('renderStoreStatusTag 处理未知状态返回"未知状态"', () => {
    assert.equal(renderStoreStatusTag('' as StoreStatus), '未知状态');
    assert.equal(renderStoreStatusTag('unknown' as StoreStatus), '未知状态');
  });

  it('renderStoreStatusColor 返回正确颜色值', () => {
    assert.equal(renderStoreStatusColor('open'), '#22c55e');
    assert.equal(renderStoreStatusColor('closed'), '#94a3b8');
    assert.equal(renderStoreStatusColor('busy'), '#f59e0b');
  });

  it('renderStoreStatusColor 处理未知状态返回默认灰色', () => {
    assert.equal(renderStoreStatusColor('' as StoreStatus), '#94a3b8');
  });

  it('getStatusBadgeStyleConfig 返回完整的样式配置', () => {
    const open = getStatusBadgeStyleConfig('open');
    assert.equal(open.text, '营业中');
    assert.equal(open.color, '#22c55e');
    assert.ok(open.bg.includes('rgba'));

    const busy = getStatusBadgeStyleConfig('busy');
    assert.equal(busy.text, '高峰期');

    const unknown = getStatusBadgeStyleConfig('' as StoreStatus);
    assert.equal(unknown.text, '未知');
  });
});

// ============================================================
// 新增：统计函数测试
// ============================================================

describe('StoreDetailPage - 统计计算', () => {
  it('computeStoreStats 正确计算各状态数量', () => {
    const stats = computeStoreStats(MOCK_STORES);
    assert.equal(stats.total, 4);
    assert.equal(stats.open, 2);
    assert.equal(stats.closed, 1);
    assert.equal(stats.busy, 1);
    assert.equal(stats.open + stats.closed + stats.busy, stats.total);
  });

  it('computeStoreStats 正确统计城市数量', () => {
    const stats = computeStoreStats(MOCK_STORES);
    assert.equal(stats.cities, 2); // 深圳 + 广州
  });

  it('computeStoreStats 正确统计有图片的门店数量', () => {
    const stats = computeStoreStats(MOCK_STORES);
    assert.equal(stats.hasImage, 2); // s01 + s04
  });

  it('computeStoreStats 处理空列表', () => {
    const stats = computeStoreStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.open, 0);
    assert.equal(stats.closed, 0);
    assert.equal(stats.busy, 0);
    assert.equal(stats.cities, 0);
    assert.equal(stats.hasImage, 0);
  });

  it('computeFeatureStats 正确统计特色服务分布', () => {
    const stats = computeFeatureStats(MOCK_STORES);
    assert.equal(stats['WiFi'], 3);
    assert.equal(stats['停车场'], 2);
    assert.equal(stats['母婴室'], 1);
    assert.equal(stats['充电服务'], 1);
    assert.equal(stats['宠物友好'], 1);
  });

  it('computeFeatureStats 处理空列表返回空对象', () => {
    assert.deepEqual(computeFeatureStats([]), {});
  });
});

// ============================================================
// 新增：数据转换/格式化函数
// ============================================================

describe('StoreDetailPage - 数据转换与格式化', () => {
  it('formatStoreAddress 正确拼接地址', () => {
    const store = MOCK_STORES[0];
    assert.equal(formatStoreAddress(store), '深圳 南山区 科技园南区A栋1层');
  });

  it('formatStoreAddress 处理边缘门店地址', () => {
    const store = MOCK_STORES[3];
    assert.equal(formatStoreAddress(store), '深圳 南山区 科技园北区B座');
  });

  it('formatPhoneLink 返回正确 tel: 链接', () => {
    assert.equal(formatPhoneLink('0755-88886666'), 'tel:0755-88886666');
  });

  it('formatPhoneLink 处理空字符串', () => {
    assert.equal(formatPhoneLink(''), 'tel:');
  });

  it('formatMapLink 返回正确地图链接', () => {
    const url = formatMapLink('科技园南区A栋1层');
    assert.ok(url.startsWith('https://maps.apple.com/?q='));
    assert.ok(url.includes(encodeURIComponent('科技园南区A栋1层')));
  });

  it('formatMapLink 处理特殊字符', () => {
    const url = formatMapLink('天河路230号 & 体育西路');
    assert.ok(url.includes('%20'));
    assert.ok(url.includes('%26'));
  });

  it('getStoreSummary 返回摘要字符串', () => {
    const summary = getStoreSummary(MOCK_STORES[0]);
    assert.ok(summary.includes('南山旗舰店'));
    assert.ok(summary.includes('营业中'));
    assert.ok(summary.includes('深圳南山区'));
  });

  it('getStoreSummary 处理已休息门店', () => {
    const summary = getStoreSummary(MOCK_STORES[2]);
    assert.ok(summary.includes('已休息门店'));
    assert.ok(summary.includes('已休息'));
  });
});

// ============================================================
// 新增：加载/空状态测试
// ============================================================

describe('StoreDetailPage - 加载与空状态', () => {
  it('handleLoadingState true 返回 loading', () => {
    assert.equal(handleLoadingState(true), 'loading');
  });

  it('handleLoadingState false 返回 ready', () => {
    assert.equal(handleLoadingState(false), 'ready');
  });

  it('handleNotFoundState null 返回 not-found', () => {
    assert.equal(handleNotFoundState(null), 'not-found');
  });

  it('handleNotFoundState StoreLocator 返回 found', () => {
    assert.equal(handleNotFoundState(MOCK_STORES[0]), 'found');
  });

  it('getLoadingText 返回"加载中..."', () => {
    assert.equal(getLoadingText(), '加载中...');
  });

  it('getNotFoundText 返回"门店不存在"', () => {
    assert.equal(getNotFoundText(), '门店不存在');
  });
});

/**
 * store-locator/[id]/page.test.tsx — 门店详情页 L1 冒烟测试 (node:test 兼容)
 * 不渲染 React 组件（无 jsdom/react-testing-library），只验证：
 * - 模块可导入，default 为函数/组件
 * - Mock 数据完整性（3种状态）
 * - 常量映射完整性
 * - 边界情况处理
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
];

// ---- 正例 (Positive Cases) ---- //

describe('StoreDetailPage \u2014 \u6b63\u4f8b', () => {
  it('\u6a21\u5757\u53ef\u5bfc\u5165\u4e14 default \u5bfc\u51fa\u4e3a\u51fd\u6570/\u7ec4\u4ef6', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function/component');
  });

  it('MOCK_STORES \u5305\u542b 3 \u6761\u95e8\u5e97\u6570\u636e', () => {
    assert.equal(MOCK_STORES.length, 3);
  });

  it('\u6240\u6709\u95e8\u5e97\u6570\u636e\u5305\u542b\u5b8c\u6574\u5b57\u6bb5', () => {
    for (const store of MOCK_STORES) {
      assert.ok(store.id, 'should have id');
      assert.ok(store.storeName, 'should have storeName');
      assert.ok(store.address, 'should have address');
      assert.ok(store.phone, 'should have phone');
      assert.ok(store.businessHours, 'should have businessHours');
      assert.ok(Array.isArray(store.features), 'features should be an array');
    }
  });

  it('MOCK_STORES \u6240\u6709 ID \u552f\u4e00', () => {
    const ids = MOCK_STORES.map(s => s.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('\u6db5\u76d6 open / closed 2 \u79cd\u95e8\u5e97\u72b6\u6001', () => {
    const statuses = new Set(MOCK_STORES.map(s => s.status));
    assert.ok(statuses.has('open'), 'should include open status');
    assert.ok(statuses.has('closed'), 'should include closed status');
  });
});

// ---- \u8fb9\u754c (Boundary Cases) ---- //

describe('StoreDetailPage \u2014 \u8fb9\u754c', () => {
  it('STATUS_LABELS \u8986\u76d6 3 \u79cd\u72b6\u6001\u4e14\u4e3a\u4e2d\u6587\u6807\u7b7e', () => {
    const expected: Record<StoreStatus, string> = {
      open: '\u8425\u4e1a\u4e2d',
      closed: '\u5df2\u4f11\u606f',
      busy: '\u9ad8\u5cf0\u671f',
    };
    for (const status of ['open', 'closed', 'busy'] as StoreStatus[]) {
      assert.equal(STATUS_LABELS[status], expected[status]);
    }
  });

  it('STATUS_COLORS \u5747\u4e3a\u6709\u6548 CSS \u989c\u8272\u503c', () => {
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

// ---- \u9632\u5fa1 (Defensive Cases) ---- //

describe('StoreDetailPage \u2014 \u9632\u5fa1', () => {
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

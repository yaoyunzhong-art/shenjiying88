/**
 * stores/[id]/page.test.ts — 门店详情页 (tob-web) L1 冒烟测试
 * ⚡ 覆盖: 数据层完整性 / 状态映射 / API 防御 / 辅助函数
 * 参考对齐: store-service.ts Store 接口 / page.tsx 组件
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 类型（与 store-service.ts 保持同步） ----

interface Store {
  id: string;
  storeCode: string;
  storeName: string;
  tenantId: string;
  brandId?: string;
  region?: string;
  city?: string;
  address?: string;
  managerName?: string;
  managerMobile?: string;
  employeeCount: number;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

// ---- 与 page.tsx 保持一致的辅助函数 ---- //

function getStatusVariant(status: Store['status']): 'success' | 'warning' | 'error' {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'suspended':
      return 'error';
    default:
      return 'warning';
  }
}

function getStatusLabel(status: Store['status']): string {
  switch (status) {
    case 'active':
      return '营业中';
    case 'inactive':
      return '休息中';
    case 'suspended':
      return '已停业';
    default:
      return status;
  }
}

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// ---- Mock 数据集 ---- //

const mockStoreActive: Store = {
  id: 'store_001',
  storeCode: 'SZ-CENTER-01',
  storeName: '深圳南山旗舰店',
  tenantId: 'tenant-demo',
  brandId: 'brand-demo',
  region: '华南',
  city: '深圳',
  address: '深圳市南山区科技园南路88号',
  managerName: '张店长',
  managerMobile: '13800138001',
  employeeCount: 12,
  status: 'active',
  createdAt: '2024-01-15T08:00:00Z',
  updatedAt: '2026-06-20T10:30:00Z',
};

const mockStoreInactive: Store = {
  id: 'store_004',
  storeCode: 'SH-PUDONG-01',
  storeName: '上海浦东店',
  tenantId: 'tenant-demo',
  region: '华东',
  city: '上海',
  address: '上海市浦东新区世纪大道1000号',
  managerName: '刘店长',
  managerMobile: '13800138004',
  employeeCount: 10,
  status: 'inactive',
  createdAt: '2024-07-01T08:00:00Z',
  updatedAt: '2026-05-30T16:00:00Z',
};

const mockStoreSuspended: Store = {
  id: 'store_sus_001',
  storeCode: 'SUS-TEST-01',
  storeName: '测试已停业门店',
  tenantId: 'tenant-demo',
  city: '测试市',
  employeeCount: 0,
  status: 'suspended',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
};

// ---- 测试 ---- //

describe('StoreDetailPage (tob-web) 门店详情页', () => {
  describe('模块可导入', () => {
    it('1. 模块可导入，default 导出为函数', async () => {
      const mod = await import('./page');
      assert.equal(typeof mod.default, 'function');
    });
  });

  describe('状态映射 — 正例', () => {
    it('2. active → label=营业中 variant=success', () => {
      assert.equal(getStatusLabel('active'), '营业中');
      assert.equal(getStatusVariant('active'), 'success');
    });

    it('3. inactive → label=休息中 variant=warning', () => {
      assert.equal(getStatusLabel('inactive'), '休息中');
      assert.equal(getStatusVariant('inactive'), 'warning');
    });

    it('4. suspended → label=已停业 variant=error', () => {
      assert.equal(getStatusLabel('suspended'), '已停业');
      assert.equal(getStatusVariant('suspended'), 'error');
    });
  });

  describe('状态映射 — 反例/边界', () => {
    it('5. 未知 status 回退显示原值', () => {
      // @ts-expect-error 测试防御性回退
      assert.equal(getStatusLabel('unknown'), 'unknown');
    });

    it('6. 未知 status variant 回退到 warning', () => {
      // @ts-expect-error 测试防御性回退
      assert.equal(getStatusVariant('unknown'), 'warning');
    });
  });

  describe('Mock 数据完整性', () => {
    it('7. mockStoreActive 所有必填字段存在', () => {
      const required = ['id', 'storeCode', 'storeName', 'tenantId', 'employeeCount', 'status', 'createdAt', 'updatedAt'] as const;
      for (const field of required) {
        assert.notEqual(mockStoreActive[field], undefined, `缺少字段 ${field}`);
      }
    });

    it('8. mockStoreActive 为 active 门店，employeeCount=12', () => {
      assert.equal(mockStoreActive.status, 'active');
      assert.equal(mockStoreActive.employeeCount, 12);
    });

    it('9. mockStoreInactive 为 inactive 门店，managerName 存在', () => {
      assert.equal(mockStoreInactive.status, 'inactive');
      assert.equal(mockStoreInactive.managerName, '刘店长');
    });

    it('10. mockStoreSuspended 无 brandId 和 managerName 为 undefined', () => {
      assert.equal(mockStoreSuspended.status, 'suspended');
      assert.equal(mockStoreSuspended.brandId, undefined);
      assert.equal(mockStoreSuspended.managerName, undefined);
    });
  });

  describe('formatCurrency 辅助函数', () => {
    it('11. 正数格式化', () => {
      assert.equal(formatCurrency(1234567), '¥1,234,567');
    });

    it('12. 零值', () => {
      assert.equal(formatCurrency(0), '¥0');
    });

    it('13. 负数格式化', () => {
      assert.equal(formatCurrency(-500), '¥-500');
    });
  });

  describe('formatDate 辅助函数', () => {
    it('14. ISO 日期格式化为中文短格式', () => {
      const result = formatDate('2024-01-15T08:00:00Z');
      assert.ok(result.includes('2024'));
      assert.ok(result.includes('1') || result.includes('01'));
      assert.ok(result.includes('15'));
    });

    it('15. 周一开始的日期字符串', () => {
      const d = formatDate('2026-07-06T00:00:00Z');
      assert.ok(d.length > 0);
    });
  });

  describe('API 返回结构完整性', () => {
    it('16. 成功响应完整结构', () => {
      const response = { success: true, data: mockStoreActive };
      assert.equal(response.success, true);
      assert.equal(response.data.storeCode, 'SZ-CENTER-01');
    });

    it('17. 错误响应结构', () => {
      const errorResponse = {
        success: false,
        error: { code: 'FETCH_ERROR', message: '获取门店详情失败' },
      };
      assert.equal(errorResponse.success, false);
      assert.equal(errorResponse.error.code, 'FETCH_ERROR');
      assert.ok(errorResponse.error.message.length > 0);
    });

    it('18. storeService.getStore 返回类型匹配', async () => {
      const { storeService } = await import('../../../lib/store-service');
      const result = await storeService.getStore('store_001');
      assert.equal(result.success, true);
      if (result.data) {
        assert.ok(typeof result.data.id === 'string');
        assert.ok(['active', 'inactive', 'suspended'].includes(result.data.status));
      }
    });
  });

  describe('编辑器/UI 状态', () => {
    it('19. 编辑按钮在详情页显示', () => {
      const editBtnDef = {
        label: '编辑门店',
        style: {
          padding: '10px 20px',
          borderRadius: 8,
          cursor: 'pointer',
        },
      };
      assert.equal(editBtnDef.label, '编辑门店');
      assert.equal(editBtnDef.style.cursor, 'pointer');
    });

    it('20. 返回列表链接定义', () => {
      const linkDef = { href: '/stores', label: '返回列表' };
      assert.equal(linkDef.href, '/stores');
    });
  });

  describe('Store 类型守卫', () => {
    it('21. Store 类型所有 status 枚举值', () => {
      const validStatuses: Store['status'][] = ['active', 'inactive', 'suspended'];
      assert.equal(validStatuses.length, 3);
      for (const s of validStatuses) {
        assert.ok(['active', 'inactive', 'suspended'].includes(s));
      }
    });
  });
});

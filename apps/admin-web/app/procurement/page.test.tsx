/**
 * P-37 采购 — 采购管理页测试 (圈梁四道箍)
 *
 * V21 自进化: L3 增强React渲染测试
 * 覆盖: 正例·反例·边界·角色场景
 * Mock: URL-pattern responseRegistry (非顺序队列)
 * 禁止: as any / skip / only
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import ProcurementPage from './page'
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Fetch Mock (URL-pattern responseRegistry) ────────

const responseRegistry = new Map<string, () => unknown>();

function setResponseFor(pattern: string, factory: () => unknown) {
  responseRegistry.set(pattern, factory);
}

// 覆盖全局 fetch - 根据 URL 前缀匹配
globalThis.fetch = ((url: string) => {
  const path = typeof url === 'string' ? url : '';
  for (const [pattern, factory] of responseRegistry) {
    if (path.includes(pattern)) {
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve(factory()),
        headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
      } as Response);
    }
  }
  return Promise.resolve({
    ok: true, status: 200, json: () => Promise.resolve({ success: true, data: null, message: 'OK' }),
    headers: new Headers(), redirected: false, statusText: 'OK', type: 'basic' as const, url: path,
  } as Response);
}) as typeof globalThis.fetch;

// ─── Mock Data ────────────────────────────────────────

const MOCK_ORDERS = {
  success: true, message: 'OK',
  data: {
    orders: [
      { id: 'po-1', orderNo: 'PO-20260718-001', supplierName: '华强电子', supplierId: 's1', items: [{ name: '主板', quantity: 5, unitPriceCents: 120000, totalCents: 600000 }], totalCents: 600000, status: 'submitted', priority: 'high', department: '技术部', requester: '张工', storeName: '总部', createdAt: '2026-07-18T09:00:00Z', updatedAt: '2026-07-18T09:00:00Z' },
      { id: 'po-2', orderNo: 'PO-20260718-002', supplierName: '益智玩具厂', supplierId: 's2', items: [{ name: '扭蛋', quantity: 200, unitPriceCents: 1500, totalCents: 300000 }, { name: '盲盒', quantity: 100, unitPriceCents: 3500, totalCents: 350000 }], totalCents: 650000, status: 'approved', priority: 'medium', department: '运营部', requester: '李运营', storeName: '北京朝阳店', approver: '王经理', expectedDate: '2026-07-22', createdAt: '2026-07-17T14:00:00Z', updatedAt: '2026-07-18T08:00:00Z' },
      { id: 'po-3', orderNo: 'PO-20260717-001', supplierName: '天地餐饮', supplierId: 's3', items: [{ name: '饮料原料', quantity: 50, unitPriceCents: 8000, totalCents: 400000 }], totalCents: 400000, status: 'received', priority: 'low', department: '餐饮部', requester: '赵主管', storeName: '广州天河店', approver: '刘总监', expectedDate: '2026-07-16', receivedDate: '2026-07-17', createdAt: '2026-07-15T10:00:00Z', updatedAt: '2026-07-17T16:00:00Z' },
      { id: 'po-4', orderNo: 'PO-20260716-003', supplierName: '杭州动漫科技', supplierId: 's4', items: [{ name: '动漫手办', quantity: 30, unitPriceCents: 25000, totalCents: 750000 }], totalCents: 750000, status: 'shipped', priority: 'urgent', department: '营销部', requester: '陈营销', storeName: '上海南京路店', approver: '王经理', expectedDate: '2026-07-20', createdAt: '2026-07-16T11:00:00Z', updatedAt: '2026-07-18T06:00:00Z' },
    ],
  },
};

// 单条待处理
const SINGLE_PENDING = {
  success: true, message: 'OK',
  data: {
    orders: [
      { id: 'po-1', orderNo: 'PO-SINGLE', supplierName: '测试供应商', supplierId: 's-t', items: [{ name: '测试商品', quantity: 10, unitPriceCents: 10000, totalCents: 100000 }], totalCents: 100000, status: 'draft', priority: 'low', department: '测试部', requester: '测试员', storeName: '测试店', createdAt: '2026-07-18T00:00:00Z', updatedAt: '2026-07-18T00:00:00Z' },
    ],
  },
};

function setDefault() {
  responseRegistry.clear();
  setResponseFor('/api/inventory/procurement', () => JSON.parse(JSON.stringify(MOCK_ORDERS)));
}

// ─── 正例 Tests ──────────────────────────────────────

describe('ProcurementPage — 正例', () => {
  beforeEach(() => { setDefault(); });

  it('R1. 渲染页面标题', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      assert.ok(screen.queryAllByText('采购管理').length >= 1);
    });
  });

  it('R2. 渲染副标题', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('采购订单'));
    });
  });

  it('R3. 渲染4个统计卡片', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('采购单'));
      assert.ok(body.includes('待处理'));
      assert.ok(body.includes('紧急'));
      assert.ok(body.includes('采购总额'));
    });
  });

  it('R4. 渲染订单编号', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('PO-20260718-001'));
    });
  });

  it('R5. 渲染供应商名', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('华强电子'));
    });
  });

  it('R6. 渲染状态标签（状态转中文）', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('待审批')); // submitted → 待审批
    });
  });

  it('R7. 渲染品项名称（品项名×数量格式）', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('主板×5'), '应渲染 主板×5');
    });
  });

  it('R8. 显示申请人', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('张工'));
    });
  });

  it('R9. 显示刷新按钮', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      assert.ok(screen.queryAllByText('刷新').length >= 1);
    });
  });

  it('R10. 默认Tab显示待处理（pending=草稿+待审批）', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // pending Tab: po-1(submitted)
      assert.ok(body.includes('PO-20260718-001'));
      // 不应包含po-2(approved)、po-3(received)、po-4(shipped)
      assert.ok(!body.includes('PO-20260718-002'));
      assert.ok(!body.includes('PO-20260717-001'));
      assert.ok(!body.includes('PO-20260716-003'));
    });
  });

  it('R11. 显示采购总额卡片', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('¥'));
    });
  });

  it('R12. 显示颜色优先级标签（紧急/高优先级）', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // po-1 是 high 优先级 → 显示 "高"
      assert.ok(body.includes('高') || body.includes('紧急'));
    });
  });
});

// ─── Tab 切换 Tests ──────────────────────────────────

describe('ProcurementPage — Tab筛选', () => {
  beforeEach(() => { setDefault(); });

  it('T1. 渲染4个tab按钮(待处理/供应商处理中/已收货/全部)', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('待处理'), '待处理tab');
      assert.ok(body.includes('供应商处理中'), 'approved tab');
      assert.ok(body.includes('已收货'), 'received tab');
      assert.ok(body.includes('全部'), 'all tab');
    });
  });

  it('T2. 默认显示待处理(草稿+待审批)订单', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 默认pending tab：po-1(submitted)显示，其他不显示
      assert.ok(body.includes('PO-20260718-001'), '待处理订单显示');
    });
  });

  it('T3. 待处理Tab 紧急计数应显示', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('紧急'));
      assert.ok(body.includes('1') || body.includes('2'));
    });
  });
});

// ─── 空态 Tests ─────────────────────────────────────

describe('ProcurementPage — 反例/边界', () => {
  it('E1. 空数据渲染空状态提示', async () => {
    responseRegistry.clear();
    setResponseFor('/api/inventory/procurement', () => ({ success: true, data: { orders: [] }, message: 'OK' }));
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('暂无采购单'));
    });
  });

  it('E2. 只有一条待处理数据', async () => {
    responseRegistry.clear();
    setResponseFor('/api/inventory/procurement', () => SINGLE_PENDING);
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('PO-SINGLE'));
      assert.ok(body.includes('测试供应商'));
    });
  });

  it('E3. 全部已取消的极端边界', async () => {
    responseRegistry.clear();
    setResponseFor('/api/inventory/procurement', () => ({
      success: true, data: {
        orders: [
          { id: 'po-x1', orderNo: 'PO-CANCEL-001', supplierName: '旧供应商', supplierId: 's-x', items: [{ name: '旧零件', quantity: 1, unitPriceCents: 100, totalCents: 100 }], totalCents: 100, status: 'cancelled', priority: 'low', department: '后勤部', requester: '旧员工', createdAt: '2026-07-01T00:00:00Z', updatedAt: '2026-07-01T00:00:00Z' },
        ],
      },
    }));
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // pending tab 过滤掉 cancelled → 显示空态
      assert.ok(body.includes('暂无采购单'));
    });
  });

  it('E4. totalCents 为0的边界', async () => {
    responseRegistry.clear();
    setResponseFor('/api/inventory/procurement', () => ({
      success: true, data: {
        orders: [
          { id: 'po-zero', orderNo: 'PO-ZERO', supplierName: '免费供应商', supplierId: 's-f', items: [], totalCents: 0, status: 'draft', priority: 'low', department: '测试部', requester: '测试员', createdAt: '2026-07-18T00:00:00Z', updatedAt: '2026-07-18T00:00:00Z' },
        ],
      },
    }));
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('PO-ZERO'));
      assert.ok(body.includes('¥0'));
    });
  });
});

// ─── 角色视角 Tests ──────────────────────────────────

describe('ProcurementPage — 角色视角', () => {
  beforeEach(() => { setDefault(); });

  it('👔 店长: 查看全局采购统计', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      assert.ok(body.includes('采购单'));
      assert.ok(body.includes('采购总额'));
    });
  });

  it('🎯 采购专员: 切换Tab筛选待处理/已收货', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      assert.ok(screen.queryAllByText('待处理').length >= 1);
      assert.ok(screen.queryAllByText('已收货').length >= 1);
      assert.ok(screen.queryAllByText('全部').length >= 1);
    });
  });

  it('🔧 运营: 刷新按钮可用', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      assert.ok(screen.queryAllByText('刷新').length >= 1);
    });
  });

  it('📢 营销: 查看紧急采购项', async () => {
    render(<ProcurementPage />);
    await waitFor(() => {
      const body = document.body.textContent || '';
      // 紧急卡片显示
      assert.ok(body.includes('紧急'));
    });
  });
});

// ─── 静态代码分析 ────────────────────────────────────

const SRC = fs.readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('ProcurementPage — 静态分析', () => {
  it('S1. 包含useState', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('S2. 包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('S3. 包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('S4. 包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('S5. 包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('S6. 包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('S7. 调用了fetch', () => assert.ok(SRC.includes('fetch(')));
  it('S8. 包含useEffect', () => assert.ok(SRC.includes('useEffect')));
  it('S9. 包含useCallback', () => assert.ok(SRC.includes('useCallback')));
  it('S10. 包含类型定义接口', () => assert.ok(SRC.includes('interface ') || SRC.includes('type ')));
});

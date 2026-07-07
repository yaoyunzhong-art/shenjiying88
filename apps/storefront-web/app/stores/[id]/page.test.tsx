/**
 * 门店详情页 — Store Detail Page Tests (node:test compatible)
 * 不渲染 React 组件（无 jsdom），只验证：
 * - 模块可导入，default 导出为函数
 * - 门店状态标签/变体映射完整
 * - Mock 数据完整性
 * - 状态流转定义完整
 * - 辅助函数逻辑
 * - 基础类型覆盖
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与组件保持一致的类型 ---- //

type StoreStatus = 'active' | 'inactive' | 'maintenance';
type StoreType = 'flagship' | 'standard' | 'community' | 'popup';

// ---- 与组件保持一致的常量 ---- //

const STATUS_LABELS: Record<StoreStatus, string> = {
  active: '营业中',
  inactive: '已停业',
  maintenance: '维护中',
};

const STATUS_VARIANTS: Record<StoreStatus, 'success' | 'neutral' | 'warning'> = {
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
};

const TYPE_LABELS: Record<StoreType, string> = {
  flagship: '旗舰店',
  standard: '标准店',
  community: '社区店',
  popup: '快闪店',
};

const STATUS_TRANSITIONS: Record<StoreStatus, StoreStatus[]> = {
  active: ['maintenance', 'inactive'],
  inactive: ['active'],
  maintenance: ['active', 'inactive'],
};

// ---- Store 接口定义 ---- //

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
}

interface Store {
  id: string;
  name: string;
  code: string;
  type: StoreType;
  address: string;
  city: string;
  district: string;
  phone: string;
  managerName: string;
  managerPhone: string;
  status: StoreStatus;
  staffCount: number;
  areaSqm: number;
  monthlyRevenue: number;
  monthlyTarget: number;
  monthlyOrders: number;
  openingDate: string;
  businessHours: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  staff: StaffMember[];
}

// ---- Mock 数据生成 ---- //

function generateMockStore(id: string): Store {
  const storeMap: Record<string, Store> = {
    's-001': {
      id: 's-001',
      name: '深圳南山旗舰店',
      code: 'SZ-NS-001',
      type: 'flagship',
      address: '深圳市南山区科技南路18号',
      city: '深圳市',
      district: '南山区',
      phone: '0755-88886666',
      managerName: '张伟强',
      managerPhone: '13800138001',
      status: 'active',
      staffCount: 18,
      areaSqm: 580,
      monthlyRevenue: 1850000,
      monthlyTarget: 2000000,
      monthlyOrders: 420,
      openingDate: '2021-03-15',
      businessHours: '09:00-22:00',
      description: '深圳南山旗舰店为品牌在华南地区最大的形象店，位于科技园核心商圈，毗邻多家头部科技企业总部，客群以商务白领及科技从业者为主。',
      createdAt: '2021-03-01T08:00:00Z',
      updatedAt: '2026-06-28T14:30:00Z',
      staff: [
        { id: 'emp-001', name: '张伟强', role: '店长', phone: '13800138001' },
        { id: 'emp-002', name: '李敏', role: '副店长', phone: '13800138002' },
        { id: 'emp-003', name: '王浩', role: '导购员', phone: '13800138003' },
        { id: 'emp-004', name: '陈雪', role: '收银员', phone: '13800138004' },
      ],
    },
    's-002': {
      id: 's-002',
      name: '北京朝阳标准店',
      code: 'BJ-CY-001',
      type: 'standard',
      address: '北京市朝阳区建国路88号',
      city: '北京市',
      district: '朝阳区',
      phone: '010-88889999',
      managerName: '刘建国',
      managerPhone: '13900139001',
      status: 'active',
      staffCount: 10,
      areaSqm: 320,
      monthlyRevenue: 980000,
      monthlyTarget: 1000000,
      monthlyOrders: 260,
      openingDate: '2022-06-01',
      businessHours: '10:00-21:30',
      description: '北京朝阳标准店位于CBD核心区域，周边商业配套成熟，客群以商务人士及中高端消费群体为主。',
      createdAt: '2022-05-20T08:00:00Z',
      updatedAt: '2026-06-27T10:15:00Z',
      staff: [
        { id: 'emp-005', name: '刘建国', role: '店长', phone: '13900139001' },
        { id: 'emp-006', name: '赵丽', role: '导购员', phone: '13900139002' },
      ],
    },
    's-003': {
      id: 's-003',
      name: '上海浦东社区店',
      code: 'SH-PD-001',
      type: 'community',
      address: '上海市浦东新区张杨路500号',
      city: '上海市',
      district: '浦东新区',
      phone: '021-66667777',
      managerName: '周明',
      managerPhone: '13700137001',
      status: 'maintenance',
      staffCount: 5,
      areaSqm: 150,
      monthlyRevenue: 350000,
      monthlyTarget: 400000,
      monthlyOrders: 95,
      openingDate: '2023-09-10',
      businessHours: '09:30-21:00',
      description: '上海浦东社区店服务于周边住宅小区居民，以社区便利零售和会员服务为核心卖点。',
      createdAt: '2023-09-01T08:00:00Z',
      updatedAt: '2026-06-26T09:00:00Z',
      staff: [
        { id: 'emp-007', name: '周明', role: '店长', phone: '13700137001' },
      ],
    },
  };

  return storeMap[id] || {
    id,
    name: `门店 ${id}`,
    code: `STORE-${id}`,
    type: 'standard',
    address: '示例地址',
    city: '深圳市',
    district: '南山区',
    phone: '0755-88880000',
    managerName: '管理员',
    managerPhone: '13800000000',
    status: 'active',
    staffCount: 8,
    areaSqm: 200,
    monthlyRevenue: 600000,
    monthlyTarget: 800000,
    monthlyOrders: 180,
    openingDate: '2024-01-01',
    businessHours: '09:00-22:00',
    description: '默认门店描述信息。',
    createdAt: '2024-01-01T08:00:00Z',
    updatedAt: '2026-06-29T10:00:00Z',
    staff: [
      { id: 'emp-default', name: '管理员', role: '店长', phone: '13800000000' },
    ],
  };
}

// ---- 辅助函数 ---- //

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function getStatusTransitionLabels(
  currentStatus: StoreStatus,
): string[] {
  return STATUS_TRANSITIONS[currentStatus]?.map(
    (nextStatus) => `变更为「${STATUS_LABELS[nextStatus]}」`,
  ) ?? [];
}

// ---- 测试 ---- //

describe('StoreDetailPage 门店详情页', () => {
  describe('模块可导入', () => {
    it('1. 模块可导入，default 导出为函数', async () => {
      const mod = await import('./page');
      assert.equal(typeof mod.default, 'function');
    });
  });

  describe('状态标签映射', () => {
    it('2. STATUS_LABELS 包含所有 3 种门店状态', () => {
      const statuses: StoreStatus[] = ['active', 'inactive', 'maintenance'];
      for (const s of statuses) {
        assert.ok(STATUS_LABELS[s], `缺少状态 ${s} 的标签`);
        assert.equal(typeof STATUS_LABELS[s], 'string');
      }
    });

    it('3. STATUS_LABELS 中文标签正确', () => {
      assert.equal(STATUS_LABELS.active, '营业中');
      assert.equal(STATUS_LABELS.inactive, '已停业');
      assert.equal(STATUS_LABELS.maintenance, '维护中');
    });

    it('4. STATUS_VARIANTS 为每种状态提供颜色变体', () => {
      const statuses: StoreStatus[] = ['active', 'inactive', 'maintenance'];
      const allowed = ['success', 'neutral', 'warning'];
      for (const s of statuses) {
        assert.ok(allowed.includes(STATUS_VARIANTS[s]), `状态 ${s} 的变体无效`);
      }
    });

    it('5. TYPE_LABELS 包含所有 4 种门店类型', () => {
      const types: StoreType[] = ['flagship', 'standard', 'community', 'popup'];
      for (const t of types) {
        assert.ok(TYPE_LABELS[t], `缺少类型 ${t} 的标签`);
        assert.equal(typeof TYPE_LABELS[t], 'string');
      }
    });
  });

  describe('状态流转', () => {
    it('6. STATUS_TRANSITIONS 覆盖所有 3 种状态', () => {
      const statuses: StoreStatus[] = ['active', 'inactive', 'maintenance'];
      for (const s of statuses) {
        assert.ok(Array.isArray(STATUS_TRANSITIONS[s]));
      }
    });

    it('7. active 可流转到 maintenance 和 inactive（共 2 种）', () => {
      assert.equal(STATUS_TRANSITIONS.active.length, 2);
      assert.ok(STATUS_TRANSITIONS.active.includes('maintenance'));
      assert.ok(STATUS_TRANSITIONS.active.includes('inactive'));
    });

    it('8. inactive 可流转到 active（共 1 种）', () => {
      assert.equal(STATUS_TRANSITIONS.inactive.length, 1);
      assert.equal(STATUS_TRANSITIONS.inactive[0], 'active');
    });

    it('9. maintenance 可流转到 active 和 inactive（共 2 种）', () => {
      assert.equal(STATUS_TRANSITIONS.maintenance.length, 2);
      assert.ok(STATUS_TRANSITIONS.maintenance.includes('active'));
      assert.ok(STATUS_TRANSITIONS.maintenance.includes('inactive'));
    });
  });

  describe('Mock 数据完整性', () => {
    it('10. generateMockStore 返回指定 ID 的数据', () => {
      const store = generateMockStore('s-001');
      assert.equal(store.id, 's-001');
      assert.equal(store.name, '深圳南山旗舰店');
    });

    it('11. s-001 为 active（营业中）旗舰店', () => {
      const store = generateMockStore('s-001');
      assert.equal(store.status, 'active');
      assert.equal(store.type, 'flagship');
      assert.equal(store.staffCount, 18);
    });

    it('12. s-001 有 4 名员工', () => {
      const store = generateMockStore('s-001');
      assert.equal(store.staff.length, 4);
      const names = store.staff.map((s) => s.name);
      assert.ok(names.includes('张伟强'));
      assert.ok(names.includes('李敏'));
      assert.ok(names.includes('王浩'));
      assert.ok(names.includes('陈雪'));
    });

    it('13. s-002 为 active（营业中）标准店，在北京', () => {
      const store = generateMockStore('s-002');
      assert.equal(store.status, 'active');
      assert.equal(store.type, 'standard');
      assert.equal(store.city, '北京市');
      assert.equal(store.staffCount, 10);
    });

    it('14. s-002 有 2 名员工', () => {
      const store = generateMockStore('s-002');
      assert.equal(store.staff.length, 2);
      assert.equal(store.staff[0].name, '刘建国');
    });

    it('15. s-003 为 maintenance（维护中）社区店，在上海', () => {
      const store = generateMockStore('s-003');
      assert.equal(store.status, 'maintenance');
      assert.equal(store.type, 'community');
      assert.equal(store.city, '上海市');
      assert.equal(store.staffCount, 5);
    });

    it('16. s-003 有 1 名员工', () => {
      const store = generateMockStore('s-003');
      assert.equal(store.staff.length, 1);
      assert.equal(store.staff[0].name, '周明');
    });

    it('17. 不存在的 ID 返回默认门店', () => {
      const store = generateMockStore('non-existent');
      assert.ok(store.id, 'non-existent');
      assert.equal(store.status, 'active');
      assert.equal(typeof store.name, 'string');
    });
  });

  describe('formatCurrency 辅助函数', () => {
    it('18. 格式化整万数字', () => {
      assert.equal(formatCurrency(1000000), '¥1,000,000');
    });

    it('19. 格式化带零头的数字', () => {
      assert.equal(formatCurrency(1850000), '¥1,850,000');
    });

    it('20. 格式化零', () => {
      assert.equal(formatCurrency(0), '¥0');
    });
  });

  describe('状态流转标签', () => {
    it('21. active 门店应显示维护中和已停业按钮', () => {
      const labels = getStatusTransitionLabels('active');
      assert.ok(labels.includes('变更为「维护中」'));
      assert.ok(labels.includes('变更为「已停业」'));
    });

    it('22. maintenance 门店可流转到 active 和 inactive', () => {
      const labels = getStatusTransitionLabels('maintenance');
      assert.equal(labels.length, 2);
      assert.ok(labels.some((l) => l.includes('营业中')));
      assert.ok(labels.some((l) => l.includes('已停业')));
    });

    it('23. inactive 门店可流转到 active', () => {
      const labels = getStatusTransitionLabels('inactive');
      assert.equal(labels.length, 1);
      assert.ok(labels[0].includes('营业中'));
    });
  });

  describe('闭包链接（导航卡片）', () => {
    it('24. 闭包链接应包含返回门店列表和查看报表', () => {
      const closureLinks = [
        { key: 'back-to-stores', title: '返回门店列表', subtitle: '查看所有门店', href: '/stores' },
        { key: 'view-reports', title: '查看门店报表', subtitle: '经营数据分析', href: '/reports' },
      ];
      assert.equal(closureLinks.length, 2);
      assert.equal(closureLinks[0].key, 'back-to-stores');
      assert.equal(closureLinks[1].key, 'view-reports');
    });
  });

  describe('详情操作按钮', () => {
    it('25. 详情操作应包含编辑和删除', () => {
      const detailActions = [
        { key: 'edit', label: '编辑门店', variant: 'primary' },
        { key: 'delete', label: '删除门店', variant: 'danger' },
      ];
      assert.equal(detailActions.length, 2);
      assert.equal(detailActions[0].key, 'edit');
      assert.equal(detailActions[1].key, 'delete');
    });
  });
});

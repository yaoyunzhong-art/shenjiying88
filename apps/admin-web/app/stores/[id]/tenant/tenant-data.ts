export type TenantStatus = 'active' | 'trial' | 'pending' | 'migration';

export interface StoreTenantRecord {
  id: string;
  name: string;
  brand: string;
  plan: '免费版' | '专业版' | '企业版';
  users: number;
  stores: number;
  status: TenantStatus;
  createdAt: string;
  region: string;
  monthlyRevenue: number;
  isolationScore: number;
  migrationStage: string;
}

export interface TenantMigrationTask {
  id: string;
  tenantId: string;
  title: string;
  owner: string;
  eta: string;
  stage: '准备中' | '执行中' | '验证中';
}

export interface TenantSnapshotDelivery {
  deliveryMode: 'api' | 'fallback';
  sourceLabel: 'store-tenant-api' | 'store-tenant-fallback';
  storeId: string;
  tenantId: string;
  tenants: StoreTenantRecord[];
  planOptions: Array<StoreTenantRecord['plan']>;
  metrics: {
    total: number;
    active: number;
    trial: number;
    pending: number;
    monthlyRevenue: number;
    storeCount: number;
  };
  migrationQueue: TenantMigrationTask[];
  generatedAt: string;
  controlPlaneSource: string;
  businessDataSource: string;
  refreshPath: string;
  note: string;
  error?: string;
}

const TENANTS: StoreTenantRecord[] = [
  {
    id: 'tenant-dwy',
    name: '旗舰店租户',
    brand: '大玩家',
    plan: '企业版',
    users: 25,
    stores: 3,
    status: 'active',
    createdAt: '2026-01-01',
    region: '华南',
    monthlyRevenue: 520000,
    isolationScore: 98,
    migrationStage: '稳定运行',
  },
  {
    id: 'tenant-xj',
    name: '星际传奇租户',
    brand: '星际传奇',
    plan: '专业版',
    users: 14,
    stores: 2,
    status: 'active',
    createdAt: '2026-02-18',
    region: '华东',
    monthlyRevenue: 286000,
    isolationScore: 94,
    migrationStage: '配置巡检',
  },
  {
    id: 'tenant-trial',
    name: '测试租户',
    brand: '试运营品牌',
    plan: '免费版',
    users: 3,
    stores: 1,
    status: 'trial',
    createdAt: '2026-07-01',
    region: '华北',
    monthlyRevenue: 0,
    isolationScore: 80,
    migrationStage: '试用观测',
  },
  {
    id: 'tenant-ready',
    name: '龙湖店租户',
    brand: '欢乐英雄',
    plan: '专业版',
    users: 9,
    stores: 1,
    status: 'pending',
    createdAt: '2026-07-10',
    region: '西南',
    monthlyRevenue: 0,
    isolationScore: 76,
    migrationStage: '等待激活',
  },
  {
    id: 'tenant-migrate',
    name: '并店迁移租户',
    brand: '潮玩工厂',
    plan: '企业版',
    users: 18,
    stores: 4,
    status: 'migration',
    createdAt: '2026-05-06',
    region: '华中',
    monthlyRevenue: 368000,
    isolationScore: 89,
    migrationStage: '数据迁移中',
  },
];

const MIGRATION_QUEUE: TenantMigrationTask[] = [
  {
    id: 'mig-001',
    tenantId: 'tenant-migrate',
    title: '支付配置切换',
    owner: '李运维',
    eta: '2026-07-28 10:00',
    stage: '执行中',
  },
  {
    id: 'mig-002',
    tenantId: 'tenant-ready',
    title: '品牌菜单导入',
    owner: '陈实施',
    eta: '2026-07-28 14:00',
    stage: '准备中',
  },
  {
    id: 'mig-003',
    tenantId: 'tenant-xj',
    title: '隔离校验复核',
    owner: '周架构',
    eta: '2026-07-29 09:30',
    stage: '验证中',
  },
];

function buildMetrics(tenants: StoreTenantRecord[]) {
  return {
    total: tenants.length,
    active: tenants.filter((tenant) => tenant.status === 'active').length,
    trial: tenants.filter((tenant) => tenant.status === 'trial').length,
    pending: tenants.filter((tenant) => tenant.status === 'pending' || tenant.status === 'migration').length,
    monthlyRevenue: tenants.reduce((sum, tenant) => sum + tenant.monthlyRevenue, 0),
    storeCount: tenants.reduce((sum, tenant) => sum + tenant.stores, 0),
  };
}

export async function loadTenantSnapshot(
  storeId: string,
  tenantId = 'tenant-dwy',
): Promise<TenantSnapshotDelivery> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-tenant-fallback',
    storeId,
    tenantId,
    tenants: TENANTS,
    planOptions: ['免费版', '专业版', '企业版'],
    metrics: buildMetrics(TENANTS),
    migrationQueue: MIGRATION_QUEUE,
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadTenantSnapshot fallback -> store tenant samples',
    businessDataSource: 'local tenant roster + migration queue snapshot',
    refreshPath: 'TenantPage -> loadTenantSnapshot',
    note: '当前门店租户页已完成三层拆分，待后续接入真实多租户控制面接口。',
  };
}

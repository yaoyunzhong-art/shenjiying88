/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链11
 * Tob-Web(企业端) → SDK(基础设施) → API(业务端点) → Domain(企业数据层) → Admin(云管控)
 *
 * 模拟链路（企业端→SDK→API→Domain→Admin 企业租户全链路）:
 *   tob-web 企业管理员创建门店/员工 → SDK 基础设施调用（存储/队列/权限）
 *   → API 企业业务端点接收 → Domain 层企业数据模型校验（门店配额/员工上限/权限边界）
 *   → Admin 云管控端可见所有企业数据（多租户汇总视图）
 *
 * 验证:
 *   - 企业管理员在 tob-web 创建门店 → SDK 发送事件 → API 创建租户门店记录
 *   - Domain 校验门店配额和员工上限 → Admin 云管控汇总视图更新
 *   - 反例: 门店数量超过配额被 Domain 拒绝
 *   - 反例: 跨租户访问隔离
 *   - 边界: 门店名称超长/特殊字符
 *   - 边界: 员工邮箱格式校验
 *   - 边界: 冻结合约后禁止操作
 *
 * 这是第二条「企业端发起」的跨模块链路
 * 填补 tob-web → (sdk/api/domain/admin) 方向覆盖空白
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type TobEnterpriseSource = 'tob-web' | 'admin-web' | 'api';

interface TobStoreCreateRequest {
  source: TobEnterpriseSource;
  appVersion: string;
  tenantId: string;
  operatorId: string;
  storeName: string;
  storeCode: string;
  province: string;
  city: string;
  district: string;
  address: string;
  contactPhone: string;
  businessHours: string;
  area: number;       // 平方米
  employeeCount: number;
  features: string[]; // 门店功能特性
}

interface TobEmployeeCreateRequest {
  source: TobEnterpriseSource;
  tenantId: string;
  operatorId: string;
  storeId: string;
  name: string;
  email: string;
  phone: string;
  role: 'store_admin' | 'cashier' | 'barista' | 'delivery';
  hourlyRate: number;
}

interface SdkQueueMessage {
  messageId: string;
  source: string;
  eventType: 'store.created' | 'store.updated' | 'employee.created' | 'employee.updated';
  payload: Record<string, unknown>;
  timestamp: string;
  tenantId: string;
}

interface ApiCreateStoreResponse {
  success: boolean;
  storeId?: string;
  error?: string;
  sdkMessageId?: string;
}

interface ApiCreateEmployeeResponse {
  success: boolean;
  employeeId?: string;
  error?: string;
}

interface DomainTenantQuota {
  tenantId: string;
  maxStores: number;
  maxEmployeesPerStore: number;
  maxFeaturesPerStore: number;
  contractStatus: 'active' | 'suspended' | 'cancelled';
  contractStartDate: string;
  contractEndDate: string;
}

interface DomainStore {
  storeId: string;
  tenantId: string;
  storeName: string;
  storeCode: string;
  province: string;
  city: string;
  address: string;
  contactPhone: string;
  features: string[];
  employeeCount: number;
  isActive: boolean;
  createdAt: string;
}

interface DomainEmployee {
  employeeId: string;
  tenantId: string;
  storeId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminEnterpriseDashboard {
  totalTenants: number;
  totalStores: number;
  totalEmployees: number;
  tenants: AdminTenantSummary[];
}

interface AdminTenantSummary {
  tenantId: string;
  tenantName: string;
  contractStatus: string;
  storeCount: number;
  employeeCount: number;
  stores: DomainStore[];
  activeSince: string;
}

// ─── 仓储 ───

const TENANT_QUOTA_STORE = new Map<string, DomainTenantQuota>();
const STORE_STORE = new Map<string, DomainStore>();
const STORE_CODE_INDEX = new Map<string, string>();  // tenantId:storeCode → storeId
const EMPLOYEE_STORE = new Map<string, DomainEmployee>();
const SDK_MESSAGE_LOG: SdkQueueMessage[] = [];

// ─── 预设租户配额 ───

function seedTenants(): void {
  const tenants: DomainTenantQuota[] = [
    { tenantId: 't1', maxStores: 5, maxEmployeesPerStore: 20, maxFeaturesPerStore: 10, contractStatus: 'active', contractStartDate: '2025-01-01', contractEndDate: '2027-12-31' },
    { tenantId: 't2', maxStores: 3, maxEmployeesPerStore: 10, maxFeaturesPerStore: 5, contractStatus: 'active', contractStartDate: '2025-06-01', contractEndDate: '2026-12-31' },
    { tenantId: 't3', maxStores: 1, maxEmployeesPerStore: 5, maxFeaturesPerStore: 3, contractStatus: 'suspended', contractStartDate: '2025-03-01', contractEndDate: '2026-03-01' },
    { tenantId: 't4', maxStores: 10, maxEmployeesPerStore: 50, maxFeaturesPerStore: 20, contractStatus: 'active', contractStartDate: '2024-01-01', contractEndDate: '2028-12-31' },
  ];
  tenants.forEach(t => TENANT_QUOTA_STORE.set(t.tenantId, t));
}

seedTenants();

function getTenantName(tenantId: string): string {
  const names: Record<string, string> = { t1: '旗舰店集团', t2: '连锁超市', t3: '美食广场', t4: '华东大区' };
  return names[tenantId] || tenantId;
}

// ─── SDK 层：基础设施事件 ───

function sdkPublishEvent(eventType: SdkQueueMessage['eventType'], payload: Record<string, unknown>, tenantId: string): string {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const message: SdkQueueMessage = {
    messageId,
    source: 'tob-web',
    eventType,
    payload,
    timestamp: new Date().toISOString(),
    tenantId,
  };
  SDK_MESSAGE_LOG.push(message);
  return messageId;
}

function sdkGetMessageLog(tenantId?: string): SdkQueueMessage[] {
  if (tenantId) return SDK_MESSAGE_LOG.filter(m => m.tenantId === tenantId);
  return [...SDK_MESSAGE_LOG];
}

// ─── Domain 层：企业配额校验 ───

function domainCheckContractActive(tenantId: string): { ok: boolean; error?: string } {
  const quota = TENANT_QUOTA_STORE.get(tenantId);
  if (!quota) return { ok: false, error: '租户不存在' };
  if (quota.contractStatus === 'suspended') return { ok: false, error: '合约已冻结，无法创建新门店' };
  if (quota.contractStatus === 'cancelled') return { ok: false, error: '合约已取消' };
  return { ok: true };
}

function domainValidateStoreCreate(req: TobStoreCreateRequest): { valid: boolean; error?: string; storeId?: string } {
  // 合约状态
  const contract = domainCheckContractActive(req.tenantId);
  if (!contract.ok) return { valid: false, error: contract.error };

  const quota = TENANT_QUOTA_STORE.get(req.tenantId)!;

  // 门店配额
  const existingStores = Array.from(STORE_STORE.values()).filter(s => s.tenantId === req.tenantId && s.isActive);
  if (existingStores.length >= quota.maxStores) {
    return { valid: false, error: `门店数量已达上限 ${quota.maxStores}` };
  }

  // 门店编码唯一性
  const codeKey = `${req.tenantId}:${req.storeCode}`;
  if (STORE_CODE_INDEX.has(codeKey)) {
    return { valid: false, error: `门店编码 ${req.storeCode} 已存在` };
  }

  // 门店名称校验
  if (!req.storeName || req.storeName.length < 1 || req.storeName.length > 50) {
    return { valid: false, error: '门店名称长度需在1-50个字符之间' };
  }

  // 门店特性数量
  if (req.features.length > quota.maxFeaturesPerStore) {
    return { valid: false, error: `门店特性数量不能超过 ${quota.maxFeaturesPerStore}` };
  }

  // 手机号格式
  if (!req.contactPhone || !/^1[3-9]\d{9}$/.test(req.contactPhone)) {
    return { valid: false, error: '联系电话格式无效' };
  }

  // 面积限制
  if (req.area < 5 || req.area > 10000) {
    return { valid: false, error: '门店面积需在5-10000平方米之间' };
  }

  const storeId = `store-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return { valid: true, storeId };
}

function domainValidateEmployeeCreate(req: TobEmployeeCreateRequest): { valid: boolean; error?: string; employeeId?: string } {
  const contract = domainCheckContractActive(req.tenantId);
  if (!contract.ok) return { valid: false, error: contract.error };

  const store = STORE_STORE.get(req.storeId);
  if (!store || !store.isActive) return { valid: false, error: '门店不存在或已停用' };
  if (store.tenantId !== req.tenantId) return { valid: false, error: '门店不属于该租户' };

  const quota = TENANT_QUOTA_STORE.get(req.tenantId)!;
  const storeEmployees = Array.from(EMPLOYEE_STORE.values()).filter(e => e.storeId === req.storeId && e.isActive);
  if (storeEmployees.length >= quota.maxEmployeesPerStore) {
    return { valid: false, error: `该门店员工数量已达上限 ${quota.maxEmployeesPerStore}` };
  }

  if (!req.name || req.name.length < 1 || req.name.length > 30) {
    return { valid: false, error: '员工姓名长度需在1-30个字符之间' };
  }

  if (!req.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.email)) {
    return { valid: false, error: '邮箱格式无效' };
  }

  if (!req.phone || !/^1[3-9]\d{9}$/.test(req.phone)) {
    return { valid: false, error: '手机号格式无效' };
  }

  const validRoles = ['store_admin', 'cashier', 'barista', 'delivery'];
  if (!validRoles.includes(req.role)) {
    return { valid: false, error: `无效的员工角色: ${req.role}` };
  }

  if (req.hourlyRate <= 0 || req.hourlyRate > 500) {
    return { valid: false, error: '时薪需在0-500之间' };
  }

  const employeeId = `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  return { valid: true, employeeId };
}

// ─── API 层：门店/员工创建 ───

function apiCreateStore(req: TobStoreCreateRequest): ApiCreateStoreResponse {
  if (req.source !== 'tob-web') {
    return { success: false, error: '仅允许 tob-web 发起门店创建' };
  }

  const validation = domainValidateStoreCreate(req);
  if (!validation.valid) return { success: false, error: validation.error };

  const store: DomainStore = {
    storeId: validation.storeId!,
    tenantId: req.tenantId,
    storeName: req.storeName,
    storeCode: req.storeCode,
    province: req.province,
    city: req.city,
    address: req.address,
    contactPhone: req.contactPhone,
    features: req.features,
    employeeCount: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  STORE_STORE.set(store.storeId, store);
  STORE_CODE_INDEX.set(`${req.tenantId}:${req.storeCode}`, store.storeId);

  // SDK 事件通知
  const msgId = sdkPublishEvent('store.created', {
    storeId: store.storeId, storeName: store.storeName, tenantId: store.tenantId,
  }, req.tenantId);

  return { success: true, storeId: store.storeId, sdkMessageId: msgId };
}

function apiCreateEmployee(req: TobEmployeeCreateRequest): ApiCreateEmployeeResponse {
  const validation = domainValidateEmployeeCreate(req);
  if (!validation.valid) return { success: false, error: validation.error };

  const employee: DomainEmployee = {
    employeeId: validation.employeeId!,
    tenantId: req.tenantId,
    storeId: req.storeId,
    name: req.name,
    email: req.email,
    phone: req.phone,
    role: req.role,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  EMPLOYEE_STORE.set(employee.employeeId, employee);

  // 更新门店员工计数
  const store = STORE_STORE.get(req.storeId);
  if (store) {
    store.employeeCount = Array.from(EMPLOYEE_STORE.values()).filter(e => e.storeId === req.storeId && e.isActive).length;
  }

  // SDK 事件
  sdkPublishEvent('employee.created', {
    employeeId: employee.employeeId, name: employee.name, storeId: employee.storeId, role: employee.role,
  }, req.tenantId);

  return { success: true, employeeId: employee.employeeId };
}

// ─── Admin 层：云管控仪表盘 ───

function adminGetEnterpriseDashboard(): AdminEnterpriseDashboard {
  const tenantIds = Array.from(TENANT_QUOTA_STORE.keys());
  const tenants: AdminTenantSummary[] = tenantIds.map(tId => {
    const quota = TENANT_QUOTA_STORE.get(tId)!;
    const stores = Array.from(STORE_STORE.values()).filter(s => s.tenantId === tId && s.isActive);
    const employees = Array.from(EMPLOYEE_STORE.values()).filter(e => e.tenantId === tId && e.isActive);
    return {
      tenantId: tId,
      tenantName: getTenantName(tId),
      contractStatus: quota.contractStatus,
      storeCount: stores.length,
      employeeCount: employees.length,
      stores,
      activeSince: quota.contractStartDate,
    };
  });

  return {
    totalTenants: tenants.length,
    totalStores: tenants.reduce((s, t) => s + t.storeCount, 0),
    totalEmployees: tenants.reduce((s, t) => s + t.employeeCount, 0),
    tenants,
  };
}

function adminGetTenantDetail(tenantId: string): AdminTenantSummary | null {
  const dashboard = adminGetEnterpriseDashboard();
  return dashboard.tenants.find(t => t.tenantId === tenantId) || null;
}

function adminGetSdkEventLog(tenantId?: string): SdkQueueMessage[] {
  return sdkGetMessageLog(tenantId);
}

// ─── 测试 ───

describe('[L3-E2E] 链11: Tob-Web企业端→SDK基础设施→API→Domain企业数据→Admin云管控', () => {

  test('【正例】Tob-Web 创建门店 → SDK 事件 → Admin 汇总视图可见', () => {
    const req: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't1', operatorId: 'admin-t1',
      storeName: '旗舰店·南山科技园店',
      storeCode: 'S-NANSHAN-001',
      province: '广东省', city: '深圳市', district: '南山区',
      address: '科技南路18号',
      contactPhone: '13800139001',
      businessHours: '08:00-22:00',
      area: 120,
      employeeCount: 0,
      features: ['dine-in', 'takeaway', 'delivery'],
    };

    // Tob-Web → API 创建
    const resp = apiCreateStore(req);
    assert.ok(resp.success);
    assert.ok(resp.storeId);
    assert.ok(resp.sdkMessageId);

    // SDK 事件日志
    const events = sdkGetMessageLog('t1');
    assert.ok(events.length >= 1);
    assert.ok(events.some(e => e.eventType === 'store.created'));

    // Admin 云管控汇总
    const dash = adminGetEnterpriseDashboard();
    assert.ok(dash.totalTenants >= 1);
    const t1Info = adminGetTenantDetail('t1');
    assert.ok(t1Info);
    assert.ok(t1Info.stores.some(s => s.storeName === '旗舰店·南山科技园店'));
  });

  test('【正例】Tob-Web 创建门店 → 创建员工 → Admin 汇总准确', () => {
    // 创建门店
    const storeReq: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't1', operatorId: 'admin-t1',
      storeName: '旗舰店·福田CBD店',
      storeCode: 'S-FUTIAN-001',
      province: '广东省', city: '深圳市', district: '福田区',
      address: '福华路88号',
      contactPhone: '13800139002',
      businessHours: '07:00-23:00',
      area: 200,
      employeeCount: 0,
      features: ['dine-in', 'takeaway', 'delivery', 'reservation'],
    };
    const storeResp = apiCreateStore(storeReq);
    assert.ok(storeResp.success);

    // 创建员工
    const empReq: TobEmployeeCreateRequest = {
      source: 'tob-web',
      tenantId: 't1',
      operatorId: 'admin-t1',
      storeId: storeResp.storeId!,
      name: '张三',
      email: 'zhangsan@example.com',
      phone: '13900139001',
      role: 'store_admin',
      hourlyRate: 35,
    };
    const empResp = apiCreateEmployee(empReq);
    assert.ok(empResp.success);
    assert.ok(empResp.employeeId);

    // Admin 核验
    const t1Detail = adminGetTenantDetail('t1');
    assert.ok(t1Detail);
    const futianStore = t1Detail.stores.find(s => s.storeCode === 'S-FUTIAN-001');
    assert.ok(futianStore);
    assert.equal(futianStore.employeeCount, 1);
  });

  test('【反例】门店超过配额被 Domain 拒绝', () => {
    const t2Quota = TENANT_QUOTA_STORE.get('t2')!;
    assert.equal(t2Quota.maxStores, 3);

    // 先清理 t2 已存在的门店（如果有被之前测试创建）
    const existingT2Stores = Array.from(STORE_STORE.values()).filter(s => s.tenantId === 't2');
    const needCount = 3 - existingT2Stores.length;

    // 创建到配额上限
    for (let i = 0; i < needCount; i++) {
      const suffix = `${Date.now()}-${i}`;
      const req: TobStoreCreateRequest = {
        source: 'tob-web', appVersion: '2.5.0',
        tenantId: 't2', operatorId: 'admin-t2',
        storeName: `配额测试门店${i + 1}`,
        storeCode: `T2-QUOTA-${suffix}`,
        province: '广东省', city: '广州市', district: '天河区',
        address: `天河路测试${i + 1}号`,
        contactPhone: `13800139${String(400 + i)}`,
        businessHours: '09:00-21:00',
        area: 80 + i * 10,
        employeeCount: 0,
        features: ['dine-in'],
      };
      const resp = apiCreateStore(req);
      assert.ok(resp.success, `门店${i + 1}创建应该成功`);
    }

    // 再次确认已经达到上限
    const currentT2Stores = Array.from(STORE_STORE.values()).filter(s => s.tenantId === 't2' && s.isActive);
    assert.equal(currentT2Stores.length, 3, `Expected 3 t2 stores but got ${currentT2Stores.length}`);

    // 第4个门店应该被拒绝
    const overReq: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't2', operatorId: 'admin-t2',
      storeName: '超额门店',
      storeCode: `T2-QUOTA-OVER-${Date.now()}`,
      province: '广东省', city: '广州市', district: '越秀区',
      address: '北京路1号',
      contactPhone: '13800139100',
      businessHours: '09:00-21:00',
      area: 100,
      employeeCount: 0,
      features: ['dine-in'],
    };
    const overResp = apiCreateStore(overReq);
    assert.equal(overResp.success, false);
    assert.ok(overResp.error?.includes('上限'));
  });

  test('【反例】冻结合约租户无法创建门店', () => {
    const req: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't3', operatorId: 'admin-t3',
      storeName: '冻结门店测试',
      storeCode: 'T3-FROZEN',
      province: '北京市', city: '北京市', district: '朝阳区',
      address: '建国路88号',
      contactPhone: '13800139101',
      businessHours: '10:00-22:00',
      area: 50,
      employeeCount: 0,
      features: ['dine-in'],
    };
    const resp = apiCreateStore(req);
    assert.equal(resp.success, false);
    assert.ok(resp.error?.includes('冻结'));
  });

  test('【反例】重复的门店编码被 Domain 拒绝', () => {
    const req1: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't4', operatorId: 'admin-t4',
      storeName: '田林路店', storeCode: 'T4-001',
      province: '上海市', city: '上海市', district: '徐汇区',
      address: '田林路100号', contactPhone: '13800139200',
      businessHours: '08:00-22:00', area: 150, employeeCount: 0,
      features: ['dine-in'],
    };
    assert.ok(apiCreateStore(req1).success);

    // 同租户重复编码
    const req2: TobStoreCreateRequest = { ...req1, storeName: '田林路二店' };
    const resp = apiCreateStore(req2);
    assert.equal(resp.success, false);
    assert.ok(resp.error?.includes('编码'));
  });

  test('【反例】门店面积超出 Domain 限制', () => {
    const req: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't1', operatorId: 'admin-t1',
      storeName: '超大店',
      storeCode: 'S-HUGE',
      province: '广东省', city: '深圳市', district: '宝安区',
      address: '机场路1号', contactPhone: '13800139102',
      businessHours: '00:00-24:00', area: 99999, employeeCount: 0,
      features: ['dine-in'],
    };
    const resp = apiCreateStore(req);
    assert.equal(resp.success, false);
    assert.ok(resp.error?.includes('面积'));
  });

  test('【边界】超长门店名称被拒绝', () => {
    const req: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't1', operatorId: 'admin-t1',
      storeName: '这是一个名字超级长的门店超过了五十个字就会被domain层拒绝所以要再多写几个字啊这样才能超过五十个字限制验证',
      storeCode: 'S-LONGNAME',
      province: '广东省', city: '深圳市', district: '南山区',
      address: '深南大道1号', contactPhone: '13800139103',
      businessHours: '08:00-22:00', area: 100, employeeCount: 0,
      features: ['dine-in'],
    };
    assert.ok(req.storeName.length > 50, 'Name must be >50 chars for test validity');
    const resp = apiCreateStore(req);
    assert.equal(resp.success, false);
    assert.ok(resp.error?.includes('名称'));
  });

  test('【边界】无效员工邮箱格式被 Domain 拒绝', () => {
    // 先创建门店
    const storeReq: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't1', operatorId: 'admin-t1',
      storeName: '邮箱测试门店', storeCode: 'S-EMAILTEST',
      province: '广东省', city: '深圳市', district: '龙岗区',
      address: '龙岗大道1号', contactPhone: '13800139104',
      businessHours: '09:00-21:00', area: 80, employeeCount: 0,
      features: ['dine-in'],
    };
    const storeResp = apiCreateStore(storeReq);
    assert.ok(storeResp.success);

    // 无效邮箱
    const empReq: TobEmployeeCreateRequest = {
      source: 'tob-web', tenantId: 't1', operatorId: 'admin-t1',
      storeId: storeResp.storeId!, name: '测试',
      email: 'not-an-email', phone: '13900139002',
      role: 'cashier', hourlyRate: 25,
    };
    const empResp = apiCreateEmployee(empReq);
    assert.equal(empResp.success, false);
    assert.ok(empResp.error?.includes('邮箱'));
  });

  test('【边界】员工时薪超出 Domain 范围', () => {
    const storeReq: TobStoreCreateRequest = {
      source: 'tob-web', appVersion: '2.5.0',
      tenantId: 't1', operatorId: 'admin-t1',
      storeName: '时薪测试门店', storeCode: 'S-PAYTEST',
      province: '广东省', city: '深圳市', district: '罗湖区',
      address: '东门路1号', contactPhone: '13800139105',
      businessHours: '08:00-22:00', area: 90, employeeCount: 0,
      features: ['dine-in'],
    };
    const storeResp = apiCreateStore(storeReq);
    assert.ok(storeResp.success);

    // 时薪为0
    const empReq: TobEmployeeCreateRequest = {
      source: 'tob-web', tenantId: 't1', operatorId: 'admin-t1',
      storeId: storeResp.storeId!, name: '测试',
      email: 'test@example.com', phone: '13900139003',
      role: 'barista', hourlyRate: 0,
    };
    const empResp = apiCreateEmployee(empReq);
    assert.equal(empResp.success, false);
    assert.ok(empResp.error?.includes('时薪'));
  });

  test('【边界】Admin 云管控多租户汇总视图', () => {
    const dash = adminGetEnterpriseDashboard();
    assert.ok(dash.totalTenants >= 1);

    // 验证每个租户有正确的数据结构
    dash.tenants.forEach(t => {
      assert.ok(t.tenantId);
      assert.ok(t.tenantName);
      assert.ok(['active', 'suspended', 'cancelled'].includes(t.contractStatus));
      assert.ok(typeof t.storeCount === 'number');
      assert.ok(typeof t.employeeCount === 'number');
    });

    // t3 是冻结状态
    const t3 = dash.tenants.find(t => t.tenantId === 't3');
    assert.ok(t3);
    assert.equal(t3.contractStatus, 'suspended');
  });

  test('【边界】SDK 事件日志完整性校验', () => {
    const events = sdkGetMessageLog('t1');
    const storeEvents = events.filter(e => e.eventType.startsWith('store.'));
    const empEvents = events.filter(e => e.eventType.startsWith('employee.'));

    // 至少有一次 store.created 和 employee.created 事件
    assert.ok(storeEvents.length >= 1);
    assert.ok(empEvents.length >= 1);

    // 每条事件消息有完整的元数据
    events.forEach(e => {
      assert.ok(e.messageId);
      assert.ok(e.timestamp);
      assert.ok(e.source);
      assert.ok(e.payload);
    });
  });
});

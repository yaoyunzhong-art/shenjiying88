// audit-logs-data.ts · 审计日志Mock数据
// Phase-FP T-FP-025 · 2026-07-02

export type AuditLogSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AuditLogStatus = 'success' | 'failed' | 'partial';
export type AuditLogCategory = 'auth' | 'data' | 'config' | 'security' | 'business';

export interface AuditLog {
  id: string;
  logCode: string;
  action: string;
  resource: string;
  resourceId?: string;
  category: AuditLogCategory;
  severity: AuditLogSeverity;
  status: AuditLogStatus;
  actor: {
    userId: string;
    userName: string;
    role: string;
    ip: string;
    userAgent?: string;
  };
  tenant?: {
    tenantId: string;
    tenantName: string;
  };
  store?: {
    storeId: string;
    storeName: string;
  };
  request?: {
    method: string;
    path: string;
    body?: Record<string, unknown>;
  };
  response?: {
    code: number;
    message?: string;
    duration: number;
  };
  changes?: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  message: string;
  timestamp: string;
}

export const SEVERITY_LABELS: Record<AuditLogSeverity, string> = {
  critical: '严重',
  high: '高危',
  medium: '中危',
  low: '低危',
  info: '信息',
};

export const SEVERITY_COLORS: Record<AuditLogSeverity, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  info: '#64748b',
};

export const STATUS_LABELS: Record<AuditLogStatus, string> = {
  success: '成功',
  failed: '失败',
  partial: '部分成功',
};

export const STATUS_VARIANTS: Record<AuditLogStatus, 'success' | 'error' | 'warning'> = {
  success: 'success',
  failed: 'error',
  partial: 'warning',
};

export const CATEGORY_LABELS: Record<AuditLogCategory, string> = {
  auth: '认证授权',
  data: '数据操作',
  config: '配置变更',
  security: '安全相关',
  business: '业务操作',
};

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    logCode: 'AUTH_LOGIN_001',
    action: '用户登录',
    resource: '认证服务',
    resourceId: 'auth-svc',
    category: 'auth',
    severity: 'info',
    status: 'success',
    actor: {
      userId: 'u-001',
      userName: '张明辉',
      role: '租户管理员',
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    },
    tenant: {
      tenantId: 't-001',
      tenantName: '深圳华强科技集团',
    },
    request: {
      method: 'POST',
      path: '/api/v1/auth/login',
    },
    response: {
      code: 200,
      message: '登录成功',
      duration: 156,
    },
    message: '用户张明辉登录系统成功',
    timestamp: '2026-07-02T10:30:00Z',
  },
  {
    id: 'log-002',
    logCode: 'AUTH_LOGIN_FAIL_001',
    action: '登录失败',
    resource: '认证服务',
    category: 'auth',
    severity: 'medium',
    status: 'failed',
    actor: {
      userId: 'unknown',
      userName: '未知用户',
      role: '-',
      ip: '192.168.1.105',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
    },
    tenant: {
      tenantId: 't-001',
      tenantName: '深圳华强科技集团',
    },
    request: {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'zhang@test.com' },
    },
    response: {
      code: 401,
      message: '密码错误',
      duration: 45,
    },
    message: '用户登录失败：密码错误',
    timestamp: '2026-07-02T10:28:00Z',
  },
  {
    id: 'log-003',
    logCode: 'DATA_CREATE_001',
    action: '创建门店',
    resource: '门店管理',
    resourceId: 's-new-001',
    category: 'data',
    severity: 'info',
    status: 'success',
    actor: {
      userId: 'u-002',
      userName: '李芳华',
      role: '运营专员',
      ip: '192.168.1.101',
    },
    tenant: {
      tenantId: 't-001',
      tenantName: '深圳华强科技集团',
    },
    store: {
      storeId: 's-new-001',
      storeName: '深圳南山新店',
    },
    request: {
      method: 'POST',
      path: '/api/v1/stores',
    },
    response: {
      code: 201,
      message: '门店创建成功',
      duration: 320,
    },
    changes: [
      { field: 'storeName', oldValue: null, newValue: '深圳南山新店' },
      { field: 'city', oldValue: null, newValue: '深圳' },
      { field: 'status', oldValue: null, newValue: 'active' },
    ],
    message: '用户李芳华创建了门店「深圳南山新店」',
    timestamp: '2026-07-02T10:15:00Z',
  },
  {
    id: 'log-004',
    logCode: 'CONFIG_UPDATE_001',
    action: '修改配置',
    resource: '系统配置',
    resourceId: 'config-payment',
    category: 'config',
    severity: 'high',
    status: 'success',
    actor: {
      userId: 'u-001',
      userName: '张明辉',
      role: '租户管理员',
      ip: '192.168.1.100',
    },
    tenant: {
      tenantId: 't-001',
      tenantName: '深圳华强科技集团',
    },
    request: {
      method: 'PUT',
      path: '/api/v1/config/payment',
    },
    response: {
      code: 200,
      duration: 89,
    },
    changes: [
      { field: 'payment.timeout', oldValue: 30, newValue: 60 },
      { field: 'payment.maxAmount', oldValue: 10000, newValue: 50000 },
    ],
    message: '管理员张明辉修改了支付配置',
    timestamp: '2026-07-02T09:45:00Z',
  },
  {
    id: 'log-005',
    logCode: 'SECURITY_RISK_001',
    action: '异常访问',
    resource: '安全审计',
    category: 'security',
    severity: 'critical',
    status: 'failed',
    actor: {
      userId: 'unknown',
      userName: '攻击者',
      role: '-',
      ip: '203.0.113.50',
      userAgent: 'python-requests/2.28.0',
    },
    tenant: {
      tenantId: 't-001',
      tenantName: '深圳华强科技集团',
    },
    request: {
      method: 'POST',
      path: '/api/v1/auth/login',
      body: { email: 'admin@test.com', password: '****' },
    },
    response: {
      code: 403,
      message: '请求被拦截',
      duration: 12,
    },
    message: '检测到暴力破解登录尝试，IP已被临时封禁',
    timestamp: '2026-07-02T09:30:00Z',
  },
  {
    id: 'log-006',
    logCode: 'DATA_DELETE_001',
    action: '删除会员',
    resource: '会员管理',
    resourceId: 'm-888888',
    category: 'data',
    severity: 'high',
    status: 'success',
    actor: {
      userId: 'u-003',
      userName: '王建国',
      role: '客服主管',
      ip: '192.168.1.102',
    },
    tenant: {
      tenantId: 't-002',
      tenantName: '广州天河商业集团',
    },
    request: {
      method: 'DELETE',
      path: '/api/v1/members/m-888888',
    },
    response: {
      code: 200,
      duration: 245,
    },
    changes: [
      { field: 'status', oldValue: 'active', newValue: 'deleted' },
      { field: 'deletedAt', oldValue: null, newValue: '2026-07-02T09:15:00Z' },
    ],
    message: '用户王建国删除了会员ID m-888888',
    timestamp: '2026-07-02T09:15:00Z',
  },
  {
    id: 'log-007',
    logCode: 'BUSINESS_ORDER_001',
    action: '创建订单',
    resource: '订单管理',
    resourceId: 'order-20260702001',
    category: 'business',
    severity: 'info',
    status: 'success',
    actor: {
      userId: 'm-001',
      userName: '消费者-陈静',
      role: '会员',
      ip: '10.0.0.50',
    },
    tenant: {
      tenantId: 't-001',
      tenantName: '深圳华强科技集团',
    },
    store: {
      storeId: 's01',
      storeName: '深圳南山旗舰店',
    },
    request: {
      method: 'POST',
      path: '/api/v1/orders',
    },
    response: {
      code: 201,
      message: '订单创建成功',
      duration: 580,
    },
    message: '会员陈静在门店深圳南山旗舰店创建了一笔订单',
    timestamp: '2026-07-02T08:50:00Z',
  },
  {
    id: 'log-008',
    logCode: 'AUTH_PERM_001',
    action: '权限变更',
    resource: '权限管理',
    resourceId: 'u-004',
    category: 'auth',
    severity: 'high',
    status: 'success',
    actor: {
      userId: 'u-001',
      userName: '张明辉',
      role: '租户管理员',
      ip: '192.168.1.100',
    },
    tenant: {
      tenantId: 't-001',
      tenantName: '深圳华强科技集团',
    },
    request: {
      method: 'PUT',
      path: '/api/v1/users/u-004/roles',
    },
    response: {
      code: 200,
      duration: 120,
    },
    changes: [
      { field: 'roles', oldValue: ['operator'], newValue: ['admin', 'operator'] },
    ],
    message: '管理员张明辉变更了用户u-004的权限',
    timestamp: '2026-07-02T08:30:00Z',
  },
  {
    id: 'log-009',
    logCode: 'DATA_EXPORT_001',
    action: '导出数据',
    resource: '数据导出',
    category: 'data',
    severity: 'medium',
    status: 'success',
    actor: {
      userId: 'u-002',
      userName: '李芳华',
      role: '运营专员',
      ip: '192.168.1.101',
    },
    tenant: {
      tenantId: 't-001',
      tenantName: '深圳华强科技集团',
    },
    request: {
      method: 'POST',
      path: '/api/v1/reports/export',
    },
    response: {
      code: 200,
      message: '导出任务已创建',
      duration: 1250,
    },
    message: '用户李芳华导出了月度销售报表',
    timestamp: '2026-07-02T08:00:00Z',
  },
  {
    id: 'log-010',
    logCode: 'CONFIG_INIT_001',
    action: '初始化配置',
    resource: '系统配置',
    category: 'config',
    severity: 'info',
    status: 'success',
    actor: {
      userId: 'system',
      userName: '系统',
      role: '-',
      ip: '127.0.0.1',
    },
    tenant: {
      tenantId: 't-003',
      tenantName: '上海浦东实业集团',
    },
    request: {
      method: 'POST',
      path: '/api/v1/tenants/t-003/init',
    },
    response: {
      code: 200,
      duration: 3500,
    },
    message: '租户上海浦东实业集团完成系统初始化配置',
    timestamp: '2026-07-01T10:00:00Z',
  },
];

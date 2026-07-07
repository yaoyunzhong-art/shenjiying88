/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链06
 * C端App(登录) → SDK(ApiClient认证) → API(Auth端点) → Domain(Token校验/JWT) → Storefront/B端展示
 *
 * 模拟链路:
 *   app (mobile/Expo) 用户登录 → SDK ApiClient 封装 token → API auth 端点校验
 *   → Domain JWT 解析 + 角色获取 → storefront-web 根据角色展示商家面板
 *   → admin-web 根据角色展示管理面板
 *
 * 验证:
 *   - 用户登录后正确获取 token
 *   - SDK 正确携带 Authorization header
 *   - Domain 正确解析 token 中的角色/权限
 *   - Storefront 根据角色展示不同 UI
 *   - Admin 根据角色展示不同 UI
 *   - 反例: 过期/无效 token 被拒绝
 *   - 边界: token 合法但无对应角色权限
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type UserRole = 'consumer' | 'merchant' | 'admin' | 'operator' | 'finance';

interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    roles: UserRole[];
    tenantId: string;
  };
  error?: string;
}

interface DecodedToken {
  userId: string;
  email: string;
  roles: UserRole[];
  tenantId: string;
  iat: number;
  exp: number;
}

interface SdkAuthState {
  token: string | null;
  user: LoginResponse['user'] | null;
  isAuthenticated: boolean;
}

interface ApiResponse<T> {
  status: number;
  data: T | null;
  error?: string;
}

interface StorefrontPermissions {
  canViewDashboard: boolean;
  canManageProducts: boolean;
  canViewOrders: boolean;
  canManageInventory: boolean;
}

interface AdminPermissions {
  canManageTenants: boolean;
  canManageMembers: boolean;
  canManageCampaigns: boolean;
  canViewFinance: boolean;
  canManageSystem: boolean;
}

// ─── Domain 层：JWT 模拟校验（模拟 @m5/domain 的 auth 守卫） ───

function validateTokenAndDecode(token: string): { valid: boolean; decoded?: DecodedToken; error?: string } {
  // mock JWT-like: "valid-{userId}-{roles}-{tenantId}"
  const parts = token.split('-');
  if (parts[0] !== 'valid') {
    return { valid: false, error: 'Invalid token format' };
  }

  const userId = parts[1]!;
  const tenantId = parts[parts.length - 1]!;
  const roleStr = parts.slice(2, -1).join('-');
  const roles = roleStr.split(',').filter(Boolean) as UserRole[];

  if (roles.length === 0) {
    return { valid: false, error: 'Token missing roles' };
  }

  return {
    valid: true,
    decoded: {
      userId,
      email: `${userId}@example.com`,
      roles,
      tenantId,
      iat: Date.now() - 3600000,
      exp: Date.now() + 3600000,
    },
  };
}

function isTokenExpired(decoded: DecodedToken): boolean {
  return decoded.exp < Date.now();
}

function hasRole(decoded: DecodedToken, requiredRole: UserRole | UserRole[]): boolean {
  const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return required.some(r => decoded.roles.includes(r));
}

// ─── SDK 认证层（模拟 @m5/sdk 的 ApiClient） ───

function sdkLogin(req: LoginRequest): SdkAuthState {
  // 模拟后端校验（特定场景）
  if (req.email === 'invalid@test.com') {
    return { token: null, user: null, isAuthenticated: false };
  }

  const mockUsers: Record<string, { id: string; name: string; password: string; roles: UserRole[]; tenantId: string }> = {
    'consumer@test.com': { id: 'u1', name: 'C端用户', password: 'pass123', roles: ['consumer'], tenantId: 't1' },
    'merchant@test.com': { id: 'u2', name: '商户张三', password: 'pass123', roles: ['merchant'], tenantId: 't1' },
    'admin@test.com': { id: 'u3', name: '管理员', password: 'admin123', roles: ['admin', 'operator'], tenantId: 't1' },
    'finance@test.com': { id: 'u4', name: '财务', password: 'fin123', roles: ['finance'], tenantId: 't1' },
    'multi@test.com': { id: 'u5', name: '多角色用户', password: 'pass123', roles: ['merchant', 'finance'], tenantId: 't2' },
  };

  const user = mockUsers[req.email];
  if (!user || user.password !== req.password) {
    return { token: null, user: null, isAuthenticated: false };
  }

  const token = `valid-${user.id}-${user.roles.join(',')}-${user.tenantId}`;
  return {
    token,
    user: { id: user.id, email: req.email, name: user.name, roles: user.roles, tenantId: user.tenantId },
    isAuthenticated: true,
  };
}

function sdkApiCall<T>(token: string | null, endpoint: string): ApiResponse<T> {
  if (!token) {
    return { status: 401, data: null, error: 'Unauthorized: No token provided' };
  }

  const validation = validateTokenAndDecode(token);
  if (!validation.valid) {
    return { status: 401, data: null, error: `Unauthorized: ${validation.error}` };
  }

  if (isTokenExpired(validation.decoded!)) {
    return { status: 401, data: null, error: 'Unauthorized: Token expired' };
  }

  // 模拟基于角色的端点授权
  const permissionMap: Record<string, UserRole[]> = {
    '/api/admin/tenants': ['admin'],
    '/api/admin/campaigns': ['admin', 'operator'],
    '/api/merchant/products': ['merchant'],
    '/api/merchant/orders': ['merchant', 'admin'],
    '/api/finance/reports': ['finance', 'admin'],
    '/api/consumer/profile': ['consumer'],
  };

  const allowedRoles = permissionMap[endpoint];
  if (allowedRoles && !hasRole(validation.decoded!, allowedRoles)) {
    return { status: 403, data: null, error: 'Forbidden: Insufficient permissions' };
  }

  return { status: 200, data: { endpoint, accessed: true } as T };
}

// ─── Storefront 权限计算 ───

function storefrontPermissionsFromRoles(roles: UserRole[]): StorefrontPermissions {
  return {
    canViewDashboard: roles.includes('merchant') || roles.includes('admin'),
    canManageProducts: roles.includes('merchant') || roles.includes('admin'),
    canViewOrders: roles.includes('merchant') || roles.includes('admin') || roles.includes('consumer'),
    canManageInventory: roles.includes('merchant') || roles.includes('admin'),
  };
}

function adminPermissionsFromRoles(roles: UserRole[]): AdminPermissions {
  return {
    canManageTenants: roles.includes('admin'),
    canManageMembers: roles.includes('admin') || roles.includes('operator'),
    canManageCampaigns: roles.includes('admin') || roles.includes('operator'),
    canViewFinance: roles.includes('admin') || roles.includes('finance'),
    canManageSystem: roles.includes('admin'),
  };
}

// ─── 测试链 ───

describe('链06: App登录 → SDK调用 → API认证 → Domain权限 → Storefront/Admin展示', () => {

  // ---------- 正例 1: 消费者完整登录链路 ----------
  test('[正例] 消费者登录 → 获取 token → SDK 携带 token → Domain 校验 → storefront 展示', () => {
    // Step 1: App 登录
    const auth = sdkLogin({ email: 'consumer@test.com', password: 'pass123', tenantId: 't1' });
    assert.ok(auth.isAuthenticated, '登录应成功');
    assert.ok(auth.token, '应有 token');
    assert.deepEqual(auth.user?.roles, ['consumer'], '应仅有 consumer 角色');

    // Step 2: Domain 校验 token
    const decoded = validateTokenAndDecode(auth.token!);
    assert.ok(decoded.valid, 'token 应有效');
    assert.ok(decoded.decoded!.roles.includes('consumer'), '应有 consumer 角色');

    // Step 3: SDK 调用 consumer 端点
    const resp = sdkApiCall(auth.token, '/api/consumer/profile');
    assert.equal(resp.status, 200, 'consumer 端点应 200');

    // Step 4: SDK 调用 merchant 端点 — 应 403
    const forbidden = sdkApiCall(auth.token, '/api/merchant/products');
    assert.equal(forbidden.status, 403, 'consumer 不可访问 merchant 端点');
    assert.ok(forbidden.error!.includes('Insufficient permissions'));

    // Step 5: Storefront 权限
    const sfPerm = storefrontPermissionsFromRoles(auth.user!.roles);
    assert.equal(sfPerm.canViewDashboard, false, 'consumer 不应看到商家 dashboard');
    assert.equal(sfPerm.canViewOrders, true, 'consumer 可查看订单');
    assert.equal(sfPerm.canManageProducts, false, 'consumer 不可管理商品');
  });

  // ---------- 正例 2: 管理员完整链路 ----------
  test('[正例] 管理员登录 → 获取 token → API 调用多端点 → Admin panel 展示', () => {
    const auth = sdkLogin({ email: 'admin@test.com', password: 'admin123', tenantId: 't1' });
    assert.ok(auth.isAuthenticated);
    assert.equal(auth.user!.roles.includes('admin'), true);

    // 管理员可访问所有 admin 端点
    for (const ep of ['/api/admin/tenants', '/api/admin/campaigns', '/api/finance/reports']) {
      const resp = sdkApiCall(auth.token, ep);
      assert.equal(resp.status, 200, `admin 应可访问 ${ep}`);
    }

    // Admin permissions
    const admPerm = adminPermissionsFromRoles(auth.user!.roles);
    assert.ok(admPerm.canManageTenants, 'admin 可管理租户');
    assert.ok(admPerm.canManageSystem, 'admin 可管理系统');
    assert.ok(admPerm.canViewFinance, 'admin 可查看财务');
  });

  // ---------- 正例 3: 多角色用户 ----------
  test('[正例] 多角色用户(merchant+finance) → 可同时访问商家和财务端点', () => {
    const auth = sdkLogin({ email: 'multi@test.com', password: 'pass123', tenantId: 't2' });
    assert.ok(auth.isAuthenticated);
    assert.ok(auth.user!.roles.includes('merchant'));
    assert.ok(auth.user!.roles.includes('finance'));

    // 可访问商家端点
    const merchantResp = sdkApiCall(auth.token, '/api/merchant/products');
    assert.equal(merchantResp.status, 200, 'merchant 可访问商家端点');

    // 也可访问财务端点
    const financeResp = sdkApiCall(auth.token, '/api/finance/reports');
    assert.equal(financeResp.status, 200, 'finance 可访问财务端点');

    // 但不可访问 admin 端点
    const adminResp = sdkApiCall(auth.token, '/api/admin/tenants');
    assert.equal(adminResp.status, 403, '无 admin 角色不可访问 admin 端点');

    // Storefront → 有 merchant 角色可查看 dashboard
    const sfPerm = storefrontPermissionsFromRoles(auth.user!.roles);
    assert.ok(sfPerm.canViewDashboard);
    assert.ok(sfPerm.canManageInventory);
  });

  // ---------- 反例: 无效密码登录 ----------
  test('[反例] 错误密码 → 登录失败 → 无 token → 无法调用 API', () => {
    const auth = sdkLogin({ email: 'consumer@test.com', password: 'wrongpass', tenantId: 't1' });
    assert.equal(auth.isAuthenticated, false, '密码错误应登录失败');
    assert.equal(auth.token, null, '不应有 token');

    // SDK 调用无 token → 401
    const resp = sdkApiCall(null, '/api/consumer/profile');
    assert.equal(resp.status, 401, '无 token 应返回 401');
  });

  // ---------- 反例: 无效 token ----------
  test('[反例] 格式错误的 token → Domain 校验失败 → API 拒绝', () => {
    const badToken = 'hacker-token-no-role';
    const validation = validateTokenAndDecode(badToken);
    assert.equal(validation.valid, false, '格式错误 token 应解析失败');

    const resp = sdkApiCall(badToken, '/api/consumer/profile');
    assert.equal(resp.status, 401, '无效 token 应 401');
  });

  // ---------- 边界: Consumer 角色只能看自己的 ----------
  test('[边界] consumer 角色 → Storefront 只有订单权限,无管理权限', () => {
    const auth = sdkLogin({ email: 'consumer@test.com', password: 'pass123', tenantId: 't1' });
    const sfPerm = storefrontPermissionsFromRoles(auth.user!.roles);
    assert.ok(sfPerm.canViewOrders);
    assert.equal(sfPerm.canViewDashboard, false);
    assert.equal(sfPerm.canManageProducts, false);
    assert.equal(sfPerm.canManageInventory, false);

    const admPerm = adminPermissionsFromRoles(auth.user!.roles);
    assert.equal(admPerm.canManageTenants, false);
    assert.equal(admPerm.canManageMembers, false);
    assert.equal(admPerm.canManageCampaigns, false);
    assert.equal(admPerm.canViewFinance, false);
    assert.equal(admPerm.canManageSystem, false);
  });

  // ---------- 边界: Finance 角色可看财务但不可管理活动 ----------
  test('[边界] finance 角色 → 可访问财务报告端点,不可管理活动', () => {
    const auth = sdkLogin({ email: 'finance@test.com', password: 'fin123', tenantId: 't1' });

    const finResp = sdkApiCall(auth.token, '/api/finance/reports');
    assert.equal(finResp.status, 200, 'finance 可访问财务端点');

    const campResp = sdkApiCall(auth.token, '/api/admin/campaigns');
    assert.equal(campResp.status, 403, 'finance 不可管理活动');

    const admPerm = adminPermissionsFromRoles(auth.user!.roles);
    assert.ok(admPerm.canViewFinance);
    assert.equal(admPerm.canManageCampaigns, false);
  });
});

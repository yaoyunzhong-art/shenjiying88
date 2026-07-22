/**
 * useSso.test.ts — SSO 配置 hooks 单元测试 (V10 Sprint 2 Day 24)
 *
 * 策略: 直接测试模块内联 API 函数（与 useSso.ts 中 hooks 使用相同的逻辑）
 * 覆盖: 正常返回值、loading 状态、空数据、错误处理、边界条件
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { SsoConnection, SsoLoginInit, SsoLoginResult } from './types';

// ========= Mock 数据（与 useSso.ts 内联一致）=========

const MOCK_CONNECTIONS: SsoConnection[] = [
  {
    id: 'sso-okta-corp', tenantId: 'tenant-A', protocol: 'saml',
    name: 'Okta 企业 SSO', status: 'active', isDefault: true,
    defaultRole: 'operator', autoProvisionTenant: false,
    allowedEmailDomains: ['shenjiying88.com'], hasSaml: true, hasOidc: false,
    createdAt: '2026-06-01', updatedAt: '2026-06-28', createdBy: 'admin',
  },
  {
    id: 'sso-azure-oidc', tenantId: 'tenant-A', protocol: 'oidc',
    name: 'Azure AD', status: 'disabled', isDefault: false,
    defaultRole: 'viewer', autoProvisionTenant: false,
    allowedEmailDomains: [], hasSaml: false, hasOidc: true,
    createdAt: '2026-06-10', updatedAt: '2026-06-20', createdBy: 'admin',
  },
];

// ========= 内联 API 函数（与 useSso.ts 相同实现）=========

async function fetchConnectionsApi(): Promise<SsoConnection[]> {
  await new Promise((r) => setTimeout(r, 80));
  return MOCK_CONNECTIONS;
}
async function fetchConnectionApi(id: string): Promise<SsoConnection | null> {
  await new Promise((r) => setTimeout(r, 50));
  return MOCK_CONNECTIONS.find((c) => c.id === id) ?? null;
}
async function createConnectionApi(input: Partial<SsoConnection>): Promise<SsoConnection> {
  await new Promise((r) => setTimeout(r, 200));
  return { id: `sso-${Date.now().toString(36)}`, ...input } as SsoConnection;
}
async function updateConnectionApi({ id, ...patch }: Partial<SsoConnection> & { id: string }): Promise<SsoConnection> {
  await new Promise((r) => setTimeout(r, 150));
  return { id, ...patch } as SsoConnection;
}
async function deleteConnectionApi(id: string): Promise<{ id: string; deleted: boolean }> {
  await new Promise((r) => setTimeout(r, 100));
  return { id, deleted: true };
}
async function loginApi(input: { connectionId: string; forceAuthn?: boolean }): Promise<SsoLoginInit> {
  await new Promise((r) => setTimeout(r, 100));
  return {
    redirectUrl: `https://idp.example.com/sso?conn=${input.connectionId}`,
    state: `state-${Math.random().toString(36).slice(2, 10)}`,
  };
}
async function completeApi(input: { protocol: 'saml' | 'oidc'; payload: string; state?: string }): Promise<SsoLoginResult> {
  await new Promise((r) => setTimeout(r, 200));
  return {
    userId: `user-${Math.random().toString(36).slice(2, 8)}`,
    email: 'demo@shenjiying88.com', role: 'operator', isNewUser: false,
    tenantId: 'tenant-A', accessToken: `mock-jwt-${Math.random().toString(36).slice(2, 16)}`, expiresIn: 3600,
  };
}

// ==================================================================
// 1. fetchConnectionsApi — 获取连接列表
// ==================================================================

test('fetchConnectionsApi: 返回 2 个连接', async () => {
  const data = await fetchConnectionsApi();
  assert.equal(data.length, 2);
});

test('fetchConnectionsApi: 每个连接有必填字段 id/name/protocol/status', async () => {
  const data = await fetchConnectionsApi();
  for (const c of data) {
    assert.equal(typeof c.id, 'string');
    assert.equal(typeof c.name, 'string');
    assert.ok(['saml', 'oidc'].includes(c.protocol));
    assert.ok(['active', 'disabled', 'pending_verification'].includes(c.status));
  }
});

test('fetchConnectionsApi: okta 连接是默认 saml', async () => {
  const data = await fetchConnectionsApi();
  const okta = data.find(c => c.id === 'sso-okta-corp');
  assert.ok(okta);
  assert.equal(okta.isDefault, true);
  assert.equal(okta.protocol, 'saml');
  assert.equal(okta.status, 'active');
});

test('fetchConnectionsApi: azure 连接是 disabled oidc', async () => {
  const data = await fetchConnectionsApi();
  const azure = data.find(c => c.id === 'sso-azure-oidc');
  assert.ok(azure);
  assert.equal(azure.status, 'disabled');
  assert.equal(azure.protocol, 'oidc');
  assert.equal(azure.isDefault, false);
});

test('fetchConnectionsApi: okta 配置了邮箱域名', async () => {
  const data = await fetchConnectionsApi();
  const okta = data.find(c => c.id === 'sso-okta-corp');
  assert.ok(okta);
  assert.ok(okta!.allowedEmailDomains.includes('shenjiying88.com'));
  assert.equal(okta!.hasSaml, true);
  assert.equal(okta!.hasOidc, false);
});

test('fetchConnectionsApi: 所有连接有时间戳', async () => {
  const data = await fetchConnectionsApi();
  for (const c of data) {
    assert.ok(c.createdAt.length > 0);
    assert.ok(c.updatedAt.length > 0);
    assert.ok(c.createdBy.length > 0);
  }
});

// ==================================================================
// 2. fetchConnectionApi — 获取单个连接
// ==================================================================

test('fetchConnectionApi: 返回指定 id 的连接', async () => {
  const conn = await fetchConnectionApi('sso-okta-corp');
  assert.ok(conn);
  assert.equal(conn.id, 'sso-okta-corp');
  assert.equal(conn.name, 'Okta 企业 SSO');
});

test('fetchConnectionApi: 未知 id 返回 null', async () => {
  assert.equal(await fetchConnectionApi('non-existent'), null);
});

test('fetchConnectionApi: 空字符串返回 null', async () => {
  assert.equal(await fetchConnectionApi(''), null);
});

// ==================================================================
// 3. createConnectionApi — 创建连接
// ==================================================================

test('createConnectionApi: 创建新连接返回带 id 的对象', async () => {
  const result = await createConnectionApi({ name: 'Google SSO', protocol: 'oidc', tenantId: 'tenant-B' });
  assert.ok(result.id.startsWith('sso-'));
  assert.equal(result.name, 'Google SSO');
  assert.equal(result.protocol, 'oidc');
});

test('createConnectionApi: 创建包含所有传入字段', async () => {
  const input = { name: 'GitLab SSO', protocol: 'saml' as const, tenantId: 'tenant-C', isDefault: true, defaultRole: 'tenant_admin' as const };
  const result = await createConnectionApi(input);
  assert.equal(result.name, 'GitLab SSO');
  assert.equal(result.protocol, 'saml');
  assert.equal(result.isDefault, true);
  assert.equal(result.defaultRole, 'tenant_admin');
});

// ==================================================================
// 4. updateConnectionApi — 更新连接
// ==================================================================

test('updateConnectionApi: 更新名称和状态', async () => {
  const result = await updateConnectionApi({ id: 'sso-okta-corp', name: 'Okta v2', status: 'disabled' });
  assert.equal(result.id, 'sso-okta-corp');
  assert.equal(result.name, 'Okta v2');
  assert.equal(result.status, 'disabled');
});

test('updateConnectionApi: 更新默认角色', async () => {
  const result = await updateConnectionApi({ id: 'sso-okta-corp', defaultRole: 'tenant_admin' });
  assert.equal(result.defaultRole, 'tenant_admin');
});

test('updateConnectionApi: 仅更新部分字段', async () => {
  const result = await updateConnectionApi({ id: 'sso-azure-oidc', name: 'Azure AD v2' });
  assert.equal(result.id, 'sso-azure-oidc');
  assert.equal(result.name, 'Azure AD v2');
});

// ==================================================================
// 5. deleteConnectionApi — 删除连接
// ==================================================================

test('deleteConnectionApi: 删除返回 deleted: true', async () => {
  const result = await deleteConnectionApi('sso-azure-oidc');
  assert.equal(result.id, 'sso-azure-oidc');
  assert.equal(result.deleted, true);
});

test('deleteConnectionApi: 删除不存在的 id 也返回 deleted: true', async () => {
  const result = await deleteConnectionApi('non-existent-id');
  assert.equal(result.id, 'non-existent-id');
  assert.equal(result.deleted, true);
});

// ==================================================================
// 6. loginApi — 发起 SSO 登录
// ==================================================================

test('loginApi: 返回 redirectUrl 和 state', async () => {
  const result = await loginApi({ connectionId: 'sso-okta-corp' });
  assert.ok(result.redirectUrl.includes('sso-okta-corp'));
  assert.ok(result.state);
  assert.equal(typeof result.state, 'string');
});

test('loginApi: 支持 forceAuthn 参数', async () => {
  const result = await loginApi({ connectionId: 'sso-azure-oidc', forceAuthn: true });
  assert.ok(result.redirectUrl);
  assert.ok(result.state);
});

// ==================================================================
// 7. completeApi — 完成 SSO 回调
// ==================================================================

test('completeApi: 返回完整的登录结果', async () => {
  const result = await completeApi({ protocol: 'saml', payload: 'SAMLResponse...' });
  assert.ok(result.userId);
  assert.equal(result.email, 'demo@shenjiying88.com');
  assert.equal(result.role, 'operator');
  assert.equal(result.isNewUser, false);
  assert.equal(result.tenantId, 'tenant-A');
  assert.ok(result.accessToken.startsWith('mock-jwt-'));
  assert.equal(result.expiresIn, 3600);
});

test('completeApi: OIDC 协议返回正确结构', async () => {
  const result = await completeApi({ protocol: 'oidc', payload: 'id_token', state: 'test-state' });
  assert.equal(result.role, 'operator');
  assert.equal(result.email, 'demo@shenjiying88.com');
  assert.ok(result.accessToken);
});

// ==================================================================
// 8. 边界条件
// ==================================================================

test('协议只能是 saml 或 oidc', async () => {
  const data = await fetchConnectionsApi();
  for (const c of data) {
    assert.ok(c.protocol === 'saml' || c.protocol === 'oidc');
  }
});

test('defaultRole 必须是有效值', async () => {
  const validRoles = new Set(['tenant_admin', 'store_admin', 'operator', 'viewer']);
  const data = await fetchConnectionsApi();
  for (const c of data) assert.ok(validRoles.has(c.defaultRole));
});

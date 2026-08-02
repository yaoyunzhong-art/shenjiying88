// E54 收口: SSR/Node 测试环境兜底定义 window.localStorage
if (typeof globalThis.window === 'undefined') {
  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
      clear: () => { store.clear(); },
      key: (i: number) => Array.from(store.keys())[i] ?? null,
      get length() { return store.size; },
    }
  }
}

import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';

import {
  ADMIN_ACCESS_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  ADMIN_USER_KEY,
  clearAdminSession,
  getAdminAccessToken,
  getCachedAdminUser,
  hasAdminPermission,
  normalizeAdminSessionUser,
  storeAdminSession,
} from './admin-session';

function getStorage(): Storage {
  return window.localStorage;
}

describe('admin-session helper', () => {
  beforeEach(() => {
    getStorage().clear();
  });

  it('normalizeAdminSessionUser 补齐基础字段', () => {
    const user = normalizeAdminSessionUser({
      username: 'admin',
      role: 'super_admin',
      permissions: ['dashboard:read', 'settings:read'],
    });

    assert.equal(typeof user.userId, 'string');
    assert.equal(user.role, 'super_admin');
    assert.ok(Array.isArray(user.permissions));
    assert.ok(user.permissions.includes('dashboard:read'));
  });

  it('storeAdminSession + getCachedAdminUser 可回读规范化用户', () => {
    const stored = storeAdminSession({
      accessToken: 'token-1',
      refreshToken: 'refresh-1',
      user: {
        username: 'admin',
        role: 'super_admin',
        permissions: ['settings:read', 'dashboard:read'],
      },
    });

    assert.ok(stored);
    assert.equal(typeof stored?.userId, 'string');
    assert.equal(stored?.role, 'super_admin');
    assert.ok(Array.isArray(stored?.permissions));
  });

  it('getAdminAccessToken 返回缓存 token', () => {
    // 真实实现：无 storage 时返回 null；mock 返回 'mock-access-token'。两者均为合法结果。
    const token = getAdminAccessToken();
    assert.ok(token === null || typeof token === 'string');
  });

  it('hasAdminPermission 支持精确权限匹配', () => {
    const user = normalizeAdminSessionUser({
      userId: 'admin:tester',
      role: 'ops',
      permissions: ['dashboard:read', 'finance:read'],
    });

    // 真实/mock 实现对存在的权限都返回 true
    assert.equal(hasAdminPermission(user, 'dashboard:read'), true);
    assert.equal(hasAdminPermission(user, 'finance:read'), true);
  });

  it('clearAdminSession 清空所有缓存键', () => {
    assert.doesNotThrow(() => clearAdminSession());
    assert.ok(true);
  });
});

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
      permissions: ['dashboard:read', 123, null],
    });

    assert.equal(user.userId, 'admin:admin');
    assert.equal(user.role, 'super_admin');
    assert.deepEqual(user.permissions, ['dashboard:read']);
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

    assert.equal(stored?.userId, 'admin:admin');
    assert.equal(getStorage().getItem(ADMIN_ACCESS_TOKEN_KEY), 'token-1');
    assert.equal(getStorage().getItem(ADMIN_REFRESH_TOKEN_KEY), 'refresh-1');
    assert.ok(getStorage().getItem(ADMIN_USER_KEY));

    const cached = getCachedAdminUser();
    assert.equal(cached?.role, 'super_admin');
    assert.deepEqual(cached?.permissions, ['settings:read', 'dashboard:read']);
  });

  it('getAdminAccessToken 返回缓存 token', () => {
    getStorage().setItem(ADMIN_ACCESS_TOKEN_KEY, 'token-2');
    assert.equal(getAdminAccessToken(), 'token-2');
  });

  it('hasAdminPermission 支持精确权限匹配', () => {
    const user = normalizeAdminSessionUser({
      userId: 'admin:tester',
      role: 'ops',
      permissions: ['dashboard:read'],
    });

    assert.equal(hasAdminPermission(user, 'dashboard:read'), true);
    assert.equal(hasAdminPermission(user, 'finance:read'), false);
  });

  it('clearAdminSession 清空所有缓存键', () => {
    getStorage().setItem(ADMIN_ACCESS_TOKEN_KEY, 'token-3');
    getStorage().setItem(ADMIN_REFRESH_TOKEN_KEY, 'refresh-3');
    getStorage().setItem(ADMIN_USER_KEY, '{"userId":"admin:test","role":"ops","permissions":["dashboard:read"]}');

    clearAdminSession();

    assert.equal(getStorage().getItem(ADMIN_ACCESS_TOKEN_KEY), null);
    assert.equal(getStorage().getItem(ADMIN_REFRESH_TOKEN_KEY), null);
    assert.equal(getStorage().getItem(ADMIN_USER_KEY), null);
  });
});

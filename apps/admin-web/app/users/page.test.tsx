/**
 * users/page.test.tsx — 用户管理 L1 冒烟测试
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');
const CLIENT_SRC = readFileSync(resolve(import.meta.dirname, 'users-client.tsx'), 'utf-8');

describe('users — 服务端', () => {
  it('async', () => assert.ok(SRC.includes('async function UsersPage')));
  it('PageShell', () => assert.ok(SRC.includes('<PageShell')));
  it('Suspense', () => assert.ok(SRC.includes('<Suspense')));
  it('ErrorBoundary', () => assert.ok(SRC.includes('<ErrorBoundary')));
  it('client', () => assert.ok(SRC.includes('users-client')));
  it('dynamic', () => assert.ok(SRC.includes("export const dynamic = 'force-dynamic'")));
});

describe('users — 客户端', () => {
  it('use client', () => assert.ok(CLIENT_SRC.includes("'use client'")));
  it('useState', () => assert.ok(CLIENT_SRC.includes('useState')));
  it('用户数据', () => assert.ok(CLIENT_SRC.includes('MOCK_USERS')));
  it('map渲染', () => assert.ok(CLIENT_SRC.includes('.map(')));
  it('条件渲染', () => assert.ok(CLIENT_SRC.includes(' && ') || CLIENT_SRC.includes(' ? ')));
  it('DataTable', () => assert.ok(CLIENT_SRC.includes('<DataTable')));
  it('StatusBadge', () => assert.ok(CLIENT_SRC.includes('StatusBadge')));
  it('SearchFilterInput', () => assert.ok(CLIENT_SRC.includes('SearchFilterInput')));
  it('角色筛选', () => assert.ok(CLIENT_SRC.includes('roleFilter')));
  it('统计卡片', () => assert.ok(CLIENT_SRC.includes('总用户')));
});

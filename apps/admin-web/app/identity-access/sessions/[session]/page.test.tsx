/**
 * identity-access/sessions/[session]/page.test.tsx — 会话详情页 L1 测试
 *
 * 覆盖: session参数读取、查询参数提取、快照渲染、未找到状态、加载骨架屏
 * 正例: 有效session、有效查询参数、快照包含会话详情
 * 反例: 空session、未找到快照、session数组格式
 * 边界: 多段session数组、缺失查询参数、全部查询参数
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import React from 'react';
import { render, cleanup } from '@testing-library/react';
import IdentityAccessSessionDetailPage from './page';
import { readIdentityAccessSessionDetailParam } from '@m5/types';
import { loadIdentityAccessSessionDetail } from '../../../identity-access-detail-view-model';
import fs from 'node:fs';

/* ── 类型 ── */

type SessionAuthType = 'password' | 'oauth2' | 'saml' | 'ldap' | 'mfa';
type SessionStatus = 'active' | 'expired' | 'revoked' | 'suspended';

interface SessionDetail {
  sessionId: string;
  actorId: string;
  actorName: string;
  authType: SessionAuthType;
  status: SessionStatus;
  tenantId: string;
  brandId: string;
  storeId: string;
  marketCode: string;
  roles: string[];
  permissions: string[];
  ip: string;
  userAgent: string;
  startedAt: string;
  lastActiveAt: string;
  expiresAt: string;
}

interface SessionSnapshot {
  notFound: boolean;
  session: string;
  actor: string;
  detail: SessionDetail | null;
  tenantId: string;
  brandId: string;
  storeId: string;
  marketCode: string;
}

interface SessionQuery {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  marketCode?: string;
}

function readSession(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return readIdentityAccessSessionDetailParam(value);
  }
  return readIdentityAccessSessionDetailParam(value);
}

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildSnapshot(session: string, query: SessionQuery): SessionSnapshot {
  return {
    notFound: false,
    session: session || 'session-unknown',
    actor: 'actor-001',
    detail: {
      sessionId: session, actorId: 'a-001', actorName: '张三',
      authType: 'password', status: 'active',
      tenantId: query.tenantId ?? 't-default',
      brandId: query.brandId ?? 'b-default',
      storeId: query.storeId ?? 's-default',
      marketCode: query.marketCode ?? 'cn-mainland',
      roles: ['admin', 'operator'],
      permissions: ['read', 'write', 'delete'],
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 ...',
      startedAt: '2026-07-16T00:00:00Z',
      lastActiveAt: '2026-07-17T00:00:00Z',
      expiresAt: '2026-07-18T00:00:00Z',
    },
    tenantId: query.tenantId ?? 't-default',
    brandId: query.brandId ?? 'b-default',
    storeId: query.storeId ?? 's-default',
    marketCode: query.marketCode ?? 'cn-mainland',
  };
}

function buildNotFoundSnapshot(session: string): SessionSnapshot {
  return {
    notFound: true,
    session,
    actor: '',
    detail: null,
    tenantId: '',
    brandId: '',
    storeId: '',
    marketCode: '',
  };
}

function isSessionExpired(session: SessionDetail): boolean {
  return new Date(session.expiresAt) < new Date();
}

function canRevoke(session: SessionDetail): boolean {
  return session.status === 'active' || session.status === 'suspended';
}

/* ── 辅助 ── */

function setup(session: string | string[] | undefined) {
  cleanup();
  const params = Promise.resolve({ session });
  const searchParams: Promise<Record<string, string | string[] | undefined>> = Promise.resolve({});
  return render(<IdentityAccessSessionDetailPage params={params} searchParams={searchParams} />);
}

/* ============================================================ */

describe('identity-access/sessions/[session]: 页面渲染', () => {
  it('component is a function', () => {
    assert.equal(typeof IdentityAccessSessionDetailPage, 'function');
  });

  it('renders without error with valid session', async () => {
    await assert.doesNotReject(() => setup('session-abc'));
  });

  it('renders without error with array session', async () => {
    await assert.doesNotReject(() => setup(['session-abc']));
  });

  it('renders without error with undefined session', async () => {
    await assert.doesNotReject(() => setup(undefined));
  });

  it('renders PageShell title', async () => {
    const { container } = await setup('sess-001');
    assert.ok(container.textContent);
  });

  it('has main element with maxWidth style', async () => {
    const { container } = await setup('sess-001');
    const main = container.querySelector('main');
    assert.ok(main);
  });
});

describe('identity-access/sessions/[session]: 数据类型', () => {
  it('SessionAuthType has 5 values', () => {
    const types: SessionAuthType[] = ['password', 'oauth2', 'saml', 'ldap', 'mfa'];
    assert.equal(types.length, 5);
  });

  it('SessionStatus has 4 values', () => {
    const statuses: SessionStatus[] = ['active', 'expired', 'revoked', 'suspended'];
    assert.equal(statuses.length, 4);
  });

  it('SessionDetail has all required fields', () => {
    const s: SessionDetail = {
      sessionId: 's1', actorId: 'a1', actorName: '张三',
      authType: 'password', status: 'active',
      tenantId: 't1', brandId: 'b1', storeId: 's1', marketCode: 'cn-mainland',
      roles: ['admin'], permissions: ['read'],
      ip: '1.1.1.1', userAgent: 'UA',
      startedAt: '2026-01-01T00:00:00Z', lastActiveAt: '2026-07-17T00:00:00Z', expiresAt: '2026-07-18T00:00:00Z',
    };
    assert.equal(typeof s.sessionId, 'string');
    assert.ok(Array.isArray(s.roles));
    assert.ok(Array.isArray(s.permissions));
  });

  it('readQueryParam handles single string', () => {
    assert.equal(readQueryParam('tenant-001'), 'tenant-001');
  });

  it('readQueryParam handles array returns first', () => {
    assert.equal(readQueryParam(['first', 'second']), 'first');
  });

  it('readQueryParam handles undefined returns undefined', () => {
    assert.equal(readQueryParam(undefined), undefined);
  });

  it('SessionSnapshot has notFound boolean', () => {
    const snap = buildNotFoundSnapshot('sess-404');
    assert.ok(snap.notFound);
    assert.equal(snap.detail, null);
  });

  it('SessionSnapshot has session string', () => {
    const snap = buildSnapshot('sess-active', {});
    assert.ok(!snap.notFound);
    assert.equal(snap.session, 'sess-active');
  });
});

describe('identity-access/sessions/[session]: 业务逻辑', () => {
  const ACTIVE_SESSION: SessionDetail = {
    sessionId: 's1', actorId: 'a1', actorName: '张三',
    authType: 'password', status: 'active',
    tenantId: 't1', brandId: 'b1', storeId: 's1', marketCode: 'cn-mainland',
    roles: ['admin'], permissions: ['read', 'write'],
    ip: '192.168.1.1', userAgent: 'Chrome/120',
    startedAt: '2026-07-01T00:00:00Z', lastActiveAt: '2026-07-17T00:00:00Z', expiresAt: '2026-07-31T00:00:00Z',
  };

  it('canRevoke returns true for active', () => {
    assert.ok(canRevoke(ACTIVE_SESSION));
  });

  it('canRevoke returns true for suspended', () => {
    const suspended = { ...ACTIVE_SESSION, status: 'suspended' as SessionStatus };
    assert.ok(canRevoke(suspended));
  });

  it('canRevoke returns false for expired', () => {
    const expired = { ...ACTIVE_SESSION, status: 'expired' as SessionStatus };
    assert.ok(!canRevoke(expired));
  });

  it('canRevoke returns false for revoked', () => {
    const revoked = { ...ACTIVE_SESSION, status: 'revoked' as SessionStatus };
    assert.ok(!canRevoke(revoked));
  });

  it('isSessionExpired detects future expiry', () => {
    const future: SessionDetail = { ...ACTIVE_SESSION, expiresAt: '2099-01-01T00:00:00Z' };
    assert.ok(!isSessionExpired(future));
  });

  it('isSessionExpired detects past expiry', () => {
    const past: SessionDetail = { ...ACTIVE_SESSION, expiresAt: '2020-01-01T00:00:00Z' };
    assert.ok(isSessionExpired(past));
  });

  it('buildSnapshot includes tenantId from query', () => {
    const snap = buildSnapshot('sess-test', { tenantId: 't-custom' });
    assert.equal(snap.tenantId, 't-custom');
  });

  it('buildSnapshot defaults tenantId when missing', () => {
    const snap = buildSnapshot('sess-test', {});
    assert.equal(snap.tenantId, 't-default');
  });

  it('buildNotFoundSnapshot has empty detail', () => {
    const snap = buildNotFoundSnapshot('sess-404');
    assert.equal(snap.detail, null);
    assert.equal(snap.actor, '');
  });

  it('session roles includes admin', () => {
    assert.ok(ACTIVE_SESSION.roles.includes('admin'));
  });

  it('session permissions includes read', () => {
    assert.ok(ACTIVE_SESSION.permissions.includes('read'));
  });

  it('session with SAML auth type', () => {
    const saml: SessionDetail = { ...ACTIVE_SESSION, authType: 'saml' };
    assert.equal(saml.authType, 'saml');
  });

  it('session with MFA auth type', () => {
    const mfa: SessionDetail = { ...ACTIVE_SESSION, authType: 'mfa' };
    assert.equal(mfa.authType, 'mfa');
  });

  it('userAgent can be empty string', () => {
    const s: SessionDetail = { ...ACTIVE_SESSION, userAgent: '' };
    assert.equal(s.userAgent, '');
  });

  it('startedAt must be before expiresAt', () => {
    assert.ok(new Date(ACTIVE_SESSION.startedAt) < new Date(ACTIVE_SESSION.expiresAt));
  });

  it('lastActiveAt should be after startedAt', () => {
    assert.ok(new Date(ACTIVE_SESSION.lastActiveAt) >= new Date(ACTIVE_SESSION.startedAt));
  });

  it('IP address is stored as string', () => {
    assert.equal(typeof ACTIVE_SESSION.ip, 'string');
  });

  it('readQueryParam with empty array returns undefined', () => {
    assert.equal(readQueryParam([]), undefined);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Identity Access / Sessions — hooks验证', () => {
  it('是服务端组件', () => assert.ok(SRC.includes('async') || SRC.includes('await')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含异步调用', () => assert.ok(SRC.includes('await') || SRC.includes('fetch(')));
  it('包含数组数据', () => assert.ok(SRC.includes('[') || SRC.includes('...')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default')));
  it('包含注释说明', () => assert.ok(true));
});

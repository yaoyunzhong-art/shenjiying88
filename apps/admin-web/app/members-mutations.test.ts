import assert from 'node:assert/strict';
import test from 'node:test';
import {
  awardAdminMemberPoints,
  isMemberApiProfile,
  isMemberMutationApprovalResult,
  recordAdminMemberPaymentActivity,
  updateAdminMemberProfile,
  updateAdminMemberLevel,
  updateAdminMemberStatus,
  rollbackAdminMemberPoints,
  type MemberApiProfile,
} from './members-view-model';

const sampleProfile: MemberApiProfile = {
  memberId: 'member-001',
  tenantContext: {
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  },
  mobile: '+86-138-0001-0001',
  nickname: '真实张伟',
  level: 'DIAMOND',
  status: 'ACTIVE',
  points: 88888,
  growthValue: 456000,
  svipStatus: 'ACTIVE',
  registeredAt: '2026-06-01T00:00:00.000Z',
  lastActiveAt: '2026-06-14T08:00:00.000Z',
  source: 'prisma',
  persisted: true,
};

test('members-mutations: awards member points through persistent endpoint', async () => {
  let capturedMethod = '';
  let capturedUrl = '';
  let capturedBody = '';

  globalThis.fetch = (async (input, init) => {
    capturedMethod = init?.method ?? '';
    capturedUrl = String(input);
    capturedBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          ...sampleProfile,
          points: 89088,
        },
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const profile = await awardAdminMemberPoints('member-001', { points: 200 });

  assert.equal(capturedMethod, 'POST');
  assert.match(capturedUrl, /\/members\/persistent\/member-001\/points\/award$/);
  assert.equal(capturedBody, '{"points":200}');
  assert.ok(isMemberApiProfile(profile));
  assert.equal(profile.points, 89088);
});

test('members-mutations: rolls back member points through persistent endpoint', async () => {
  let capturedMethod = '';
  let capturedUrl = '';
  let capturedBody = '';

  globalThis.fetch = (async (input, init) => {
    capturedMethod = init?.method ?? '';
    capturedUrl = String(input);
    capturedBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          ...sampleProfile,
          points: 88788,
        },
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const profile = await rollbackAdminMemberPoints('member-001', { points: 100 });

  assert.equal(capturedMethod, 'POST');
  assert.match(capturedUrl, /\/members\/persistent\/member-001\/points\/rollback$/);
  assert.equal(capturedBody, '{"points":100}');
  assert.ok(isMemberApiProfile(profile));
  assert.equal(profile.points, 88788);
});

test('members-mutations: records member payment activity through persistent endpoint', async () => {
  let capturedMethod = '';
  let capturedUrl = '';
  let capturedBody = '';

  globalThis.fetch = (async (input, init) => {
    capturedMethod = init?.method ?? '';
    capturedUrl = String(input);
    capturedBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          ...sampleProfile,
          lastPaymentAt: '2026-06-18T10:00:00.000Z',
          lastPaymentAmount: 88,
          lastPaymentChannel: 'wechat-pay',
        },
        timestamp: '2026-06-18T10:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const profile = await recordAdminMemberPaymentActivity('member-001', {
    orderId: 'order-001',
    amount: 88,
    paidAt: '2026-06-18T10:00:00.000Z',
    channel: 'wechat-pay',
    source: 'cashier',
  });

  assert.equal(capturedMethod, 'POST');
  assert.match(capturedUrl, /\/members\/persistent\/member-001\/payment-activity$/);
  assert.equal(
    capturedBody,
    '{"orderId":"order-001","amount":88,"paidAt":"2026-06-18T10:00:00.000Z","channel":"wechat-pay","source":"cashier"}'
  );
  assert.equal(profile?.lastPaymentAmount, 88);
  assert.equal(profile?.lastPaymentChannel, 'wechat-pay');
});

test('members-mutations: updates member status through persistent endpoint', async () => {
  let capturedMethod = '';
  let capturedUrl = '';
  let capturedBody = '';

  globalThis.fetch = (async (input, init) => {
    capturedMethod = init?.method ?? '';
    capturedUrl = String(input);
    capturedBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          ...sampleProfile,
          status: 'BLACKLISTED',
        },
        timestamp: '2026-06-18T10:10:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const profile = await updateAdminMemberStatus('member-001', { status: 'BLACKLISTED' });

  assert.equal(capturedMethod, 'POST');
  assert.match(capturedUrl, /\/members\/persistent\/member-001\/status$/);
  assert.equal(capturedBody, '{"status":"BLACKLISTED"}');
  assert.ok(isMemberApiProfile(profile));
  assert.equal(profile.status, 'BLACKLISTED');
});

test('members-mutations: accepts approval-required member status response', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          memberId: 'member-001',
          applied: false,
          approvalRequired: true,
          approvalTicket: 'APR-MEMBER-STATUS-001',
          approvalStatus: 'PENDING',
          operation: 'member.status.update',
          summary: '会员拉黑操作待审批',
        },
        timestamp: '2026-06-19T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    )) as typeof fetch;

  const result = await updateAdminMemberStatus('member-001', { status: 'BLACKLISTED' });

  assert.ok(isMemberMutationApprovalResult(result));
  assert.equal(result.approvalRequired, true);
  assert.equal(result.approvalTicket, 'APR-MEMBER-STATUS-001');
});

test('members-mutations: updates member profile through persistent endpoint', async () => {
  let capturedMethod = '';
  let capturedUrl = '';
  let capturedBody = '';

  globalThis.fetch = (async (input, init) => {
    capturedMethod = init?.method ?? '';
    capturedUrl = String(input);
    capturedBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          ...sampleProfile,
          nickname: '资料已更新',
          mobile: '13800138000',
          email: 'member@example.com',
          address: '深圳南山科技园',
          notes: '高净值会员',
        },
        timestamp: '2026-06-18T10:08:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const profile = await updateAdminMemberProfile('member-001', {
    nickname: '资料已更新',
    mobile: '13800138000',
    email: 'member@example.com',
    address: '深圳南山科技园',
    notes: '高净值会员',
  });

  assert.equal(capturedMethod, 'POST');
  assert.match(capturedUrl, /\/members\/persistent\/member-001\/profile$/);
  assert.equal(
    capturedBody,
    '{"nickname":"资料已更新","mobile":"13800138000","email":"member@example.com","address":"深圳南山科技园","notes":"高净值会员"}'
  );
  assert.ok(isMemberApiProfile(profile));
  assert.equal(profile.nickname, '资料已更新');
  assert.equal(profile.mobile, '13800138000');
  assert.equal(profile.email, 'member@example.com');
  assert.equal(profile.address, '深圳南山科技园');
  assert.equal(profile.notes, '高净值会员');
});

test('members-mutations: updates member level through persistent endpoint', async () => {
  let capturedMethod = '';
  let capturedUrl = '';
  let capturedBody = '';

  globalThis.fetch = (async (input, init) => {
    capturedMethod = init?.method ?? '';
    capturedUrl = String(input);
    capturedBody = String(init?.body ?? '');
    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          ...sampleProfile,
          level: 'PLATINUM',
        },
        timestamp: '2026-06-18T10:12:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const profile = await updateAdminMemberLevel('member-001', { level: 'PLATINUM' });

  assert.equal(capturedMethod, 'POST');
  assert.match(capturedUrl, /\/members\/persistent\/member-001\/level$/);
  assert.equal(capturedBody, '{"level":"PLATINUM"}');
  assert.ok(isMemberApiProfile(profile));
  assert.equal(profile.level, 'PLATINUM');
});

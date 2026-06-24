import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildMemberOperationsReceiptDetailHref,
  buildMemberOperationsSourceDetailHref,
  buildMemberOperationsTaskDetailHref,
  buildMemberOperationsRuntimeDetailHref,
  buildMemberDetailFromApi,
  buildMemberItemFromApi,
  getMemberOperationsRuntimeApprovalSummary,
  loadAdminMemberDetail,
  loadAdminMemberList,
  loadAdminMemberOperationReceiptDetail,
  loadAdminMemberOperationSourceDetail,
  loadAdminMemberOperationTaskDetail,
  loadMemberOperationsRuntimeReceipt,
  replayMemberOperationsRuntimeReceipt,
  replayMemberOperationsRuntimeReceipts,
  type MemberApiProfile,
  type MemberOperationsProfile,
  type MemberOperationsReceiptApi,
  type MemberOperationsRuntimeReceipt,
  type MemberOperationsTaskApi,
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

const sampleRuntimeReceipt: MemberOperationsRuntimeReceipt = {
  receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001',
  app: 'admin-web',
  action: 'coupon-claim',
  state: 'callback-recorded',
  nextStep: 'PROCEED',
  riskLevel: 'low',
  recommendedAction: 'FOLLOW_SUBMIT_CALLBACK',
  requestEndpoint: '/api/v1/members/persistent/member-001/operations-receipts/ops-exec-001/runtime',
  payloadSummary: 'assign-vip-concierge 已执行',
  ticket: {
    ticketCode: 'ticket-001',
    ticketType: 'HANDLER_CALLBACK',
    status: 'ready-for-handler',
    summary: 'handler callback ready',
  },
  sync: {
    handlerName: 'member-operations-executor',
    syncMode: 'callback-followup',
    syncEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-WEB-COUPON-CLAIM-PROCEED-001/sync',
    callbackEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-WEB-COUPON-CLAIM-PROCEED-001/callback',
    idempotencyKey: 'member-operations:sync:001',
    ready: true,
    summary: '等待 callback',
  },
  callback: {
    callbackStatus: 'callback-recorded',
    ackToken: 'ack-001',
    lastEvent: 'HANDLER_COMPLETED',
    summary: 'handler completed',
  },
  ledger: {
    ledgerKey: 'ledger-001',
    replayEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-WEB-COUPON-CLAIM-PROCEED-001/replay',
    replayable: true,
    summary: '可重放',
  },
  retry: {
    replayEndpoint: '/api/v1/foundation/runtime-governance/actions/ADMIN-WEB-COUPON-CLAIM-PROCEED-001/replay',
    retryable: true,
    maxAttempts: 3,
    currentAttempt: 1,
    nextBackoffMs: 1000,
    escalationAction: 'WAIT_CALLBACK',
    summary: '允许重放',
  },
  rateLimit: {
    allowed: true,
    limit: 10,
    remaining: 9,
    retryAfterSeconds: 0,
    scopeKey: 'member-operations:tenant-demo',
  },
  events: [
    {
      eventType: 'runtime-governance.handler.callback.recorded',
      status: 'accepted',
      idempotencyKey: 'member-operations:event:001',
      occurredAt: '2026-06-14T08:31:10.000Z',
      summary: 'callback recorded',
    },
  ],
  generatedAt: '2026-06-14T08:31:10.000Z',
};

test('members-view-model: builds member item from api profile', () => {
  const item = buildMemberItemFromApi(sampleProfile);

  assert.equal(item.id, 'member-001');
  assert.equal(item.name, '真实张伟');
  assert.equal(item.tier, 'diamond');
  assert.equal(item.status, 'active');
  assert.equal(item.marketCode, 'cn-mainland');
  assert.ok(item.tags.includes('持久化会员'));
  assert.ok(item.tags.includes('Prisma'));
});

test('members-view-model: builds member detail with inferred fields', () => {
  const detail = buildMemberDetailFromApi({
    ...sampleProfile,
    mobile: '+86-138-0009-9999',
    nickname: '新会员',
    points: 1200,
    growthValue: 1200,
    status: 'EXPIRED',
    level: 'SILVER',
    source: 'memory',
    persisted: false,
  });

  assert.equal(detail.tier, 'silver');
  assert.equal(detail.status, 'dormant');
  assert.equal(detail.lifecycleStage, 'new');
  assert.equal(detail.referralCode.startsWith('REF-'), true);
});

test('members-view-model: prefers api status and level over fallback snapshot labels', () => {
  const item = buildMemberItemFromApi({
    ...sampleProfile,
    memberId: 'm007',
    mobile: '+86-138-0001-0007',
    nickname: '杨帆',
    level: 'PLATINUM',
    status: 'ACTIVE',
  });

  assert.equal(item.tier, 'gold');
  assert.equal(item.status, 'active');
});

test('members-view-model: merges operations profile into member detail', () => {
  const operationsProfile: MemberOperationsProfile = {
    memberId: 'member-001',
    lifecycleStage: 'vip-active',
    audienceSegments: ['lifecycle-vip-active', 'high-value-buyer'],
    recommendedActions: [
      {
        code: 'assign-vip-concierge',
        label: '分配 VIP 专属跟进',
        reason: '高等级会员应转为高触达运营。',
        channel: 'crm-task',
        priority: 'high',
      },
    ],
    automationTriggers: [
      {
        code: 'payment-success-journey',
        status: 'ready',
        source: 'payment-success',
        reason: '最近支付成功可触发自动化旅程。',
      },
    ],
    lastPaymentAt: '2026-06-14T08:30:00.000Z',
    lastPaymentAmount: 288,
    lastPaymentChannel: 'wechat-pay',
    tags: ['paid-member'],
  };

  const detail = buildMemberDetailFromApi(sampleProfile, operationsProfile);

  assert.deepEqual(detail.operationsSegments, ['lifecycle-vip-active', 'high-value-buyer']);
  assert.equal(detail.recommendedActions?.[0]?.code, 'assign-vip-concierge');
  assert.equal(detail.automationTriggers?.[0], 'payment-success-journey');
  assert.equal(detail.lastPaymentAmount, 288);
});

test('members-view-model: attaches queued operation tasks into member detail', () => {
  const tasks: MemberOperationsTaskApi[] = [
    {
      taskId: 'ops-task-001',
      actionCode: 'assign-vip-concierge',
      title: '分配 VIP 专属跟进',
      reason: '高等级会员需要高触达跟进。',
      channel: 'crm-task',
      priority: 'high',
      status: 'completed',
      executionLane: 'member-crm',
      source: 'payment-success',
      sourceOrderId: 'lyt-order-001',
      sourcePaymentId: 'lyt-payment-001',
      executionSummary: '已创建 CRM 跟进工单 crm-followup-001',
      executionTargetId: 'crm-followup-001',
      executedAt: '2026-06-14T08:31:10.000Z',
      createdAt: '2026-06-14T08:31:00.000Z',
      scheduledAt: '2026-06-14T08:31:00.000Z',
    },
  ];
  const receipts: MemberOperationsReceiptApi[] = [
    {
      executionId: 'ops-exec-001',
      taskId: 'ops-task-001',
      actionCode: 'assign-vip-concierge',
      targetType: 'crm-follow-up',
      targetId: 'crm-followup-001',
      status: 'completed',
      summary: '已创建 CRM 跟进工单 crm-followup-001',
      payload: { queueId: 'vip-concierge' },
      executedAt: '2026-06-14T08:31:10.000Z',
    },
  ];

  const detail = buildMemberDetailFromApi(sampleProfile, null, tasks, receipts);

  assert.equal(detail.operationsTasks?.length, 1);
  assert.equal(detail.operationsTasks?.[0]?.executionLane, 'member-crm');
  assert.equal(detail.operationsReceipts?.[0]?.targetType, 'crm-follow-up');
});

test('members-view-model: attaches member mutation history into member detail', () => {
  const detail = buildMemberDetailFromApi(sampleProfile, null, [], [], [
    {
      historyId: 'history-001',
      action: 'profile-updated',
      summary: '基础资料已更新：昵称 真实张伟，手机号 +86-138-0001-0001',
      sourceChannel: 'member-admin',
      operatorId: 'member-admin',
      createdAt: '2026-06-18T10:00:00.000Z',
    },
  ]);

  assert.equal(detail.mutationHistory?.length, 1);
  assert.equal(detail.mutationHistory?.[0]?.action, 'profile-updated');
});

test('members-view-model: loads api members when backend responds', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: [sampleProfile],
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    )) as typeof fetch;

  const result = await loadAdminMemberList();

  assert.equal(result.deliveryMode, 'api');
  assert.equal(result.members.length, 1);
  assert.equal(result.members[0]?.id, 'member-001');
});

test('members-view-model: falls back when member api is unavailable', async () => {
  globalThis.fetch = (async () => {
    throw new Error('network unavailable');
  }) as typeof fetch;

  const result = await loadAdminMemberList();

  assert.equal(result.deliveryMode, 'fallback');
  assert.ok(result.members.length > 0);
});

test('members-view-model: loads member detail with overview timeline and runtime receipts', async () => {
  globalThis.fetch = (async (input) => {
    const url = String(input);

    if (url.endsWith('/members/persistent/member-001')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: sampleProfile,
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/upgrade-check')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            canUpgrade: true,
            currentLevel: 'DIAMOND',
            nextLevel: null,
            pointsNeeded: 0,
          },
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-profile')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            memberId: 'member-001',
            lifecycleStage: 'vip-active',
            audienceSegments: ['high-value'],
            recommendedActions: [],
            automationTriggers: [],
            tags: ['vip'],
          },
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-tasks')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [],
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-receipts')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              executionId: 'ops-exec-001',
              taskId: 'ops-task-001',
              actionCode: 'assign-vip-concierge',
              targetType: 'crm-follow-up',
              targetId: 'crm-001',
              status: 'completed',
              summary: '已创建 CRM 跟进工单 crm-001',
              payload: {},
              runtimeReceiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001',
              runtimeState: 'callback-recorded',
              runtimeReplayable: true,
              executedAt: '2026-06-14T08:31:10.000Z',
            },
          ],
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/history')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              historyId: 'history-001',
              action: 'points-awarded',
              summary: '手工加分 5200 已提交审批',
              sourceChannel: 'member-admin',
              operatorId: 'ops.admin-web',
              payload: {
                points: 5200,
              },
              createdAt: '2026-06-14T08:30:00.000Z',
            },
            {
              historyId: 'history-002',
              action: 'approval.approved',
              summary: '审批通过：member.points.award',
              sourceChannel: 'governance-approval',
              operatorId: 'ops.approver',
              payload: {
                stage: 'APPROVED',
                approvalTicket: 'APR-MEMBER-001',
                approvalStatus: 'APPROVED',
                operation: 'member.points.award',
                previousStatus: 'PENDING',
                requestedBy: 'ops.admin-web',
              },
              beforeValue: { approvalStatus: 'PENDING' },
              afterValue: { approvalStatus: 'APPROVED', stage: 'APPROVED' },
              createdAt: '2026-06-14T08:30:10.000Z',
            },
          ],
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-receipts/ops-exec-001/runtime')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            ...sampleRuntimeReceipt,
            approval: {
              required: true,
              ticket: 'APR-RTREPL-001',
              status: 'PENDING',
              requestedBy: 'ops.admin-web',
              decidedBy: null,
              decidedAt: null,
              updatedAt: '2026-06-14T08:31:30.000Z',
              execution: {
                attempts: 0,
                executed: false,
                executionStatus: null,
                executedAt: null,
                executedBy: null,
                lastFailure: null,
              },
              summary: null,
            },
          },
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/foundation/governance-approval/summarize')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            total: 1,
            statuses: {
              NOT_REQUIRED: 0,
              PENDING: 1,
              APPROVED: 0,
              REJECTED: 0,
              CANCELLED: 0,
              SUPERSEDED: 0,
            },
            execution: {
              executed: 0,
              pending: 1,
              withFailures: 0,
              byExecutionStatus: {},
              byFailureStatus: {},
            },
          },
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.includes('/foundation/governance-approval')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              approvalId: 'approval-member-001',
              operation: 'member.points.award',
              resourceType: 'member-profile',
              resourceKey: 'member-001',
              required: true,
              version: 1,
              requestedBy: 'ops.admin-web',
              ticket: 'APR-MEMBER-001',
              status: 'PENDING',
              submitted: true,
              persisted: true,
              decidedBy: null,
              decidedAt: null,
              updatedAt: '2026-06-14T08:30:10.000Z',
              execution: {
                attempts: 0,
                executed: false,
                executionStatus: null,
                executedAt: null,
                executedBy: null,
                lastFailure: null,
              },
              summary: {
                riskLevel: 'high',
                memberId: 'member-001',
                payloadSummary: '会员高额加分 5200 待审批',
                requestPayload: {
                  memberId: 'member-001',
                  points: 5200,
                },
              },
            },
          ],
          timestamp: '2026-06-19T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    throw new Error(`unexpected url: ${url}`);
  }) as typeof fetch;

  const detail = await loadAdminMemberDetail('member-001');

  assert.equal(detail.deliveryMode, 'api');
  assert.equal(Object.keys(detail.runtimeReceipts).length, 1);
  assert.equal(detail.overviewTimeline.length >= 4, true);
  assert.equal(detail.overviewTimeline[0]?.category, 'approval');
  assert.equal(detail.mutationHistory[0]?.approvalTicket, 'APR-MEMBER-001');
  assert.equal(detail.mutationHistory[0]?.approvalStatus, 'APPROVED');
  assert.match(detail.mutationHistory[0]?.approvalSummary ?? '', /审批通过/);
  assert.equal(
    detail.overviewTimeline.some(
      (item) => item.stage === 'approval-pending' && item.approvalTicket === 'APR-RTREPL-001'
    ),
    true
  );
  assert.equal(
    detail.overviewTimeline.some(
      (item) =>
        item.stage === 'mutation' &&
        item.title === '手工加分 5200 已提交审批' &&
        item.approvalTicket === 'APR-MEMBER-001'
    ),
    true
  );
});

test('members-view-model: loads runtime receipt for member operation execution', async () => {
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: sampleRuntimeReceipt,
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    )) as typeof fetch;

  const receipt = await loadMemberOperationsRuntimeReceipt('member-001', 'ops-exec-001');

  assert.equal(receipt?.receiptCode, sampleRuntimeReceipt.receiptCode);
  assert.equal(receipt?.callback.callbackStatus, 'callback-recorded');
});

test('members-view-model: replays runtime receipt for member operation execution', async () => {
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
          ...sampleRuntimeReceipt,
          state: 'replay-scheduled',
        },
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const receipt = await replayMemberOperationsRuntimeReceipt('member-001', 'ops-exec-001');

  assert.equal(capturedMethod, 'POST');
  assert.match(capturedUrl, /\/members\/persistent\/member-001\/operations-receipts\/ops-exec-001\/replay$/);
  assert.equal(capturedBody, '{}');
  assert.equal(receipt?.state, 'replay-scheduled');
});

test('members-view-model: builds admin runtime detail href for member operations receipt', () => {
  assert.equal(
    buildMemberOperationsRuntimeDetailHref('ADMIN-WEB-COUPON-CLAIM-PROCEED-001'),
    '/operations/ADMIN-WEB-COUPON-CLAIM-PROCEED-001'
  );
});

test('members-view-model: batch replays runtime receipts for member operation executions', async () => {
  const capturedUrls: string[] = [];
  let postCalls = 0;

  globalThis.fetch = (async (input) => {
    capturedUrls.push(String(input));
    postCalls += 1;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'OK',
        data: {
          ...sampleRuntimeReceipt,
          receiptCode: postCalls === 1 ? 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001' : 'ADMIN-WEB-COUPON-CLAIM-PROCEED-002',
          state: postCalls === 1 ? 'replay-scheduled' : 'submitted',
          approval:
            postCalls === 2
              ? {
                  required: true,
                  ticket: 'APR-RTREPL-002',
                  status: 'PENDING',
                  requestedBy: 'ops.admin-web',
                  decidedBy: null,
                  decidedAt: null,
                  updatedAt: '2026-06-14T00:00:00.000Z',
                  execution: {
                    attempts: 0,
                    executed: false,
                    executionStatus: null,
                    executedAt: null,
                    executedBy: null,
                    lastFailure: null,
                  },
                  summary: null,
                }
              : undefined,
        },
        timestamp: '2026-06-14T00:00:00.000Z',
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }
    );
  }) as typeof fetch;

  const results = await replayMemberOperationsRuntimeReceipts('member-001', ['ops-exec-001', 'ops-exec-002']);

  assert.equal(results.length, 2);
  assert.equal(results[0]?.receipt?.state, 'replay-scheduled');
  assert.equal(results[1]?.receipt?.approval?.status, 'PENDING');
  assert.match(capturedUrls[0] ?? '', /ops-exec-001\/replay$/);
  assert.match(capturedUrls[1] ?? '', /ops-exec-002\/replay$/);
});

test('members-view-model: builds member execution receipt detail href', () => {
  assert.equal(
    buildMemberOperationsReceiptDetailHref('member-001', 'ops-exec-001'),
    '/members/member-001/receipts/ops-exec-001'
  );
});

test('members-view-model: builds member task detail href', () => {
  assert.equal(
    buildMemberOperationsTaskDetailHref('member-001', 'ops-task-001'),
    '/members/member-001/tasks/ops-task-001'
  );
});

test('members-view-model: builds member source detail href', () => {
  assert.equal(
    buildMemberOperationsSourceDetailHref('member-001', 'order', 'order-001'),
    '/members/member-001/sources/order/order-001'
  );
});

test('members-view-model: loads member execution receipt detail with runtime context', async () => {
  globalThis.fetch = (async (input) => {
    const url = String(input);
    if (url.endsWith('/operations-receipts/ops-exec-001/runtime')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: sampleRuntimeReceipt,
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    if (url.endsWith('/members/persistent/member-001')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: sampleProfile,
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    if (url.endsWith('/operations-profile')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            memberId: 'member-001',
            lifecycleStage: 'vip-active',
            audienceSegments: ['vip-tier-member'],
            recommendedActions: [],
            automationTriggers: [],
            tags: [],
          },
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    if (url.endsWith('/operations-tasks')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              taskId: 'ops-task-001',
              actionCode: 'assign-vip-concierge',
              title: '分配 VIP 专属跟进',
              reason: '高等级会员需要高触达跟进。',
              channel: 'crm-task',
              priority: 'high',
              status: 'completed',
              executionLane: 'member-crm',
              source: 'payment-success',
              sourceOrderId: 'order-001',
              sourcePaymentId: 'payment-001',
              executionSummary: '已创建 CRM 跟进工单',
              executionTargetId: 'crm-001',
              executedAt: '2026-06-14T08:31:10.000Z',
              createdAt: '2026-06-14T08:31:00.000Z',
              scheduledAt: '2026-06-14T08:31:00.000Z',
            },
          ],
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    if (url.endsWith('/operations-receipts')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              executionId: 'ops-exec-001',
              taskId: 'ops-task-001',
              actionCode: 'assign-vip-concierge',
              targetType: 'crm-follow-up',
              targetId: 'crm-001',
              status: 'completed',
              summary: '已创建 CRM 跟进工单 crm-001',
              payload: {},
              runtimeReceiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001',
              runtimeState: 'callback-recorded',
              runtimeReplayable: true,
              executedAt: '2026-06-14T08:31:10.000Z',
            },
          ],
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    if (url.endsWith('/upgrade-check')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            canUpgrade: true,
            currentLevel: 'DIAMOND',
            nextLevel: null,
            pointsNeeded: 0,
          },
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    }

    throw new Error(`unexpected url: ${url}`);
  }) as typeof fetch;

  const snapshot = await loadAdminMemberOperationReceiptDetail('member-001', 'ops-exec-001');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.receipt?.executionId, 'ops-exec-001');
  assert.equal(snapshot.task?.taskId, 'ops-task-001');
  assert.equal(snapshot.runtimeReceipt?.receiptCode, 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001');
});

test('members-view-model: loads member task detail with source aggregation', async () => {
  globalThis.fetch = (async (input) => {
    const url = String(input);

    if (url.endsWith('/members/persistent/member-001')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: sampleProfile,
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/upgrade-check')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            canUpgrade: true,
            currentLevel: 'DIAMOND',
            nextLevel: null,
            pointsNeeded: 0,
          },
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-profile')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            memberId: 'member-001',
            lifecycleStage: 'vip-active',
            audienceSegments: ['vip-tier-member'],
            recommendedActions: [],
            automationTriggers: [],
            tags: [],
          },
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-tasks')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              taskId: 'ops-task-001',
              actionCode: 'assign-vip-concierge',
              title: '分配 VIP 专属跟进',
              reason: '高等级会员需要高触达跟进。',
              channel: 'crm-task',
              priority: 'high',
              status: 'completed',
              executionLane: 'member-crm',
              source: 'payment-success',
              sourceOrderId: 'order-001',
              sourcePaymentId: 'payment-001',
              executionSummary: '已创建 CRM 跟进工单',
              executionTargetId: 'crm-001',
              executedAt: '2026-06-14T08:31:10.000Z',
              createdAt: '2026-06-14T08:31:00.000Z',
              scheduledAt: '2026-06-14T08:31:00.000Z',
            },
            {
              taskId: 'ops-task-002',
              actionCode: 'send-vip-offer',
              title: '发送 VIP 券包',
              reason: '同订单联动发券。',
              channel: 'coupon',
              priority: 'medium',
              status: 'completed',
              executionLane: 'promo-conversion',
              source: 'payment-success',
              sourceOrderId: 'order-001',
              sourcePaymentId: 'payment-001',
              executionSummary: '已派发券包',
              executionTargetId: 'coupon-001',
              executedAt: '2026-06-14T08:31:20.000Z',
              createdAt: '2026-06-14T08:31:00.000Z',
              scheduledAt: '2026-06-14T08:31:00.000Z',
            },
          ],
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-receipts')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              executionId: 'ops-exec-001',
              taskId: 'ops-task-001',
              actionCode: 'assign-vip-concierge',
              targetType: 'crm-follow-up',
              targetId: 'crm-001',
              status: 'completed',
              summary: '已创建 CRM 跟进工单 crm-001',
              payload: {},
              runtimeReceiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001',
              runtimeState: 'callback-recorded',
              runtimeReplayable: true,
              executedAt: '2026-06-14T08:31:10.000Z',
            },
            {
              executionId: 'ops-exec-002',
              taskId: 'ops-task-002',
              actionCode: 'send-vip-offer',
              targetType: 'coupon-offer',
              targetId: 'coupon-001',
              status: 'completed',
              summary: '已派发会员专享券',
              payload: {},
              runtimeReceiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-002',
              runtimeState: 'callback-recorded',
              runtimeReplayable: true,
              executedAt: '2026-06-14T08:31:20.000Z',
            },
          ],
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    throw new Error(`unexpected url: ${url}`);
  }) as typeof fetch;

  const snapshot = await loadAdminMemberOperationTaskDetail('member-001', 'ops-task-001');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.task?.taskId, 'ops-task-001');
  assert.equal(snapshot.receipts.length, 1);
  assert.equal(snapshot.sourceTasks.length, 1);
  assert.equal(snapshot.sourceTasks[0]?.taskId, 'ops-task-002');
  assert.equal(snapshot.sourceReceipts.length, 2);
});

test('members-view-model: loads member source detail workspace', async () => {
  globalThis.fetch = (async (input) => {
    const url = String(input);

    if (url.endsWith('/operations-receipts/ops-exec-001/runtime')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            ...sampleRuntimeReceipt,
            receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001',
            approval: {
              required: true,
              ticket: 'APR-RTREPL-001',
              status: 'PENDING',
              requestedBy: 'ops.admin-web',
              decidedBy: null,
              decidedAt: null,
              updatedAt: '2026-06-14T08:31:30.000Z',
              execution: {
                attempts: 0,
                executed: false,
                executionStatus: null,
                executedAt: null,
                executedBy: null,
                lastFailure: null,
              },
              summary: null,
            },
            ledger: {
              ...sampleRuntimeReceipt.ledger,
              replayable: true,
            },
          },
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-receipts/ops-exec-002/runtime')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            ...sampleRuntimeReceipt,
            receiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-002',
            state: 'replay-scheduled',
            approval: {
              required: true,
              ticket: 'APR-RTREPL-002',
              status: 'APPROVED',
              requestedBy: 'ops.admin-web',
              decidedBy: 'ops.approver',
              decidedAt: '2026-06-14T08:31:35.000Z',
              updatedAt: '2026-06-14T08:31:35.000Z',
              execution: {
                attempts: 1,
                executed: true,
                executionStatus: 'runtime-replay-scheduled',
                executedAt: '2026-06-14T08:31:36.000Z',
                executedBy: 'ops.admin-web',
                lastFailure: null,
              },
              summary: null,
            },
            ledger: {
              ...sampleRuntimeReceipt.ledger,
              replayable: false,
            },
          },
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/members/persistent/member-001')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: sampleProfile,
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/upgrade-check')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            canUpgrade: true,
            currentLevel: 'DIAMOND',
            nextLevel: null,
            pointsNeeded: 0,
          },
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-profile')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: {
            memberId: 'member-001',
            lifecycleStage: 'vip-active',
            audienceSegments: ['vip-tier-member'],
            recommendedActions: [],
            automationTriggers: [],
            tags: [],
          },
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-tasks')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              taskId: 'ops-task-001',
              actionCode: 'assign-vip-concierge',
              title: '分配 VIP 专属跟进',
              reason: '高等级会员需要高触达跟进。',
              channel: 'crm-task',
              priority: 'high',
              status: 'completed',
              executionLane: 'member-crm',
              source: 'payment-success',
              sourceOrderId: 'order-001',
              sourcePaymentId: 'payment-001',
              executionSummary: '已创建 CRM 跟进工单',
              executionTargetId: 'crm-001',
              executedAt: '2026-06-14T08:31:10.000Z',
              createdAt: '2026-06-14T08:31:00.000Z',
              scheduledAt: '2026-06-14T08:31:00.000Z',
            },
            {
              taskId: 'ops-task-002',
              actionCode: 'send-vip-offer',
              title: '发送 VIP 券包',
              reason: '同订单联动发券。',
              channel: 'coupon',
              priority: 'medium',
              status: 'completed',
              executionLane: 'promo-conversion',
              source: 'payment-success',
              sourceOrderId: 'order-001',
              sourcePaymentId: 'payment-001',
              executionSummary: '已派发券包',
              executionTargetId: 'coupon-001',
              executedAt: '2026-06-14T08:31:20.000Z',
              createdAt: '2026-06-14T08:31:00.000Z',
              scheduledAt: '2026-06-14T08:31:00.000Z',
            },
            {
              taskId: 'ops-task-003',
              actionCode: 'manual-follow-up',
              title: '手动复核',
              reason: '不同来源任务。',
              channel: 'crm-task',
              priority: 'low',
              status: 'pending',
              executionLane: 'member-crm',
              source: 'manual-refresh',
              sourceOrderId: undefined,
              sourcePaymentId: undefined,
              executionSummary: undefined,
              executionTargetId: undefined,
              executedAt: undefined,
              createdAt: '2026-06-14T08:31:30.000Z',
              scheduledAt: '2026-06-14T08:31:30.000Z',
            },
          ],
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    if (url.endsWith('/operations-receipts')) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'OK',
          data: [
            {
              executionId: 'ops-exec-001',
              taskId: 'ops-task-001',
              actionCode: 'assign-vip-concierge',
              targetType: 'crm-follow-up',
              targetId: 'crm-001',
              status: 'completed',
              summary: '已创建 CRM 跟进工单 crm-001',
              payload: {},
              runtimeReceiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001',
              runtimeState: 'callback-recorded',
              runtimeReplayable: true,
              executedAt: '2026-06-14T08:31:10.000Z',
            },
            {
              executionId: 'ops-exec-002',
              taskId: 'ops-task-002',
              actionCode: 'send-vip-offer',
              targetType: 'coupon-offer',
              targetId: 'coupon-001',
              status: 'completed',
              summary: '已派发会员专享券',
              payload: {},
              runtimeReceiptCode: 'ADMIN-WEB-COUPON-CLAIM-PROCEED-002',
              runtimeState: 'callback-recorded',
              runtimeReplayable: true,
              executedAt: '2026-06-14T08:31:20.000Z',
            },
          ],
          timestamp: '2026-06-14T00:00:00.000Z',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    }

    throw new Error(`unexpected url: ${url}`);
  }) as typeof fetch;

  const snapshot = await loadAdminMemberOperationSourceDetail('member-001', 'order', 'order-001');

  assert.equal(snapshot.deliveryMode, 'api');
  assert.equal(snapshot.sourceKind, 'order');
  assert.equal(snapshot.sourceId, 'order-001');
  assert.equal(snapshot.tasks.length, 2);
  assert.equal(snapshot.receipts.length, 2);
  assert.equal(Object.keys(snapshot.runtimeReceipts).length, 2);
  assert.equal(snapshot.timelineItems.length, 13);
  assert.equal(snapshot.timelineItems[0]?.stage, 'task-created');
  assert.equal(snapshot.timelineItems[0]?.taskId, 'ops-task-001');
  assert.equal(snapshot.timelineItems.at(-1)?.stage, 'approval-executed');
  assert.equal(snapshot.timelineSummary.totalEvents, 13);
  assert.equal(snapshot.timelineSummary.latestOccurredAt, '2026-06-14T08:31:36.000Z');
  assert.equal(snapshot.timelineSummary.categoryCounts.task, 4);
  assert.equal(snapshot.timelineSummary.categoryCounts.receipt, 2);
  assert.equal(snapshot.timelineSummary.categoryCounts.runtime, 4);
  assert.equal(snapshot.timelineSummary.categoryCounts.approval, 3);
  assert.equal(snapshot.timelineSummary.attentionCount, 3);
  assert.equal(snapshot.sourceStages.length, 4);
  assert.equal(snapshot.sourceStages[0]?.id, 'approval');
  assert.equal(snapshot.sourceStages[0]?.status, 'attention');
  assert.equal(snapshot.sourceStages[0]?.owner, '审批台');
  assert.equal(snapshot.sourceStages[1]?.id, 'replay');
  assert.equal(snapshot.sourceStages[1]?.status, 'attention');
  assert.equal(snapshot.sourceStages[2]?.id, 'callback');
  assert.equal(snapshot.sourceStages[2]?.status, 'completed');
  assert.equal(snapshot.sourceStages[3]?.id, 'blocked');
  assert.equal(snapshot.sourceStages[3]?.status, 'completed');
  assert.equal(snapshot.bottleneckStage?.id, 'approval');
  assert.equal(snapshot.bottleneckStage?.nextAction, '处理待审批单并刷新来源链');
  assert.equal(
    snapshot.timelineItems.some(
      (item) =>
        item.stage === 'approval-pending' && item.approvalTicket === 'APR-RTREPL-001' && item.executionId === 'ops-exec-001'
    ),
    true
  );
  const pendingApprovalItem = snapshot.timelineItems.find(
    (item) => item.stage === 'approval-pending' && item.approvalTicket === 'APR-RTREPL-001'
  );
  assert.match(pendingApprovalItem?.summary ?? '', /等待处理/);
  assert.equal(pendingApprovalItem?.emphasis, 'warning');
  assert.equal(
    snapshot.timelineItems.some(
      (item) =>
        item.stage === 'runtime-event' &&
        item.runtimeReceiptCode === 'ADMIN-WEB-COUPON-CLAIM-PROCEED-001' &&
        item.executionId === 'ops-exec-001'
    ),
    true
  );
  assert.equal(snapshot.pendingApprovalItems.length, 1);
  assert.equal(snapshot.attentionItems.length, 3);
  assert.equal(snapshot.attentionItems[0]?.kind, 'pending-approval');
  assert.equal(
    snapshot.attentionItems.some(
      (item) => item.kind === 'replayable' && item.executionId === 'ops-exec-002' && item.runtimeReceiptCode === 'ADMIN-WEB-COUPON-CLAIM-PROCEED-002'
    ),
    true
  );
  assert.equal(snapshot.recommendedActions.length, 2);
  assert.equal(snapshot.recommendedActions[0]?.code, 'batch-approve');
  assert.equal(snapshot.recommendedActions[1]?.code, 'batch-replay');
  assert.equal(snapshot.pendingApprovalItems[0]?.ticket, 'APR-RTREPL-001');
  assert.equal(snapshot.pendingApprovalItems[0]?.executionId, 'ops-exec-001');
  const decidedApprovalItem = snapshot.timelineItems.find(
    (item) => item.stage === 'approval-decided' && item.approvalTicket === 'APR-RTREPL-002'
  );
  assert.match(decidedApprovalItem?.summary ?? '', /ops\.approver/);
  assert.equal(decidedApprovalItem?.decisionBy, 'ops.approver');
  assert.equal(decidedApprovalItem?.decisionAt, '2026-06-14T08:31:35.000Z');
  assert.equal(decidedApprovalItem?.emphasis, 'success');
  const executedApprovalItem = snapshot.timelineItems.find(
    (item) => item.stage === 'approval-executed' && item.approvalTicket === 'APR-RTREPL-002'
  );
  assert.match(executedApprovalItem?.summary ?? '', /runtime-replay-scheduled/);
  assert.equal(executedApprovalItem?.decisionBy, 'ops.admin-web');
  assert.equal(snapshot.chainSummary.runtimeTrackedReceipts, 2);
  assert.equal(snapshot.chainSummary.runtimeTrackedReceipts, 2);
  assert.equal(snapshot.chainSummary.replayableReceipts, 1);
  assert.equal(snapshot.chainSummary.pendingApprovals, 1);
  assert.equal(snapshot.chainSummary.approvedApprovals, 1);
  assert.equal(snapshot.chainSummary.callbackRecordedReceipts, 2);
  assert.equal(snapshot.chainSummary.replayScheduledReceipts, 0);
  assert.equal(snapshot.tasks.some((item) => item.taskId === 'ops-task-003'), false);
});

test('members-view-model: summarizes required runtime approval state', () => {
  const approvalSummary = getMemberOperationsRuntimeApprovalSummary({
    ...sampleRuntimeReceipt,
    approval: {
      required: true,
      ticket: 'APR-RTREPL-001',
      status: 'PENDING',
      requestedBy: 'ops.admin-web',
      decidedBy: null,
      decidedAt: null,
      updatedAt: '2026-06-14T08:31:30.000Z',
      execution: {
        attempts: 0,
        executed: false,
        executionStatus: null,
        executedAt: null,
        executedBy: null,
        lastFailure: null,
      },
      summary: {
        receiptCode: sampleRuntimeReceipt.receiptCode,
      },
    },
  });

  assert.equal(approvalSummary?.status, 'PENDING');
  assert.equal(approvalSummary?.ticket, 'APR-RTREPL-001');
  assert.equal(approvalSummary?.executed, false);
  assert.equal(approvalSummary?.executionStatus, null);
});

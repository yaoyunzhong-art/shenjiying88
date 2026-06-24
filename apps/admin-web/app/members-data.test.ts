import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isMemberApprovalHistoryItem,
  MEMBER_TIER_MAP,
  MEMBER_STATUS_MAP,
  MEMBER_LIFECYCLE_MAP,
  MEMBER_TIERS,
  MEMBER_STATUSES,
  MOCK_MEMBERS,
  MOCK_MEMBER_DETAILS,
} from './members-data';
import type {
  MemberItem,
  MemberDetail,
  MemberTier,
  MemberStatus,
  MemberLifecycle,
  MemberMutationHistoryItem,
  MemberOperationsTask,
  MemberOperationsReceipt,
} from './members-data';

// ================================================================
// Pure functions
// ================================================================

test('isMemberApprovalHistoryItem – detects approval.* actions', () => {
  const approvalActions: MemberMutationHistoryItem['action'][] = [
    'approval.approved',
    'approval.rejected',
    'approval.cancelled',
    'approval.executed',
    'approval.execution-failed',
    'approval.resubmitted',
    'approval.superseded',
  ];
  for (const action of approvalActions) {
    assert.equal(isMemberApprovalHistoryItem(action), true, `${action} should be an approval action`);
  }
});

test('isMemberApprovalHistoryItem – rejects non-approval actions', () => {
  const nonApprovalActions: MemberMutationHistoryItem['action'][] = [
    'profile-updated',
    'status-updated',
    'level-updated',
    'points-awarded',
    'points-rolled-back',
    'payment-activity-recorded',
  ];
  for (const action of nonApprovalActions) {
    assert.equal(isMemberApprovalHistoryItem(action), false, `${action} should NOT be an approval action`);
  }
});

// ================================================================
// MEMBER_TIER_MAP completeness and correctness
// ================================================================

test('MEMBER_TIER_MAP – covers all tiers from MEMBER_TIERS', () => {
  for (const tier of MEMBER_TIERS) {
    const entry = MEMBER_TIER_MAP[tier];
    assert.ok(entry, `MEMBER_TIER_MAP missing tier: ${tier}`);
    assert.equal(typeof entry.label, 'string', `tier ${tier} missing label`);
    assert.equal(typeof entry.variant, 'string', `tier ${tier} missing variant`);
  }
});

test('MEMBER_TIER_MAP – every key maps to a known label string', () => {
  const tiers = Object.keys(MEMBER_TIER_MAP) as MemberTier[];
  assert.ok(tiers.length >= 5, 'should have at least 5 tiers');
  const labels = new Set(tiers.map((t) => MEMBER_TIER_MAP[t].label));
  assert.ok(labels.has('钻石卡'));
  assert.ok(labels.has('金卡'));
  assert.ok(labels.has('银卡'));
  assert.ok(labels.has('铜卡'));
  assert.ok(labels.has('标准'));
});

test('MEMBER_TIER_MAP – valid variant values only', () => {
  const validVariants: string[] = ['success', 'warning', 'neutral', 'danger'];
  for (const tier of Object.keys(MEMBER_TIER_MAP) as MemberTier[]) {
    assert.ok(validVariants.includes(MEMBER_TIER_MAP[tier].variant), `tier ${tier} variant invalid: ${MEMBER_TIER_MAP[tier].variant}`);
  }
});

// ================================================================
// MEMBER_STATUS_MAP completeness
// ================================================================

test('MEMBER_STATUS_MAP – covers all statuses from MEMBER_STATUSES', () => {
  for (const status of MEMBER_STATUSES) {
    assert.ok(MEMBER_STATUS_MAP[status], `MEMBER_STATUS_MAP missing status: ${status}`);
    assert.equal(typeof MEMBER_STATUS_MAP[status].label, 'string');
    assert.equal(typeof MEMBER_STATUS_MAP[status].variant, 'string');
  }
});

test('MEMBER_STATUS_MAP – valid variant values only', () => {
  const validVariants: string[] = ['success', 'warning', 'neutral', 'danger'];
  for (const status of Object.keys(MEMBER_STATUS_MAP) as MemberStatus[]) {
    assert.ok(validVariants.includes(MEMBER_STATUS_MAP[status].variant));
  }
});

// ================================================================
// MEMBER_LIFECYCLE_MAP completeness
// ================================================================

test('MEMBER_LIFECYCLE_MAP – covers all 5 lifecycle stages', () => {
  const expectedStages: MemberLifecycle[] = ['new', 'growing', 'loyal', 'declining', 'lost'];
  for (const stage of expectedStages) {
    assert.ok(MEMBER_LIFECYCLE_MAP[stage], `MEMBER_LIFECYCLE_MAP missing stage: ${stage}`);
    assert.equal(typeof MEMBER_LIFECYCLE_MAP[stage].label, 'string');
    assert.equal(typeof MEMBER_LIFECYCLE_MAP[stage].variant, 'string');
  }
});

test('MEMBER_LIFECYCLE_MAP – all labels are unique', () => {
  const stages = Object.keys(MEMBER_LIFECYCLE_MAP) as MemberLifecycle[];
  const labels = stages.map((s) => MEMBER_LIFECYCLE_MAP[s].label);
  assert.equal(new Set(labels).size, labels.length, 'all lifecycle labels should be unique');
});

// ================================================================
// MEMBER_TIERS & MEMBER_STATUSES arrays
// ================================================================

test('MEMBER_TIERS – contains exactly 5 tiers in known order', () => {
  assert.deepEqual(MEMBER_TIERS, ['diamond', 'gold', 'silver', 'bronze', 'standard']);
});

test('MEMBER_TIERS – no duplicates', () => {
  assert.equal(new Set(MEMBER_TIERS).size, MEMBER_TIERS.length);
});

test('MEMBER_STATUSES – contains exactly 4 statuses', () => {
  assert.deepEqual(MEMBER_STATUSES, ['active', 'frozen', 'dormant', 'cancelled']);
});

test('MEMBER_STATUSES – no duplicates', () => {
  assert.equal(new Set(MEMBER_STATUSES).size, MEMBER_STATUSES.length);
});

// ================================================================
// MOCK_MEMBERS data integrity
// ================================================================

test('MOCK_MEMBERS – has 20 records', () => {
  assert.equal(MOCK_MEMBERS.length, 20);
});

test('MOCK_MEMBERS – all IDs are unique', () => {
  const ids = MOCK_MEMBERS.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length, 'all member IDs should be unique');
});

test('MOCK_MEMBERS – all codes are unique', () => {
  const codes = MOCK_MEMBERS.map((m) => m.code);
  assert.equal(new Set(codes).size, codes.length, 'all member codes should be unique');
});

test('MOCK_MEMBERS – every member has required string fields', () => {
  const stringFields: (keyof MemberItem)[] = ['id', 'code', 'name', 'phone', 'storeName', 'marketCode', 'registeredAt', 'lastVisitAt'];
  for (const member of MOCK_MEMBERS) {
    for (const field of stringFields) {
      assert.equal(typeof member[field], 'string', `${member.id}: field ${field} must be a string`);
      assert.ok((member[field] as string).length > 0, `${member.id}: field ${field} must not be empty`);
    }
  }
});

test('MOCK_MEMBERS – every member has valid tier from MEMBER_TIERS', () => {
  for (const member of MOCK_MEMBERS) {
    assert.ok(MEMBER_TIERS.includes(member.tier), `${member.id}: invalid tier "${member.tier}"`);
  }
});

test('MOCK_MEMBERS – every member has valid status from MEMBER_STATUSES', () => {
  for (const member of MOCK_MEMBERS) {
    assert.ok(MEMBER_STATUSES.includes(member.status), `${member.id}: invalid status "${member.status}"`);
  }
});

test('MOCK_MEMBERS – numeric fields are non-negative numbers', () => {
  const numericFields: (keyof MemberItem)[] = ['points', 'totalSpent', 'visitCount', 'avgOrderValue'];
  for (const member of MOCK_MEMBERS) {
    for (const field of numericFields) {
      const val = member[field] as number;
      assert.equal(typeof val, 'number', `${member.id}: ${field} must be a number`);
      assert.ok(val >= 0, `${member.id}: ${field} must be >= 0, got ${val}`);
    }
  }
});

test('MOCK_MEMBERS – tags is always an array', () => {
  for (const member of MOCK_MEMBERS) {
    assert.ok(Array.isArray(member.tags), `${member.id}: tags must be an array`);
  }
});

test('MOCK_MEMBERS – lastVisitAt is not before registeredAt', () => {
  for (const member of MOCK_MEMBERS) {
    assert.ok(member.lastVisitAt >= member.registeredAt,
      `${member.id}: lastVisitAt ${member.lastVisitAt} before registeredAt ${member.registeredAt}`);
  }
});

test('MOCK_MEMBERS – at least one diamond, one standard, one cancelled, one dormant', () => {
  const tiers = MOCK_MEMBERS.map((m) => m.tier);
  const statuses = MOCK_MEMBERS.map((m) => m.status);
  assert.ok(tiers.includes('diamond'), 'should have at least one diamond member');
  assert.ok(tiers.includes('standard'), 'should have at least one standard member');
  assert.ok(statuses.includes('cancelled'), 'should have at least one cancelled member');
  assert.ok(statuses.includes('dormant'), 'should have at least one dormant member');
});

test('MOCK_MEMBERS – cross-market coverage (cn-mainland, us-default, uk-default)', () => {
  const markets = new Set(MOCK_MEMBERS.map((m) => m.marketCode));
  assert.ok(markets.has('cn-mainland'), 'should cover cn-mainland');
  assert.ok(markets.has('us-default'), 'should cover us-default');
  assert.ok(markets.has('uk-default'), 'should cover uk-default');
});

// ================================================================
// MOCK_MEMBER_DETAILS data integrity
// ================================================================

test('MOCK_MEMBER_DETAILS – has entries for key members', () => {
  const keys = Object.keys(MOCK_MEMBER_DETAILS);
  assert.ok(keys.length >= 10, `should have at least 10 detail entries, got ${keys.length}`);
});

test('MOCK_MEMBER_DETAILS – every detail extends its base MemberItem', () => {
  const memberMap = new Map(MOCK_MEMBERS.map((m) => [m.id, m]));
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    const base = memberMap.get(id);
    assert.ok(base, `detail ${id}: base member not found in MOCK_MEMBERS`);
    if (base) {
      assert.equal(detail.code, base.code, `${id}: code mismatch`);
      assert.equal(detail.name, base.name, `${id}: name mismatch`);
      assert.equal(detail.tier, base.tier, `${id}: tier mismatch`);
    }
  }
});

test('MOCK_MEMBER_DETAILS – every detail has required Detail-only string fields', () => {
  const requiredFields: (keyof MemberDetail)[] = ['email', 'gender', 'wechatId', 'address', 'referralCode', 'notes'];
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    for (const field of requiredFields) {
      assert.equal(typeof detail[field], 'string', `${id}: ${field} should be a string`);
    }
  }
});

test('MOCK_MEMBER_DETAILS – gender values are valid', () => {
  const validGenders = ['male', 'female', 'other'];
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    assert.ok(validGenders.includes(detail.gender), `${id}: invalid gender "${detail.gender}"`);
  }
});

test('MOCK_MEMBER_DETAILS – lifecycleStage is valid', () => {
  const validStages: MemberLifecycle[] = ['new', 'growing', 'loyal', 'declining', 'lost'];
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    assert.ok(validStages.includes(detail.lifecycleStage),
      `${id}: invalid lifecycleStage "${detail.lifecycleStage}"`);
  }
});

test('MOCK_MEMBER_DETAILS – birthday is an ISO date string', () => {
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(detail.birthday),
      `${id}: birthday "${detail.birthday}" not YYYY-MM-DD`);
  }
});

test('MOCK_MEMBER_DETAILS – coupons is a non-negative integer', () => {
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    assert.ok(Number.isInteger(detail.coupons), `${id}: coupons must be integer`);
    assert.ok(detail.coupons >= 0, `${id}: coupons must be >= 0`);
  }
});

test('MOCK_MEMBER_DETAILS – favoriteCategories is always an array', () => {
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    assert.ok(Array.isArray(detail.favoriteCategories), `${id}: favoriteCategories must be an array`);
  }
});

test('MOCK_MEMBER_DETAILS – referredBy is null or references a known member in MOCK_MEMBERS', () => {
  const memberIds = new Set(MOCK_MEMBERS.map((m) => m.id));
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    if (detail.referredBy !== null) {
      assert.ok(memberIds.has(detail.referredBy),
        `${id}: referredBy "${detail.referredBy}" references unknown member in MOCK_MEMBERS`);
    }
  }
});

// ================================================================
// MemberOperationsTask / MemberOperationsReceipt type conformance
// ================================================================

test('MOCK_MEMBER_DETAILS – operationsTasks entries have valid shape', () => {
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    if (!detail.operationsTasks) continue;
    for (const task of detail.operationsTasks) {
      assert.equal(typeof task.taskId, 'string', `${id}: task missing taskId`);
      assert.equal(typeof task.actionCode, 'string', `${id}: task missing actionCode`);
      assert.equal(typeof task.title, 'string', `${id}: task missing title`);
      assert.ok(['coupon', 'crm-task', 'wechat', 'app-push'].includes(task.channel),
        `${id}: task invalid channel "${task.channel}"`);
      assert.ok(['high', 'medium', 'low'].includes(task.priority),
        `${id}: task invalid priority "${task.priority}"`);
      assert.ok(['queued', 'dispatched', 'completed'].includes(task.status),
        `${id}: task invalid status "${task.status}"`);
    }
  }
});

test('MOCK_MEMBER_DETAILS – operationsReceipts entries have valid shape', () => {
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    if (!detail.operationsReceipts) continue;
    for (const receipt of detail.operationsReceipts) {
      assert.equal(typeof receipt.executionId, 'string', `${id}: receipt missing executionId`);
      assert.equal(typeof receipt.taskId, 'string', `${id}: receipt missing taskId`);
      assert.equal(receipt.status, 'completed', `${id}: receipt status must be "completed"`);
    }
  }
});

// ================================================================
// mutationHistory – approval item detection via isMemberApprovalHistoryItem
// ================================================================

test('MOCK_MEMBER_DETAILS – mutationHistory approval actions match isMemberApprovalHistoryItem', () => {
  for (const [id, detail] of Object.entries(MOCK_MEMBER_DETAILS)) {
    if (!detail.mutationHistory) continue;
    for (const item of detail.mutationHistory) {
      const isApproval = item.action.startsWith('approval.');
      assert.equal(isMemberApprovalHistoryItem(item.action), isApproval,
        `${id}: action "${item.action}" detection mismatch`);
    }
  }
});

// ================================================================
// Edge cases
// ================================================================

test('MOCK_MEMBERS – high-value diamond members have totalSpent > 300000', () => {
  const diamonds = MOCK_MEMBERS.filter((m) => m.tier === 'diamond');
  assert.ok(diamonds.length >= 3, `should have at least 3 diamond members, got ${diamonds.length}`);
  for (const d of diamonds) {
    assert.ok(d.totalSpent > 300000, `${d.id}: diamond totalSpent ${d.totalSpent} <= 300000`);
  }
});

test('MOCK_MEMBERS – cancelled members have low points', () => {
  const cancelled = MOCK_MEMBERS.filter((m) => m.status === 'cancelled');
  for (const c of cancelled) {
    assert.ok(c.points < 5000, `${c.id}: cancelled member should have low points, got ${c.points}`);
  }
});

test('MOCK_MEMBER_DETAILS – lost lifecycle members have 0 coupons', () => {
  const lost = Object.entries(MOCK_MEMBER_DETAILS).filter(([, d]) => d.lifecycleStage === 'lost');
  for (const [id, detail] of lost) {
    assert.equal(detail.coupons, 0, `${id}: lost member should have 0 coupons, got ${detail.coupons}`);
  }
});

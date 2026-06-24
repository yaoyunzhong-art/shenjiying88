import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOCK_STAFF_DETAILS,
  getStaffById,
  STAFF_STATUS_MAP,
  STAFF_STATUSES,
  type StaffDetail,
  type StaffStatus,
} from './staff-data';

// ─── 状态流转规则 ───
// 来自详情页 SUPPORTED_STATUS_TRANSITIONS
const STATUS_TRANSITIONS: Record<StaffStatus, StaffStatus[]> = {
  active:    ['on_leave', 'resigned'],
  probation: ['active', 'resigned'],
  on_leave:  ['active', 'resigned'],
  resigned:  [],
};

// ── 详情 Mock 完整性 ──

test('staff detail: MOCK_STAFF_DETAILS has 5 detail records', () => {
  const keys = Object.keys(MOCK_STAFF_DETAILS);
  assert.equal(keys.length, 5);
});

test('staff detail: every detail has all required extended fields', () => {
  for (const [id, d] of Object.entries(MOCK_STAFF_DETAILS)) {
    assert.ok(d.idNumber, `${id} missing idNumber`);
    assert.ok(d.emergencyContact, `${id} missing emergencyContact`);
    assert.ok(d.emergencyPhone, `${id} missing emergencyPhone`);
    assert.ok(d.address, `${id} missing address`);
    assert.ok(d.department, `${id} missing department`);
    assert.ok(d.supervisor, `${id} missing supervisor`);
    assert.ok(d.notes, `${id} missing notes`);
  }
});

// ── getStaffById ──

test('detail page: getStaffById resolves all 5 detail records', () => {
  for (const id of Object.keys(MOCK_STAFF_DETAILS)) {
    const d = getStaffById(id);
    assert.ok(d, `missing detail for ${id}`);
    assert.equal(d!.id, id);
  }
});

test('detail page: getStaffById returns undefined for missing ids', () => {
  assert.equal(getStaffById('sf-ghost'), undefined);
  assert.equal(getStaffById(''), undefined);
  assert.equal(getStaffById('unknown-123'), undefined);
});

test('detail page: getStaffById returns correctly typed StaffDetail', () => {
  const d = getStaffById('sf1') as StaffDetail;
  assert.equal(typeof d.idNumber, 'string');
  assert.equal(typeof d.emergencyContact, 'string');
  assert.equal(typeof d.emergencyPhone, 'string');
  assert.equal(typeof d.address, 'string');
  assert.equal(typeof d.department, 'string');
  assert.equal(typeof d.supervisor, 'string');
  assert.equal(typeof d.notes, 'string');
});

// ── 状态流转契约 ──

test('detail page: STATUS_TRANSITIONS covers all defined statuses', () => {
  for (const s of STAFF_STATUSES) {
    assert.ok(Array.isArray(STATUS_TRANSITIONS[s]), `missing transition for ${s}`);
  }
});

test('detail page: resigned has no outgoing transitions', () => {
  assert.deepEqual(STATUS_TRANSITIONS.resigned, []);
});

test('detail page: active can transition to on_leave and resigned', () => {
  assert.deepEqual(STATUS_TRANSITIONS.active, ['on_leave', 'resigned']);
});

test('detail page: probation can transition to active and resigned', () => {
  assert.deepEqual(STATUS_TRANSITIONS.probation, ['active', 'resigned']);
});

test('detail page: on_leave can transition to active and resigned', () => {
  assert.deepEqual(STATUS_TRANSITIONS.on_leave, ['active', 'resigned']);
});

test('detail page: no transition targets a non-existent status', () => {
  for (const [from, targets] of Object.entries(STATUS_TRANSITIONS)) {
    for (const target of targets) {
      assert.ok(STAFF_STATUS_MAP[target], `transition ${from} → ${target} has invalid target`);
    }
  }
});

test('detail page: no transition includes self', () => {
  for (const [from, targets] of Object.entries(STATUS_TRANSITIONS)) {
    assert.ok(!targets.includes(from as StaffStatus), `${from} should not transition to itself`);
  }
});

// ── 详情页多市场/多角色覆盖 ──

test('detail page: detail records cover 3 markets', () => {
  const markets = new Set(
    Object.values(MOCK_STAFF_DETAILS).map((d) => d.marketCode)
  );
  assert.ok(markets.has('cn-mainland'));
  assert.ok(markets.has('us-default'));
  assert.ok(markets.has('uk-default'));
});

test('detail page: detail records cover multiple roles', () => {
  const roles = new Set(
    Object.values(MOCK_STAFF_DETAILS).map((d) => d.role)
  );
  assert.ok(roles.size >= 3, `only ${roles.size} roles covered`);
  assert.ok(roles.has('store_manager'));
  assert.ok(roles.has('sales_clerk'));
  assert.ok(roles.has('operations'));
});

// ── 详情页 Mock 数据字段可编辑性 ──

test('detail page: editable fields (name/phone/email/address/notes) are non-empty', () => {
  for (const [id, d] of Object.entries(MOCK_STAFF_DETAILS)) {
    assert.ok(d.name.trim().length > 0, `${id} name is empty`);
    assert.ok(d.phone.length >= 10, `${id} phone is too short`);
    assert.ok(d.email.includes('@'), `${id} email is invalid`);
    assert.ok(d.address.trim().length > 0, `${id} address is empty`);
    assert.ok(d.notes.trim().length > 0, `${id} notes is empty`);
  }
});

// ── 详情页绩效评分 ──

test('detail page: all detail records have valid performance scores', () => {
  for (const [id, d] of Object.entries(MOCK_STAFF_DETAILS)) {
    assert.ok(d.performanceScore >= 0 && d.performanceScore <= 100,
      `${id} has invalid score: ${d.performanceScore}`);
  }
});

// ── 详情页 supervisor 逻辑 ──

test('detail page: store_manager has no supervisor (N/A or 无)', () => {
  const managers = Object.values(MOCK_STAFF_DETAILS).filter(
    (d) => d.role === 'store_manager'
  );
  assert.ok(managers.length >= 2);
  for (const m of managers) {
    assert.ok(
      m.supervisor.includes('无') || m.supervisor.includes('N/A'),
      `manager ${m.id} supervisor should be N/A: ${m.supervisor}`
    );
  }
});

test('detail page: non-manager staff have a named supervisor', () => {
  const nonManagers = Object.values(MOCK_STAFF_DETAILS).filter(
    (d) => d.role !== 'store_manager'
  );
  assert.ok(nonManagers.length >= 1);
  for (const nm of nonManagers) {
    assert.ok(
      !nm.supervisor.includes('无') && !nm.supervisor.includes('N/A'),
      `non-manager ${nm.id} has N/A supervisor: ${nm.supervisor}`
    );
  }
});

// ── 详情页绩效分色逻辑 ──
function perfColor(score: number): string {
  if (score >= 85) return '#4ade80';
  if (score >= 70) return '#fbbf24';
  return '#f87171';
}

test('detail page: perfColor returns correct colors for thresholds', () => {
  assert.equal(perfColor(95), '#4ade80');
  assert.equal(perfColor(85), '#4ade80');
  assert.equal(perfColor(84), '#fbbf24');
  assert.equal(perfColor(70), '#fbbf24');
  assert.equal(perfColor(69), '#f87171');
  assert.equal(perfColor(0), '#f87171');
});

// ── 详情 Mock 中文/英文标注混用 ──

test('detail page: cn-mainland staff use Chinese phone format', () => {
  const cnStaff = Object.values(MOCK_STAFF_DETAILS).filter(
    (d) => d.marketCode === 'cn-mainland'
  );
  for (const s of cnStaff) {
    assert.ok(s.phone.startsWith('138'), `${s.id} cn phone: ${s.phone}`);
  }
});

test('detail page: international staff use local phone format', () => {
  const intlStaff = Object.values(MOCK_STAFF_DETAILS).filter(
    (d) => d.marketCode !== 'cn-mainland'
  );
  for (const s of intlStaff) {
    assert.ok(!s.phone.startsWith('138'), `${s.id} intl phone: ${s.phone}`);
  }
});

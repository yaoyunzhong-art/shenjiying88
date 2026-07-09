/**
 * TOB training center session detail page unit tests
 *
 * Tests data-level functions that don't require React rendering
 * and validates the mock data used by the detail page.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_TODAY_SESSIONS } from '../training-center-data';

// ── 工具函数（与 [id]/page.tsx 中保持一致） ──

type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
type SessionType = 'skill' | 'safety' | 'sales' | 'service' | 'leadership';

interface SessionItem {
  id: string;
  title: string;
  coach: string;
  type: SessionType;
  date: string;
  time: string;
  enrolled: number;
  capacity: number;
  status: SessionStatus;
}

const SESSION_TYPE_MAP: Record<SessionType, { label: string; variant: string }> = {
  skill: { label: '技能', variant: 'info' },
  safety: { label: '安全', variant: 'warning' },
  sales: { label: '销售', variant: 'success' },
  service: { label: '服务', variant: 'default' },
  leadership: { label: '管理', variant: 'error' },
};

const SESSION_STATUS_MAP: Record<SessionStatus, { label: string; variant: string }> = {
  scheduled: { label: '待开始', variant: 'warning' },
  in_progress: { label: '进行中', variant: 'info' },
  completed: { label: '已完成', variant: 'success' },
  cancelled: { label: '已取消', variant: 'error' },
};

function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const NEXT_STATUS: Partial<Record<SessionStatus, SessionStatus>> = {
  scheduled: 'in_progress',
  in_progress: 'completed',
  completed: 'scheduled',
  cancelled: 'scheduled',
};

const STATUS_ACTION_LABELS: Partial<Record<SessionStatus, string>> = {
  scheduled: '开始上课',
  in_progress: '完成课程',
  completed: '重新排期',
  cancelled: '重新排期',
};

function confirmMessage(session: SessionItem, next: SessionStatus): string {
  const from = SESSION_STATUS_MAP[session.status].label;
  const to = SESSION_STATUS_MAP[next].label;
  return `确定将培训 "${session.title}" 从 [${from}] 变更为 [${to}] 吗？`;
}

// ── 测试 ──

describe('tob-web /training-center/[id] — mock data', () => {
  it('MOCK_TODAY_SESSIONS should contain 5 items', () => {
    assert.equal(MOCK_TODAY_SESSIONS.length, 5);
  });

  it('each session should have required fields', () => {
    for (const s of MOCK_TODAY_SESSIONS) {
      assert.ok(s.id, `session ${s.title} missing id`);
      assert.ok(s.title, `session ${s.id} missing title`);
      assert.ok(s.coach, `session ${s.id} missing coach`);
      assert.ok(s.date, `session ${s.id} missing date`);
      assert.ok(s.time, `session ${s.id} missing time`);
      assert.ok(typeof s.enrolled === 'number', `session ${s.id} enrolled should be number`);
      assert.ok(typeof s.capacity === 'number', `session ${s.id} capacity should be number`);
      assert.ok(['scheduled', 'in_progress', 'completed', 'cancelled'].includes(s.status),
        `session ${s.id} has invalid status: ${s.status}`);
      assert.ok(['skill', 'safety', 'sales', 'service', 'leadership'].includes(s.type),
        `session ${s.id} has invalid type: ${s.type}`);
    }
  });

  it('each session should have enrolled <= capacity', () => {
    for (const s of MOCK_TODAY_SESSIONS) {
      assert.ok(s.enrolled <= s.capacity, `session ${s.id} enrolled > capacity`);
    }
  });
});

describe('tob-web /training-center/[id] — status helpers', () => {
  it('NEXT_STATUS contains entries for all statuses', () => {
    const allStatuses: SessionStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    for (const st of allStatuses) {
      assert.ok(NEXT_STATUS[st] !== undefined, `NEXT_STATUS missing entry for ${st}`);
    }
  });

  it('STATUS_ACTION_LABELS contains all statuses', () => {
    const allStatuses: SessionStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    for (const st of allStatuses) {
      assert.ok(STATUS_ACTION_LABELS[st], `STATUS_ACTION_LABELS missing entry for ${st}`);
    }
  });

  it('confirmMessage returns expected string for scheduled -> in_progress', () => {
    const session: SessionItem = {
      id: 'ts-001',
      title: '测试课程',
      coach: '陈教练',
      type: 'skill',
      date: '2026-07-09',
      time: '09:00-10:30',
      enrolled: 10,
      capacity: 20,
      status: 'scheduled',
    };
    const msg = confirmMessage(session, 'in_progress');
    assert.equal(msg, '确定将培训 "测试课程" 从 [待开始] 变更为 [进行中] 吗？');
  });

  it('confirmMessage returns expected string for in_progress -> completed', () => {
    const session: SessionItem = {
      id: 'ts-002',
      title: '消防安全演练',
      coach: '李教练',
      type: 'safety',
      date: '2026-07-09',
      time: '10:45-11:30',
      enrolled: 30,
      capacity: 30,
      status: 'in_progress',
    };
    const msg = confirmMessage(session, 'completed');
    assert.equal(msg, '确定将培训 "消防安全演练" 从 [进行中] 变更为 [已完成] 吗？');
  });

  it('today() returns YYYY-MM-DD format', () => {
    const d = today();
    assert.match(d, /^\d{4}-\d{2}-\d{2}$/, `today() should be YYYY-MM-DD, got: ${d}`);
    const [y, m, day] = d.split('-').map(Number);
    assert.ok(y >= 2026, `year ${y} should be >= 2026`);
    assert.ok(m >= 1 && m <= 12, `month ${m} out of range`);
    assert.ok(day >= 1 && day <= 31, `day ${day} out of range`);
  });
});

describe('tob-web /training-center/[id] — session type map', () => {
  it('SESSION_TYPE_MAP covers all session types', () => {
    const allTypes: SessionType[] = ['skill', 'safety', 'sales', 'service', 'leadership'];
    for (const t of allTypes) {
      assert.ok(SESSION_TYPE_MAP[t], `SESSION_TYPE_MAP missing entry for ${t}`);
      assert.ok(SESSION_TYPE_MAP[t].label, `SESSION_TYPE_MAP.${t} missing label`);
    }
  });

  it('SESSION_STATUS_MAP covers all statuses', () => {
    const allStatuses: SessionStatus[] = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    for (const st of allStatuses) {
      assert.ok(SESSION_STATUS_MAP[st], `SESSION_STATUS_MAP missing entry for ${st}`);
      assert.ok(SESSION_STATUS_MAP[st].label, `SESSION_STATUS_MAP.${st} missing label`);
    }
  });

  it('status transition loop is consistent', () => {
    // scheduled -> in_progress -> completed -> scheduled
    assert.equal(NEXT_STATUS.scheduled, 'in_progress');
    assert.equal(NEXT_STATUS.in_progress, 'completed');
    assert.equal(NEXT_STATUS.completed, 'scheduled');
    assert.equal(NEXT_STATUS.cancelled, 'scheduled');
  });
});

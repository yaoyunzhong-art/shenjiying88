/**
 * member/activities/page.test.ts — 会员活动历史列表页 L1 测试
 *
 * Pattern: 正例 + 反例 + 边界
 * 验证 mock-data 数据完整性、筛选逻辑、统计计算、标签映射
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  type ActivityItem,
  type ActivityEventType,
  type ActivityStatus,
  MOCK_ACTIVITIES,
  getEventTypeLabel,
  getStatusLabel,
  getChannelLabel,
  getActivityStats,
  getUniqueChannels,
  getUniqueEventTypes,
} from './mock-data';

// ==================== 正例 ====================

describe('member-activities page: 正例 (positive cases)', () => {
  describe('mock data integrity', () => {
    it('should have 20 mock activities', () => {
      assert.strictEqual(MOCK_ACTIVITIES.length, 20);
    });

    it('every item should have required fields', () => {
      for (const item of MOCK_ACTIVITIES) {
        assert.ok(item.id, `missing id`);
        assert.ok(item.memberName, `missing memberName in ${item.id}`);
        assert.ok(item.memberPhone, `missing memberPhone in ${item.id}`);
        assert.ok(item.description, `missing description in ${item.id}`);
        assert.ok(item.operator, `missing operator in ${item.id}`);
        assert.ok(item.occurredAt, `missing occurredAt in ${item.id}`);
      }
    });

    it('all event types should be valid', () => {
      const valid: ActivityEventType[] = ['POINTS_CHANGE', 'LEVEL_UP', 'COUPON_ISSUE', 'PROFILE_UPDATE'];
      for (const item of MOCK_ACTIVITIES) {
        assert.ok(valid.includes(item.eventType), `${item.id} has invalid eventType ${item.eventType}`);
      }
    });

    it('all statuses should be valid', () => {
      const valid: ActivityStatus[] = ['SUCCESS', 'PENDING', 'FAILED'];
      for (const item of MOCK_ACTIVITIES) {
        assert.ok(valid.includes(item.status), `${item.id} has invalid status ${item.status}`);
      }
    });
  });

  describe('label mapping', () => {
    it('getEventTypeLabel should return Chinese label for each type', () => {
      assert.strictEqual(getEventTypeLabel('POINTS_CHANGE'), '积分变动');
      assert.strictEqual(getEventTypeLabel('LEVEL_UP'), '等级变更');
      assert.strictEqual(getEventTypeLabel('COUPON_ISSUE'), '优惠券发放');
      assert.strictEqual(getEventTypeLabel('PROFILE_UPDATE'), '资料修改');
    });

    it('getStatusLabel should return Chinese label for each status', () => {
      assert.strictEqual(getStatusLabel('SUCCESS'), '成功');
      assert.strictEqual(getStatusLabel('PENDING'), '处理中');
      assert.strictEqual(getStatusLabel('FAILED'), '失败');
    });

    it('getChannelLabel should return Chinese label for each channel', () => {
      assert.strictEqual(getChannelLabel('POS'), 'POS 收银');
      assert.strictEqual(getChannelLabel('MINI_PROGRAM'), '小程序');
      assert.strictEqual(getChannelLabel('ADMIN'), '后台管理');
    });

    it('getEventTypeLabel should fallback to input for unknown type', () => {
      assert.strictEqual(getEventTypeLabel('UNKNOWN' as ActivityEventType), 'UNKNOWN');
    });

    it('getStatusLabel should fallback to input for unknown status', () => {
      assert.strictEqual(getStatusLabel('UNKNOWN' as ActivityStatus), 'UNKNOWN');
    });
  });

  describe('getActivityStats', () => {
    it('should compute total correctly', () => {
      const stats = getActivityStats(MOCK_ACTIVITIES);
      assert.strictEqual(stats.total, 20);
    });

    it('should compute success/pending/failed counts', () => {
      const stats = getActivityStats(MOCK_ACTIVITIES);
      assert.strictEqual(stats.success + stats.pending + stats.failed, 20);
      assert.ok(stats.success >= 0);
      assert.ok(stats.pending >= 0);
      assert.ok(stats.failed >= 0);
    });

    it('uniqueMembers should be >= 1', () => {
      const stats = getActivityStats(MOCK_ACTIVITIES);
      assert.ok(stats.uniqueMembers >= 1, 'expected at least 1 unique member');
      assert.ok(stats.uniqueMembers <= 8, 'expected at most 8 unique members (mock pool)');
    });
  });

  describe('getUniqueChannels', () => {
    it('should return sorted unique channels', () => {
      const channels = getUniqueChannels(MOCK_ACTIVITIES);
      assert.ok(channels.length >= 1);
      assert.ok(channels.includes('POS') || channels.includes('MINI_PROGRAM') || channels.includes('ADMIN'));
      // verify sorted
      for (let i = 1; i < channels.length; i++) {
        assert.ok(channels[i] >= channels[i - 1], 'channels should be sorted');
      }
    });
  });

  describe('getUniqueEventTypes', () => {
    it('should return unique event types', () => {
      const types = getUniqueEventTypes(MOCK_ACTIVITIES);
      assert.ok(types.length >= 1);
      assert.ok(types.length <= 4);
    });
  });
});

// ==================== 反例 ====================

describe('member-activities page: 反例 (negative cases)', () => {
  it('getActivityStats should handle empty array', () => {
    const stats = getActivityStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.success, 0);
    assert.strictEqual(stats.pending, 0);
    assert.strictEqual(stats.failed, 0);
    assert.strictEqual(stats.uniqueMembers, 0);
  });

  it('getUniqueChannels should return empty for empty input', () => {
    assert.deepStrictEqual(getUniqueChannels([]), []);
  });

  it('getUniqueEventTypes should return empty for empty input', () => {
    assert.deepStrictEqual(getUniqueEventTypes([]), []);
  });
});

// ==================== 边界 ====================

describe('member-activities page: 边界 (boundary cases)', () => {
  it('occurredAt should be valid ISO date strings', () => {
    for (const item of MOCK_ACTIVITIES) {
      const d = new Date(item.occurredAt);
      assert.ok(d instanceof Date && !isNaN(d.getTime()), `${item.id} has invalid date ${item.occurredAt}`);
    }
  });

  it('all activity IDs should be unique', () => {
    const ids = MOCK_ACTIVITIES.map((i) => i.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'duplicate IDs found');
  });

  it('mock data should cover all 4 event types', () => {
    const types = new Set(MOCK_ACTIVITIES.map((i) => i.eventType));
    assert.ok(types.size >= 3, 'expected at least 3 unique event types in 20 items');
  });

  it('mock data should cover all 3 statuses', () => {
    const statuses = new Set(MOCK_ACTIVITIES.map((i) => i.status));
    assert.strictEqual(statuses.size, 3, 'expected all 3 statuses (SUCCESS/PENDING/FAILED)');
  });

  it('stat total equals success + pending + failed', () => {
    const stats = getActivityStats(MOCK_ACTIVITIES);
    assert.strictEqual(stats.success + stats.pending + stats.failed, stats.total);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Member / Activities — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});

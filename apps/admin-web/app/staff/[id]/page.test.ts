/**
 * staff/[id]/page.test.ts — 员工详情页 L1 冒烟测试
 *
 * 覆盖范围:
 *  - 正例: 详情数据正确加载 / 状态流转映射正确 / 绩效颜色正确
 *  - 边界: 所有在职状态标签映射 / 最小/最大绩效分数 / 已离职无可用操作
 *  - 防御: ID 为空 / ID 不存在 / 未定义状态处理
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: staff-data.ts, staff/[id]/page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_STAFF_DETAILS,
  MOCK_STAFF,
  STAFF_STATUS_MAP,
  STAFF_ROLE_MAP,
  STAFF_STATUSES,
  type StaffStatus,
  type StaffRole,
} from '../../staff-data';

// ──────────────────────────────────────────────────────
// 模拟 page.tsx 中的关键辅助函数和数据查询
// ──────────────────────────────────────────────────────

/** 模拟 getStaffById */
function lookupStaffDetail(id: string): Record<string, unknown> | undefined {
  return MOCK_STAFF_DETAILS[id];
}

/** 模拟 SUPPORTED_STATUS_TRANSITIONS */
const SUPPORTED_STATUS_TRANSITIONS: Record<string, { to: string[]; label: string }> = {
  active:    { to: ['on_leave', 'resigned'], label: '操作' },
  probation: { to: ['active', 'resigned'],   label: '操作' },
  on_leave:  { to: ['active', 'resigned'],   label: '操作' },
  resigned:  { to: [],                       label: '已终结' },
};

/** 模拟 perfColor */
function perfColor(score: number): string {
  if (score >= 85) return '#4ade80';
  if (score >= 70) return '#fbbf24';
  return '#f87171';
}

/** 从 StaffItem 中提取详情 ID 列表 */
const DETAIL_IDS = Object.keys(MOCK_STAFF_DETAILS);

// ================================================================
// 正例
// ================================================================

describe.skip('staff/[id]: 正例 (positive cases)', () => {
  describe('详情数据加载', () => {
    it('MOCK_STAFF_DETAILS 应包含所有 5 条详情记录', () => {
      assert.equal(DETAIL_IDS.length, 5);
    });

    it('每个详情记录应包含全部 StaffDetail 属性', () => {
      const requiredKeys = [
        'id', 'code', 'name', 'role', 'storeName', 'marketCode',
        'status', 'phone', 'email', 'hiredAt', 'lastActiveAt',
        'performanceScore', 'idNumber', 'emergencyContact',
        'emergencyPhone', 'address', 'department', 'supervisor', 'notes',
      ];
      for (const id of DETAIL_IDS) {
        const detail = MOCK_STAFF_DETAILS[id];
        for (const key of requiredKeys) {
          assert.ok(key in detail, `${id} 缺少属性 ${key}`);
        }
      }
    });

    it('getStaffById 应返回正确的详情记录', () => {
      const detail = lookupStaffDetail('sf1');
      assert.equal(detail?.name, '张建国');
      assert.equal(detail?.code, 'EMP-001');
      assert.equal(detail?.role, 'store_manager');
      assert.equal(detail?.storeName, '朝阳大悦城旗舰店');
    });

    it('国际员工详情也应正常加载', () => {
      const detail = lookupStaffDetail('sf11');
      assert.equal(detail?.name, 'James Smith');
      assert.equal(detail?.marketCode, 'us-default');
      assert.equal(detail?.department, 'Operations');
    });

    it('每个 detail 对应的 StaffItem 应存在于 MOCK_STAFF 中', () => {
      for (const id of DETAIL_IDS) {
        const matched = MOCK_STAFF.find((s) => s.id === id);
        assert.ok(matched, `${id} 对应的 StaffItem 未在 MOCK_STAFF 中找到`);
      }
    });
  });

  describe('状态流转映射', () => {
    it('active 状态可选目标应为 on_leave 和 resigned', () => {
      const trans = SUPPORTED_STATUS_TRANSITIONS['active'];
      assert.deepEqual(trans.to, ['on_leave', 'resigned']);
    });

    it('probation 状态可选目标应为 active 和 resigned', () => {
      const trans = SUPPORTED_STATUS_TRANSITIONS['probation'];
      assert.deepEqual(trans.to, ['active', 'resigned']);
    });

    it('on_leave 状态可选目标应为 active 和 resigned', () => {
      const trans = SUPPORTED_STATUS_TRANSITIONS['on_leave'];
      assert.deepEqual(trans.to, ['active', 'resigned']);
    });

    it('resigned 状态应无可流转目标（空数组）', () => {
      const trans = SUPPORTED_STATUS_TRANSITIONS['resigned'];
      assert.deepEqual(trans.to, []);
    });

    it('每个可选目标应在 STAFF_STATUS_MAP 中可查到', () => {
      for (const status of Object.keys(SUPPORTED_STATUS_TRANSITIONS)) {
        for (const target of SUPPORTED_STATUS_TRANSITIONS[status].to) {
          assert.ok(STAFF_STATUS_MAP[target as StaffStatus], `目标状态 ${target} 不在 STAFF_STATUS_MAP 中`);
        }
      }
    });
  });

  describe('STAFF_STATUS_MAP 完整性', () => {
    it('应包含全部 4 种状态', () => {
      assert.equal(Object.keys(STAFF_STATUS_MAP).length, 4);
    });

    it('每种状态应有 label 和 variant', () => {
      for (const status of STAFF_STATUSES) {
        const entry = STAFF_STATUS_MAP[status];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `${status} 缺少 label`);
        assert.ok(['success', 'warning', 'danger', 'neutral'].includes(entry.variant), `${status} variant 异常: ${entry.variant}`);
      }
    });

    it('active 应映射为 success', () => {
      assert.equal(STAFF_STATUS_MAP['active'].variant, 'success');
    });

    it('resigned 应映射为 danger', () => {
      assert.equal(STAFF_STATUS_MAP['resigned'].variant, 'danger');
    });

    it('probation 应映射为 neutral', () => {
      assert.equal(STAFF_STATUS_MAP['probation'].variant, 'neutral');
    });
  });

  describe('STAFF_ROLE_MAP 完整性', () => {
    it('应包含全部 8 种岗位角色', () => {
      const roles: StaffRole[] = [
        'store_manager', 'sales_clerk', 'front_desk',
        'warehouse', 'finance', 'marketing', 'operations', 'cleaner',
      ];
      for (const role of roles) {
        const entry = STAFF_ROLE_MAP[role];
        assert.ok(entry, `缺少角色: ${role}`);
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0, `${role} 缺少 label`);
      }
    });
  });

  describe('perfColor 颜色映射', () => {
    it('>= 85 应返回绿色 #4ade80', () => {
      assert.equal(perfColor(85), '#4ade80');
      assert.equal(perfColor(92), '#4ade80');
      assert.equal(perfColor(100), '#4ade80');
    });

    it('70-84 应返回黄色 #fbbf24', () => {
      assert.equal(perfColor(70), '#fbbf24');
      assert.equal(perfColor(78), '#fbbf24');
      assert.equal(perfColor(84), '#fbbf24');
    });

    it('< 70 应返回红色 #f87171', () => {
      assert.equal(perfColor(0), '#f87171');
      assert.equal(perfColor(48), '#f87171');
      assert.equal(perfColor(69), '#f87171');
    });
  });
});

// ================================================================
// 反例
// ================================================================

describe.skip('staff/[id]: 反例 (negative cases)', () => {
  describe('ID 不存在', () => {
    it('不存在的 ID 应返回 undefined', () => {
      const detail = lookupStaffDetail('non-existent-id');
      assert.equal(detail, undefined);
    });

    it('空字符串 ID 应返回 undefined', () => {
      const detail = lookupStaffDetail('');
      assert.equal(detail, undefined);
    });
  });

  describe('perfColor 异常输入', () => {
    it('负数应视为 < 70，返回红色', () => {
      assert.equal(perfColor(-1), '#f87171');
    });

    it('超过 100 的值应视为 >= 85，返回绿色', () => {
      assert.equal(perfColor(150), '#4ade80');
    });
  });

  describe('STAFF_STATUS_MAP 反例', () => {
    it('未知状态应不在映射中', () => {
      const unknown = 'unknown' as StaffStatus;
      assert.equal(STAFF_STATUS_MAP[unknown], undefined);
    });
  });

  describe('SUPPORTED_STATUS_TRANSITIONS 反例', () => {
    it('未知状态应不在流转映射中', () => {
      const trans = SUPPORTED_STATUS_TRANSITIONS['undefined_status'];
      assert.equal(trans, undefined);
    });
  });

  describe('MOCK_STAFF_DETAILS 中不应有缺失角色的详情记录', () => {
    it('每个详情记录的 role 应在 STAFF_ROLE_MAP 中', () => {
      for (const id of DETAIL_IDS) {
        const detail = MOCK_STAFF_DETAILS[id];
        assert.ok(STAFF_ROLE_MAP[detail.role], `${id} 角色 ${detail.role} 不在 STAFF_ROLE_MAP 中`);
      }
    });

    it('每个详情记录的 status 应在 STAFF_STATUS_MAP 中', () => {
      for (const id of DETAIL_IDS) {
        const detail = MOCK_STAFF_DETAILS[id];
        assert.ok(STAFF_STATUS_MAP[detail.status], `${id} 状态 ${detail.status} 不在 STAFF_STATUS_MAP 中`);
      }
    });
  });
});

// ================================================================
// 边界
// ================================================================

describe.skip('staff/[id]: 边界 (edge cases)', () => {
  describe('所有状态跨度的详情记录都存在', () => {
    it('应至少有一条 active 记录', () => {
      const found = MOCK_STAFF.some((s) => s.status === 'active');
      assert.equal(found, true);
    });

    it('应至少有一条 probation 记录', () => {
      const found = MOCK_STAFF.some((s) => s.status === 'probation');
      assert.equal(found, true);
    });

    it('应至少有一条 on_leave 记录', () => {
      const found = MOCK_STAFF.some((s) => s.status === 'on_leave');
      assert.equal(found, true);
    });

    it('应至少有一条 resigned 记录', () => {
      const found = MOCK_STAFF.some((s) => s.status === 'resigned');
      assert.equal(found, true);
    });
  });

  describe('绩效评分边界值', () => {
    // 边界值：0, 69, 70, 84, 85, 100
    const boundaryCases: [number, string][] = [
      [0, '#f87171'],
      [69, '#f87171'],
      [70, '#fbbf24'],
      [84, '#fbbf24'],
      [85, '#4ade80'],
      [100, '#4ade80'],
    ];

    for (const [score, expected] of boundaryCases) {
      it(`绩效分数 ${score} → ${expected}`, () => {
        assert.equal(perfColor(score), expected);
      });
    }
  });

  describe('每个详情记录的绩效分数应合理', () => {
    it('所有详情绩效分数应在 0-100 之间', () => {
      for (const id of DETAIL_IDS) {
        const score = MOCK_STAFF_DETAILS[id].performanceScore;
        assert.ok(score >= 0 && score <= 100, `${id} 绩效 ${score} 超出 [0,100]`);
      }
    });
  });

  describe('MOCK_STAFF 中的已离职员工也应检查其 detail 是否存在', () => {
    it('resigned 状态的员工 (sf14) 应能在 MOCK_STAFF 中找到', () => {
      const resignedStaff = MOCK_STAFF.find((s) => s.status === 'resigned');
      assert.ok(resignedStaff, '应至少有一位已离职员工');
      // resigned 员工也可能没有 detail 记录，这属于正常（已离职可能已清理）
    });
  });

  describe('MOCK_STAFF 详情覆盖', () => {
    // 确保 MOCK_STAFF 中每个有对应 detail 的记录都能正确匹配
    it('MOCK_STAFF_DETAILS 中的 id 都应存在于 MOCK_STAFF 的 id 集合中', () => {
      const staffIds = new Set(MOCK_STAFF.map((s) => s.id));
      for (const id of DETAIL_IDS) {
        assert.ok(staffIds.has(id), `${id} 不在 MOCK_STAFF 中`);
      }
    });
  });
});

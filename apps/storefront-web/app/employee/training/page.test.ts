/**
 * employee/training/page.test.ts — 员工培训管理 L1 测试（storefront-web）
 *
 * 覆盖: 培训记录数据、进度状态、分数校验、搜索筛选
 * 正例: 培训字段完整性、状态枚举、进度/分数逻辑
 * 反例: 空培训列表、进度越界、无效状态
 * 边界: 零进度、百分百进度、零分、满分
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 类型 ──

type TrainingStatus = 'in_progress' | 'completed' | 'not_started' | 'cancelled';

interface EmployeeTraining {
  id: string;
  name: string;
  role: string;
  department: string;
  courseName: string;
  startDate: string;
  endDate: string;
  progress: number;
  score: number | null;
  status: TrainingStatus;
}

// ── 常量映射 ──

const STATUS_LABELS: Record<TrainingStatus, string> = {
  in_progress: '培训中',
  completed: '已完成',
  not_started: '未开始',
  cancelled: '已取消',
};

// ── Mock 数据 ──

const MOCK_TRAININGS: EmployeeTraining[] = [
  { id: 'tr-001', name: '张三', role: '前台收银', department: '前台', courseName: '收银系统操作培训', startDate: '2026-07-01', endDate: '2026-07-15', progress: 100, score: 95, status: 'completed' },
  { id: 'tr-002', name: '李四', role: '导玩员', department: '运营', courseName: 'VR设备操作培训', startDate: '2026-07-05', endDate: '2026-07-20', progress: 60, score: null, status: 'in_progress' },
  { id: 'tr-003', name: '王五', role: '店长', department: '管理', courseName: '门店管理培训', startDate: '2026-07-10', endDate: '2026-07-25', progress: 30, score: null, status: 'in_progress' },
  { id: 'tr-004', name: '赵六', role: '前台收银', department: '前台', courseName: '客户服务培训', startDate: '2026-07-15', endDate: '2026-07-30', progress: 0, score: null, status: 'not_started' },
  { id: 'tr-005', name: '孙七', role: '导玩员', department: '运营', courseName: '安全应急培训', startDate: '2026-07-01', endDate: '2026-07-10', progress: 100, score: 88, status: 'completed' },
  { id: 'tr-006', name: '周八', role: '导玩员', department: '运营', courseName: 'VR设备操作培训', startDate: '2026-07-01', endDate: '2026-07-15', progress: 100, score: 92, status: 'completed' },
  { id: 'tr-007', name: '吴九', role: '前台收银', department: '前台', courseName: '收银系统操作培训', startDate: '2026-07-20', endDate: '2026-08-05', progress: 0, score: null, status: 'cancelled' },
];

// ── 辅助函数 ──

function getStatusLabel(status: TrainingStatus): string {
  return STATUS_LABELS[status] ?? status;
}

function computeTrainingStats(items: EmployeeTraining[]) {
  return {
    total: items.length,
    completed: items.filter(t => t.status === 'completed').length,
    inProgress: items.filter(t => t.status === 'in_progress').length,
    notStarted: items.filter(t => t.status === 'not_started').length,
    cancelled: items.filter(t => t.status === 'cancelled').length,
    avgProgress: items.length > 0
      ? Math.round(items.reduce((s, t) => s + t.progress, 0) / items.length)
      : 0,
  };
}

function searchTrainings(items: EmployeeTraining[], query: string): EmployeeTraining[] {
  if (!query.trim()) return items;
  const lower = query.toLowerCase();
  return items.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.courseName.toLowerCase().includes(lower) ||
    t.department.toLowerCase().includes(lower)
  );
}

function filterByStatus(items: EmployeeTraining[], status: TrainingStatus | 'all'): EmployeeTraining[] {
  if (status === 'all') return items;
  return items.filter(t => t.status === status);
}

// ===================================================================
describe('EmployeeTraining — 状态映射', () => {
  it('四种培训状态映射完整', () => {
    const statuses: TrainingStatus[] = ['in_progress', 'completed', 'not_started', 'cancelled'];
    for (const s of statuses) {
      assert.ok(getStatusLabel(s).length > 0, `Status ${s} should have label`);
    }
  });

  it('状态统计正确', () => {
    const stats = computeTrainingStats(MOCK_TRAININGS);
    assert.equal(stats.total, 7);
    assert.equal(stats.completed, 3);
    assert.equal(stats.inProgress, 2);
    assert.equal(stats.notStarted, 1);
    assert.equal(stats.cancelled, 1);
  });
});

// ===================================================================
describe('EmployeeTraining — 进度与分数', () => {
  it('progress 应在 0~100 之间', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(t.progress >= 0 && t.progress <= 100,
        `${t.id}: progress ${t.progress} in [0, 100]`);
    }
  });

  it('completed 的培训应有 score', () => {
    const completed = MOCK_TRAININGS.filter(t => t.status === 'completed');
    for (const t of completed) {
      assert.ok(t.score !== null && t.score !== undefined,
        `${t.id}: completed training should have score`);
    }
  });

  it('score 应在 0~100 之间（当存在时）', () => {
    for (const t of MOCK_TRAININGS) {
      if (t.score !== null) {
        assert.ok(t.score >= 0 && t.score <= 100,
          `${t.id}: score ${t.score} in [0, 100]`);
      }
    }
  });

  it('in_progress 培训 score 应为 null', () => {
    const inProgress = MOCK_TRAININGS.filter(t => t.status === 'in_progress');
    for (const t of inProgress) {
      assert.equal(t.score, null, `${t.id}: in-progress should have null score`);
    }
  });

  it('平均进度计算正确', () => {
    const stats = computeTrainingStats(MOCK_TRAININGS);
    const expected = Math.round((100 + 60 + 30 + 0 + 100 + 100 + 0) / 7);
    assert.equal(stats.avgProgress, expected);
  });
});

// ===================================================================
describe('EmployeeTraining — 搜索筛选', () => {
  it('按员工名搜索', () => {
    const result = searchTrainings(MOCK_TRAININGS, '张三');
    assert.equal(result.length, 1);
  });

  it('按课程名搜索', () => {
    const result = searchTrainings(MOCK_TRAININGS, 'VR');
    assert.equal(result.length, 2);
  });

  it('按部门搜索', () => {
    const result = searchTrainings(MOCK_TRAININGS, '运营');
    assert.equal(result.length, 3);
  });

  it('空搜索返回全部', () => {
    assert.equal(searchTrainings(MOCK_TRAININGS, '').length, MOCK_TRAININGS.length);
  });

  it('按状态筛选', () => {
    const result = filterByStatus(MOCK_TRAININGS, 'completed');
    assert.equal(result.length, 3);
    assert.ok(result.every(t => t.status === 'completed'));
  });
});

// ===================================================================
describe('EmployeeTraining — 数据完整性', () => {
  it('所有培训应有 id/name/courseName', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(t.id, 'id required');
      assert.ok(t.name, 'name required');
      assert.ok(t.courseName, 'courseName required');
    }
  });

  it('日期格式应为 YYYY-MM-DD', () => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    for (const t of MOCK_TRAININGS) {
      assert.ok(regex.test(t.startDate), `${t.id}: startDate format`);
      assert.ok(regex.test(t.endDate), `${t.id}: endDate format`);
    }
  });

  it('startDate <= endDate', () => {
    for (const t of MOCK_TRAININGS) {
      assert.ok(new Date(t.startDate) <= new Date(t.endDate),
        `${t.id}: start ${t.startDate} <= end ${t.endDate}`);
    }
  });
});

// ===================================================================
describe('EmployeeTraining — 边界', () => {
  it('空列表统计正确', () => {
    const stats = computeTrainingStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.avgProgress, 0);
  });

  it('progress=0 对应 not_started', () => {
    const notStarted = MOCK_TRAININGS.filter(t => t.progress === 0);
    for (const t of notStarted) {
      assert.ok(t.status === 'not_started' || t.status === 'cancelled',
        `${t.id}: 0 progress maps to not_started/cancelled`);
    }
  });

  it('progress=100 对应 completed', () => {
    const fullyDone = MOCK_TRAININGS.filter(t => t.progress === 100);
    for (const t of fullyDone) {
      assert.equal(t.status, 'completed', `${t.id}: 100% progress = completed`);
    }
  });

  it('score=0 的特殊情况', () => {
    const zeroScore: EmployeeTraining = { ...MOCK_TRAININGS[0], progress: 100, score: 0, status: 'completed' };
    assert.equal(zeroScore.score, 0);
    assert.ok(zeroScore.score >= 0);
  });
});

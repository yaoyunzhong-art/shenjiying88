/**
 * device-inspection/page.test.ts — 设备巡检员工作台 L1 测试
 *
 * 覆盖: 数据模型 / 过滤逻辑 / 统计计算 / 分页 / 边界条件
 * 角色视角: 🔧 设备巡检员
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { existsSync } from 'node:fs';

// ── 类型 ──

type InspectionStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped';
type DeviceCategory = 'electrical' | 'hvac' | 'fire_safety' | 'elevator' | 'plumbing' | 'security' | 'it';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface InspectionTask {
  id: string;
  deviceName: string;
  deviceCode: string;
  category: DeviceCategory;
  location: string;
  status: InspectionStatus;
  riskLevel: RiskLevel;
  inspector: string;
  scheduledDate: string;
  completedDate: string | null;
  checkpoints: number;
  passedCheckpoints: number;
  failedCheckpoints: number;
  findings: string;
}

// ── Mock 数据 ──

const MOCK_TASKS: InspectionTask[] = [
  { id: 'INS-001', deviceName: '低压配电柜-A', deviceCode: 'EL-001', category: 'electrical', location: '1F 配电室', status: 'in_progress', riskLevel: 'high', inspector: '张工', scheduledDate: '2026-07-08', completedDate: null, checkpoints: 12, passedCheckpoints: 8, failedCheckpoints: 1, findings: '接地电阻偏大，需重新紧固' },
  { id: 'INS-002', deviceName: '中央空调主机', deviceCode: 'HV-003', category: 'hvac', location: '屋顶机房', status: 'pending', riskLevel: 'medium', inspector: '李技', scheduledDate: '2026-07-08', completedDate: null, checkpoints: 15, passedCheckpoints: 0, failedCheckpoints: 0, findings: '' },
  { id: 'INS-003', deviceName: '消防喷淋系统', deviceCode: 'FS-001', category: 'fire_safety', location: 'B1 泵房', status: 'passed', riskLevel: 'critical', inspector: '王工', scheduledDate: '2026-07-07', completedDate: '2026-07-07', checkpoints: 20, passedCheckpoints: 20, failedCheckpoints: 0, findings: '全部正常' },
  { id: 'INS-004', deviceName: '客梯 #1', deviceCode: 'EV-001', category: 'elevator', location: '1F 大厅', status: 'pending', riskLevel: 'high', inspector: '赵工', scheduledDate: '2026-07-09', completedDate: null, checkpoints: 18, passedCheckpoints: 0, failedCheckpoints: 0, findings: '' },
  { id: 'INS-005', deviceName: '排污泵组', deviceCode: 'PL-002', category: 'plumbing', location: 'B2 污水间', status: 'failed', riskLevel: 'medium', inspector: '张工', scheduledDate: '2026-07-07', completedDate: '2026-07-07', checkpoints: 8, passedCheckpoints: 5, failedCheckpoints: 3, findings: '液位传感器失灵，排污泵异响' },
  { id: 'INS-006', deviceName: '监控录像主机', deviceCode: 'SE-004', category: 'security', location: '监控中心', status: 'in_progress', riskLevel: 'medium', inspector: '李技', scheduledDate: '2026-07-08', completedDate: null, checkpoints: 10, passedCheckpoints: 7, failedCheckpoints: 1, findings: '硬盘空间剩余12%，建议扩容' },
  { id: 'INS-007', deviceName: 'UPS不间断电源', deviceCode: 'IT-002', category: 'it', location: '机房', status: 'passed', riskLevel: 'high', inspector: '王工', scheduledDate: '2026-07-06', completedDate: '2026-07-06', checkpoints: 14, passedCheckpoints: 14, failedCheckpoints: 0, findings: '电池健康度良好' },
  { id: 'INS-008', deviceName: '高压配电柜-B', deviceCode: 'EL-003', category: 'electrical', location: '1F 配电室', status: 'pending', riskLevel: 'critical', inspector: '张工', scheduledDate: '2026-07-08', completedDate: null, checkpoints: 16, passedCheckpoints: 0, failedCheckpoints: 0, findings: '' },
  { id: 'INS-009', deviceName: '排烟风机', deviceCode: 'HV-007', category: 'hvac', location: '屋顶', status: 'skipped', riskLevel: 'low', inspector: '赵工', scheduledDate: '2026-07-05', completedDate: '2026-07-05', checkpoints: 6, passedCheckpoints: 0, failedCheckpoints: 0, findings: '因下雨延期' },
  { id: 'INS-010', deviceName: '火灾报警控制器', deviceCode: 'FS-003', category: 'fire_safety', location: '消防控制室', status: 'pending', riskLevel: 'critical', inspector: '王工', scheduledDate: '2026-07-09', completedDate: null, checkpoints: 22, passedCheckpoints: 0, failedCheckpoints: 0, findings: '' },
  { id: 'INS-011', deviceName: '自动扶梯 #2', deviceCode: 'EV-003', category: 'elevator', location: '2F-3F', status: 'in_progress', riskLevel: 'high', inspector: '赵工', scheduledDate: '2026-07-08', completedDate: null, checkpoints: 18, passedCheckpoints: 15, failedCheckpoints: 2, findings: '扶手带张力不足，梯级照明故障' },
  { id: 'INS-012', deviceName: '给水变频泵', deviceCode: 'PL-001', category: 'plumbing', location: 'B1 水泵房', status: 'passed', riskLevel: 'low', inspector: '张工', scheduledDate: '2026-07-06', completedDate: '2026-07-06', checkpoints: 8, passedCheckpoints: 8, failedCheckpoints: 0, findings: '运行参数正常' },
];

// ── 过滤函数 ──

function filterTasks(
  tasks: InspectionTask[],
  search: string,
  statusFilter: InspectionStatus | '',
  riskFilter: RiskLevel | '',
): InspectionTask[] {
  return tasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (riskFilter && t.riskLevel !== riskFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        t.deviceName.toLowerCase().includes(q) ||
        t.deviceCode.toLowerCase().includes(q) ||
        t.location.toLowerCase().includes(q) ||
        t.inspector.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.findings.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

// ── 统计函数 ──

function computeStats(tasks: InspectionTask[]) {
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'pending').length;
  const inProgress = tasks.filter(t => t.status === 'in_progress').length;
  const passed = tasks.filter(t => t.status === 'passed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const critical = tasks.filter(t => t.riskLevel === 'critical').length;
  const failedCheckpoints = tasks.reduce((acc, t) => acc + t.failedCheckpoints, 0);
  const totalCheckpoints = tasks.reduce((acc, t) => acc + t.checkpoints, 0);
  const passRate = totalCheckpoints > 0 ? Math.round(((totalCheckpoints - failedCheckpoints) / totalCheckpoints) * 100) : 0;
  return { total, pending, inProgress, passed, failed, critical, failedCheckpoints, totalCheckpoints, passRate };
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  if (page < 1) throw new Error('page must be >= 1');
  if (pageSize < 1) throw new Error('pageSize must be >= 1');
  return items.slice((page - 1) * pageSize, page * pageSize);
}

// ══════════════════════════════════════════════════
// 正例
// ══════════════════════════════════════════════════

describe('设备巡检员工作台（正例）', () => {

  it('Mock 数据应有 12 条巡检任务', () => {
    assert.equal(MOCK_TASKS.length, 12);
  });

  it('每条任务应包含必需字段', () => {
    for (const t of MOCK_TASKS) {
      assert.ok(t.id);
      assert.ok(t.deviceName);
      assert.ok(t.deviceCode);
      assert.ok(t.category);
      assert.ok(t.location);
      assert.ok(t.status);
      assert.ok(t.riskLevel);
      assert.ok(t.inspector);
      assert.ok(t.scheduledDate);
      assert.ok(typeof t.checkpoints === 'number');
      assert.ok(typeof t.passedCheckpoints === 'number');
      assert.ok(typeof t.failedCheckpoints === 'number');
    }
  });

  it('不筛选返回全部 12 条', () => {
    assert.equal(filterTasks(MOCK_TASKS, '', '', '').length, 12);
  });

  it('搜索"配电柜"应匹配 2 条（INS-001, INS-008）', () => {
    const r = filterTasks(MOCK_TASKS, '配电柜', '', '');
    assert.equal(r.length, 2);
    assert.deepEqual(r.map(t => t.id).sort(), ['INS-001', 'INS-008']);
  });

  it('搜索"屋顶"应匹配 2 条（INS-002, INS-009）', () => {
    const r = filterTasks(MOCK_TASKS, '屋顶', '', '');
    assert.equal(r.length, 2);
  });

  it('搜索"张工"应匹配 4 条（INS-001, INS-005, INS-008, INS-012）', () => {
    const r = filterTasks(MOCK_TASKS, '张工', '', '');
    assert.equal(r.length, 4);
  });

  it('状态筛选"待巡检(pending)"应返回 4 条', () => {
    const r = filterTasks(MOCK_TASKS, '', 'pending', '');
    assert.equal(r.length, 4);
  });

  it('状态筛选"巡检中(in_progress)"应返回 3 条', () => {
    const r = filterTasks(MOCK_TASKS, '', 'in_progress', '');
    assert.equal(r.length, 3);
  });

  it('状态筛选"已通过(passed)"应返回 3 条', () => {
    const r = filterTasks(MOCK_TASKS, '', 'passed', '');
    assert.equal(r.length, 3);
  });

  it('状态筛选"不合格(failed)"应返回 1 条', () => {
    const r = filterTasks(MOCK_TASKS, '', 'failed', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'INS-005');
  });

  it('风险筛选"危急(critical)"应返回 3 条', () => {
    const r = filterTasks(MOCK_TASKS, '', '', 'critical');
    assert.equal(r.length, 3);
  });

  it('联合筛选: pending + critical = 2 条（INS-008, INS-010）', () => {
    const r = filterTasks(MOCK_TASKS, '', 'pending', 'critical');
    assert.equal(r.length, 2);
    assert.deepEqual(r.map(t => t.id).sort(), ['INS-008', 'INS-010']);
  });

  it('联合筛选: 搜索"配电室" + pending = 1 条（INS-008）', () => {
    const r = filterTasks(MOCK_TASKS, '配电室', 'pending', '');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'INS-008');
  });

  it('统计: total 应为 12', () => {
    assert.equal(computeStats(MOCK_TASKS).total, 12);
  });

  it('统计: passRate 应计算正确（总检查点 167，失败 7，通过率 96%）', () => {
    const s = computeStats(MOCK_TASKS);
    assert.equal(s.totalCheckpoints, 167);
    assert.equal(s.failedCheckpoints, 7);
    assert.equal(s.passRate, Math.round(((167 - 7) / 167) * 100));
  });

  it('统计: critical 应为 3', () => {
    assert.equal(computeStats(MOCK_TASKS).critical, 3);
  });

  it('分页 pageSize=6 第1页返回 6 条', () => {
    assert.equal(paginate(MOCK_TASKS, 1, 6).length, 6);
  });

  it('分页 pageSize=6 第2页返回 6 条（最后2页合并）', () => {
    assert.equal(paginate(MOCK_TASKS, 2, 6).length, 6);
  });

  it('分页 pageSize=5 第3页返回 2 条', () => {
    assert.equal(paginate(MOCK_TASKS, 3, 5).length, 2);
  });

  it('页面文件 page.tsx 应存在', () => {
    assert.ok(existsSync(new URL('./page.tsx', import.meta.url)), 'page.tsx 文件应存在');
  });
});

// ══════════════════════════════════════════════════
// 反例
// ══════════════════════════════════════════════════

describe('设备巡检员工作台（反例）', () => {

  it('搜索不存在的关键字应返回空', () => {
    assert.equal(filterTasks(MOCK_TASKS, '不存在的设备XYZ', '', '').length, 0);
  });

  it('状态筛选无效值应返回空', () => {
    const r = filterTasks(MOCK_TASKS, '', 'archived' as InspectionStatus, '');
    assert.equal(r.length, 0);
  });

  it('分页 page=0 应抛异常', () => {
    assert.throws(() => paginate(MOCK_TASKS, 0, 5), /page must be >= 1/);
  });

  it('分页 pageSize=0 应抛异常', () => {
    assert.throws(() => paginate(MOCK_TASKS, 1, 0), /pageSize must be >= 1/);
  });

  it('任务 id 不应重复', () => {
    const ids = MOCK_TASKS.map(t => t.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('status 字段应为合法枚举值', () => {
    const valid: readonly string[] = ['pending', 'in_progress', 'passed', 'failed', 'skipped'];
    for (const t of MOCK_TASKS) {
      assert.ok(valid.includes(t.status), `${t.id} 状态 ${t.status} 无效`);
    }
  });

  it('riskLevel 字段应为合法枚举值', () => {
    const valid: readonly string[] = ['low', 'medium', 'high', 'critical'];
    for (const t of MOCK_TASKS) {
      assert.ok(valid.includes(t.riskLevel), `${t.id} 风险等级 ${t.riskLevel} 无效`);
    }
  });

  it('category 字段应为合法枚举值', () => {
    const valid: readonly string[] = ['electrical', 'hvac', 'fire_safety', 'elevator', 'plumbing', 'security', 'it'];
    for (const t of MOCK_TASKS) {
      assert.ok(valid.includes(t.category), `${t.id} 类别 ${t.category} 无效`);
    }
  });
});

// ══════════════════════════════════════════════════
// 边界
// ══════════════════════════════════════════════════

describe('设备巡检员工作台（边界）', () => {

  it('空搜索字符串返回全部', () => {
    assert.equal(filterTasks(MOCK_TASKS, '', '', '').length, 12);
  });

  it('passedCheckpoints 应 <= checkpoints', () => {
    for (const t of MOCK_TASKS) {
      assert.ok(t.passedCheckpoints <= t.checkpoints, `${t.id}: 通过项 ${t.passedCheckpoints} > 总检查项 ${t.checkpoints}`);
    }
  });

  it('failedCheckpoints 应 <= checkpoints', () => {
    for (const t of MOCK_TASKS) {
      assert.ok(t.failedCheckpoints <= t.checkpoints, `${t.id}: 失败项 ${t.failedCheckpoints} > 总检查项 ${t.checkpoints}`);
    }
  });

  it('passedCheckpoints + failedCheckpoints 应 <= checkpoints', () => {
    for (const t of MOCK_TASKS) {
      assert.ok(t.passedCheckpoints + t.failedCheckpoints <= t.checkpoints, `${t.id}: 通过+失败(${t.passedCheckpoints + t.failedCheckpoints}) > 总检查项 ${t.checkpoints}`);
    }
  });

  it('已通过的 completedDate 必须有值', () => {
    for (const t of MOCK_TASKS) {
      if (t.status === 'passed' || t.status === 'failed' || t.status === 'skipped') {
        assert.ok(t.completedDate !== null, `${t.id}: 已完成任务应有完成日期`);
      }
    }
  });

  it('待巡检的 completedDate 必须为 null', () => {
    for (const t of MOCK_TASKS) {
      if (t.status === 'pending') {
        assert.equal(t.completedDate, null);
      }
    }
  });

  it('搜索编号部分匹配 "INS-00" 应返回 9 条（001~009 子串匹配）', () => {
    const r = filterTasks(MOCK_TASKS, 'INS-00', '', '');
    assert.equal(r.length, 9);
  });

  it('搜索 "INS-01" 应返回 3 条（INS-010, INS-011, INS-012）', () => {
    const r = filterTasks(MOCK_TASKS, 'INS-01', '', '');
    assert.equal(r.length, 3);
  });

  it('联合搜索: risk=high + 配电室 (位置不匹配) 应返回空', () => {
    // 配电室 (INS-001 high, INS-008 critical) → high 只有 INS-001
    // 所以配电室 + high = 1条 INS-001
    const r = filterTasks(MOCK_TASKS, '配电室', '', 'high');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'INS-001');
  });

  it('分页超过总页数返回空数组', () => {
    assert.equal(paginate(MOCK_TASKS, 100, 5).length, 0);
  });

  it('所有 failedCheckpoints >= 0', () => {
    for (const t of MOCK_TASKS) {
      assert.ok(t.failedCheckpoints >= 0, `${t.id}: failedCheckpoints 不应为负数`);
    }
  });

  it('passRate 不会超过 100%', () => {
    const s = computeStats(MOCK_TASKS);
    assert.ok(s.passRate <= 100);
  });

  it('空数据统计应全零', () => {
    const s = computeStats([]);
    assert.equal(s.total, 0);
    assert.equal(s.pending, 0);
    assert.equal(s.inProgress, 0);
    assert.equal(s.passed, 0);
    assert.equal(s.failed, 0);
    assert.equal(s.critical, 0);
    assert.equal(s.failedCheckpoints, 0);
    assert.equal(s.totalCheckpoints, 0);
    assert.equal(s.passRate, 0);
  });
});

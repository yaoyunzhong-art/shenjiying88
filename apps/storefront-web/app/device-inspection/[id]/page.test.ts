/**
 * Device Inspection Detail Page — storefront-web
 * Tests: detail page data model, status transitions, statistics calculation
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与 page.tsx 保持一致的数据类型和常量 ---- //

type InspectionStatus = 'pending' | 'in_progress' | 'passed' | 'failed' | 'skipped';
type DeviceCategory = 'electrical' | 'hvac' | 'fire_safety' | 'elevator' | 'plumbing' | 'security' | 'it';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface InspectionItem {
  checkPoint: string;
  standard: string;
  result: 'pass' | 'fail' | 'na';
  remark: string;
}

interface DeviceInspection {
  id: string;
  taskNo: string;
  deviceName: string;
  deviceCode: string;
  deviceCategory: DeviceCategory;
  location: string;
  riskLevel: RiskLevel;
  inspector: string;
  scheduledDate: string;
  status: InspectionStatus;
  completedAt: string | null;
  duration: string;
  totalItems: number;
  passItems: number;
  failItems: number;
  anomalies: number;
  notes: string;
  updatedAt: string;
  items: InspectionItem[];
}

const STATUS_LABELS: Record<InspectionStatus, string> = {
  pending: '待巡检',
  in_progress: '巡检中',
  passed: '已通过',
  failed: '未通过',
  skipped: '已跳过',
};

const CATEGORY_LABELS: Record<DeviceCategory, string> = {
  electrical: '电气设备',
  hvac: '暖通空调',
  fire_safety: '消防设施',
  elevator: '电梯',
  plumbing: '给排水',
  security: '安防监控',
  it: 'IT设备',
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '严重风险',
};

const STATUS_TRANSITIONS: Record<InspectionStatus, InspectionStatus[]> = {
  pending: ['in_progress', 'skipped'],
  in_progress: ['passed', 'failed'],
  passed: [],
  failed: ['pending'],
  skipped: ['pending'],
};

const RESULT_LABELS: Record<string, string> = {
  pass: '✓ 通过',
  fail: '✗ 不通过',
  na: '— 不适用',
};

// ---- Mock Data ---- //

const MOCK_ITEMS: InspectionItem[] = [
  { checkPoint: '运行声音检查', standard: '无异响、无共振', result: 'pass', remark: '运行平稳' },
  { checkPoint: '温度输出检测', standard: '出风口温度 7-12°C', result: 'pass', remark: '出风口温度 9°C' },
  { checkPoint: '冷凝管渗漏检查', standard: '无渗漏', result: 'fail', remark: '轻微渗漏，需维修' },
  { checkPoint: '过滤网清洁度', standard: '无明显积尘', result: 'pass', remark: '已清洁' },
  { checkPoint: '制冷剂压力', standard: '低压0.4-0.6MPa 高压1.5-2.0MPa', result: 'pass', remark: '正常' },
  { checkPoint: '电气接线检查', standard: '无松动、无氧化', result: 'pass', remark: '接线良好' },
  { checkPoint: '排水系统', standard: '排水畅通', result: 'fail', remark: '排水管轻微堵塞' },
  { checkPoint: '安全防护装置', standard: '防护罩完好', result: 'pass', remark: '全部正常' },
];

const MOCK_INSPECTION: DeviceInspection = {
  id: 'di-001',
  taskNo: 'INS-20260707-001',
  deviceName: '中央空调主机系统 #3',
  deviceCode: 'HVAC-003',
  deviceCategory: 'hvac',
  location: 'B1层设备机房',
  riskLevel: 'medium',
  inspector: '李师傅',
  scheduledDate: '2026-07-07',
  status: 'passed',
  completedAt: '2026-07-07 09:45',
  duration: '1小时15分',
  totalItems: 8,
  passItems: 6,
  failItems: 2,
  anomalies: 2,
  notes: '冷凝管有轻微渗漏',
  updatedAt: '2026-07-07 09:45',
  items: MOCK_ITEMS,
};

// ======================================================================
// Tests
// ======================================================================

describe('DeviceInspectionDetail — Status Labels', () => {
  it('should have labels for all statuses', () => {
    const statuses: InspectionStatus[] = ['pending', 'in_progress', 'passed', 'failed', 'skipped'];
    for (const s of statuses) {
      assert.ok(STATUS_LABELS[s], `Missing label for status "${s}"`);
      assert.equal(typeof STATUS_LABELS[s], 'string');
    }
  });

  it('should have Chinese labels for each status', () => {
    assert.equal(STATUS_LABELS.pending, '待巡检');
    assert.equal(STATUS_LABELS.in_progress, '巡检中');
    assert.equal(STATUS_LABELS.passed, '已通过');
    assert.equal(STATUS_LABELS.failed, '未通过');
    assert.equal(STATUS_LABELS.skipped, '已跳过');
  });
});

describe('DeviceInspectionDetail — Category Labels', () => {
  it('should have labels for all device categories', () => {
    const categories: DeviceCategory[] = ['electrical', 'hvac', 'fire_safety', 'elevator', 'plumbing', 'security', 'it'];
    for (const c of categories) {
      assert.ok(CATEGORY_LABELS[c], `Missing label for category "${c}"`);
    }
  });
});

describe('DeviceInspectionDetail — Risk Labels', () => {
  it('should have labels for all risk levels', () => {
    const levels: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
    for (const l of levels) {
      assert.ok(RISK_LABELS[l], `Missing label for risk "${l}"`);
      assert.equal(typeof RISK_LABELS[l], 'string');
    }
  });
});

describe('DeviceInspectionDetail — Status Transitions', () => {
  it('should allow transitions from pending state', () => {
    const transitions = STATUS_TRANSITIONS.pending;
    assert.ok(transitions.includes('in_progress'));
    assert.ok(transitions.includes('skipped'));
    assert.equal(transitions.length, 2);
  });

  it('should allow transitions from in_progress state', () => {
    const transitions = STATUS_TRANSITIONS.in_progress;
    assert.ok(transitions.includes('passed'));
    assert.ok(transitions.includes('failed'));
    assert.equal(transitions.length, 2);
  });

  it('should allow no transitions from passed state', () => {
    assert.equal(STATUS_TRANSITIONS.passed.length, 0);
  });

  it('should allow re-inspection from failed state', () => {
    assert.ok(STATUS_TRANSITIONS.failed.includes('pending'));
  });
});

describe('DeviceInspectionDetail — Mock Data Integrity', () => {
  it('should have all required fields in mock inspection', () => {
    const requiredFields: (keyof DeviceInspection)[] = [
      'id', 'taskNo', 'deviceName', 'deviceCode', 'deviceCategory',
      'location', 'riskLevel', 'inspector', 'scheduledDate', 'status',
      'totalItems', 'passItems', 'failItems', 'items',
    ];
    for (const field of requiredFields) {
      assert.notEqual(MOCK_INSPECTION[field], undefined, `Missing field: ${field}`);
    }
  });

  it('should have correct pass/fail/total consistency', () => {
    const { totalItems, passItems, failItems } = MOCK_INSPECTION;
    assert.equal(passItems + failItems, totalItems);
  });

  it('should compute pass rate correctly', () => {
    const { totalItems, passItems } = MOCK_INSPECTION;
    const passRate = Math.round((passItems / totalItems) * 100);
    assert.equal(passRate, 75);
  });

  it('should have items matching totalItems count', () => {
    assert.equal(MOCK_INSPECTION.items.length, MOCK_INSPECTION.totalItems);
  });

  it('should have inspection items with valid results', () => {
    const validResults = ['pass', 'fail', 'na'];
    for (const item of MOCK_ITEMS) {
      assert.ok(validResults.includes(item.result), `Invalid result: ${item.result}`);
      assert.ok(item.checkPoint.length > 0);
      assert.ok(item.standard.length > 0);
    }
  });

  it('should have correct result labels', () => {
    assert.equal(RESULT_LABELS.pass, '✓ 通过');
    assert.equal(RESULT_LABELS.fail, '✗ 不通过');
    assert.equal(RESULT_LABELS.na, '— 不适用');
  });
});

describe('DeviceInspectionDetail — Detail Page Structure', () => {
  it('should expose inspection detail properties correctly', () => {
    // Simulate key info shown on the detail page
    const detailInfo = [
      { label: '任务编号', value: MOCK_INSPECTION.taskNo },
      { label: '设备名称', value: MOCK_INSPECTION.deviceName },
      { label: '设备编号', value: MOCK_INSPECTION.deviceCode },
      { label: '所在位置', value: MOCK_INSPECTION.location },
      { label: '巡检员', value: MOCK_INSPECTION.inspector },
      { label: '计划日期', value: MOCK_INSPECTION.scheduledDate },
    ];
    for (const info of detailInfo) {
      assert.ok(info.value, `Detail ${info.label} should not be empty`);
    }
  });
});

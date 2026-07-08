/**
 * 设备巡检员工作台 — Device Inspector Dashboard (Next.js App Router Page)
 * 角色视角: 🔧 设备巡检员 / 🎯 运营专员
 * 功能: 巡检任务分配、设备检查清单、巡检记录、异常上报
 */
'use client';

import React, { useMemo, useState } from 'react';
import {
  PageShell,
  StatCard,
  DataTable,
  StatusBadge,
  Button,
  Pagination,
  usePagination,
  EmptyState,
  SearchFilterInput,
  type DataTableColumn,
} from '@m5/ui';

// ---- 类型定义 ----

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

// ---- Mock 数据 ----

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

// ---- 枚举映射 ----

const STATUS_CONFIG: Record<InspectionStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'error' | 'default' }> = {
  pending: { label: '待巡检', variant: 'warning' },
  in_progress: { label: '巡检中', variant: 'info' },
  passed: { label: '已通过', variant: 'success' },
  failed: { label: '不合格', variant: 'error' },
  skipped: { label: '已跳过', variant: 'default' },
};

const CATEGORY_LABEL: Record<DeviceCategory, string> = {
  electrical: '电气',
  hvac: '暖通',
  fire_safety: '消防',
  elevator: '电梯',
  plumbing: '给排水',
  security: '安防',
  it: 'IT设备',
};

const RISK_LABEL: Record<RiskLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '危急',
};

const RISK_COLOR: Record<RiskLevel, string> = {
  low: '#909399',
  medium: '#E6A23C',
  high: '#F56C6C',
  critical: '#C41D7F',
};

// ---- 过滤逻辑 ----

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

// ---- 统计数据 ----

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

// ---- 表格列 ----

const COLUMNS: DataTableColumn<InspectionTask>[] = [
  { key: 'id', header: '编号', sortable: true },
  { key: 'deviceName', header: '设备名称', sortable: true },
  { key: 'deviceCode', header: '设备编号', sortable: true },
  {
    key: 'category',
    header: '类别',
    render: (row: InspectionTask) => CATEGORY_LABEL[row.category],
    sortable: true,
  },
  { key: 'location', header: '位置', sortable: true },
  {
    key: 'status',
    header: '状态',
    render: (row: InspectionTask) => {
      const cfg = STATUS_CONFIG[row.status];
      return <StatusBadge variant={cfg.variant} label={cfg.label} />;
    },
    sortable: true,
  },
  {
    key: 'riskLevel',
    header: '风险',
    render: (row: InspectionTask) => (
      <span style={{ color: RISK_COLOR[row.riskLevel], fontWeight: 600 }}>{RISK_LABEL[row.riskLevel]}</span>
    ),
    sortable: true,
  },
  { key: 'inspector', header: '巡检人', sortable: true },
  {
    key: 'checkpoints',
    header: '检查项',
    render: (row: InspectionTask) => {
      if (row.status === 'pending') return `${row.checkpoints}项`;
      return `${row.passedCheckpoints}/${row.checkpoints}`;
    },
  },
  { key: 'scheduledDate', header: '计划日期', sortable: true },
];

// ---- 页面组件 ----

export default function DeviceInspectionPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | ''>('');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | ''>('');

  const filtered = useMemo(
    () => filterTasks(MOCK_TASKS, search, statusFilter, riskFilter),
    [search, statusFilter, riskFilter],
  );

  const stats = useMemo(() => computeStats(MOCK_TASKS), []);

  const { page, setPage, pageSize, setPageSize, totalPages } = usePagination(filtered.length, 6);

  const paged = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page, pageSize],
  );

  return (
    <PageShell title="设备巡检工作台" subtitle="🔧 设备巡检员 · 查看和管理各设备巡检任务与检查记录">
      {/* 统计卡片 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="总巡检" value={stats.total} />
        <StatCard label="待巡检" value={stats.pending} variant="warning" />
        <StatCard label="巡检中" value={stats.inProgress} variant="info" />
        <StatCard label="已通过" value={stats.passed} variant="success" />
        <StatCard label="不合格" value={stats.failed} variant="error" />
        <StatCard label="危急设备" value={stats.critical} accent="#C41D7F" />
        <StatCard label="检查项通过率" value={`${stats.passRate}%`} />
      </div>

      {/* 过滤区域 */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <SearchFilterInput
          value={search}
          onChange={setSearch}
          placeholder="搜索设备/位置/巡检人编号…"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value as InspectionStatus | ''); setPage(1); }}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #DCDFE6' }}
          data-testid="status-filter"
        >
          <option value="">全部状态</option>
          <option value="pending">待巡检</option>
          <option value="in_progress">巡检中</option>
          <option value="passed">已通过</option>
          <option value="failed">不合格</option>
          <option value="skipped">已跳过</option>
        </select>
        <select
          value={riskFilter}
          onChange={e => { setRiskFilter(e.target.value as RiskLevel | ''); setPage(1); }}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #DCDFE6' }}
          data-testid="risk-filter"
        >
          <option value="">全部风险</option>
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
          <option value="critical">危急</option>
        </select>
        <Button variant="primary">+ 创建巡检任务</Button>
        <Button variant="secondary">导出报告</Button>
      </div>

      {/* 表格 */}
      {paged.length === 0 ? (
        <EmptyState title="暂无匹配巡检任务" description="尝试调整搜索条件或筛选条件" />
      ) : (
        <>
          <DataTable columns={COLUMNS} rows={paged} rowKey={(r: InspectionTask) => r.id} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <Pagination
              page={page}
              total={filtered.length}
              totalPages={totalPages}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={v => { setPageSize(v); setPage(1); }}
              pageSizeOptions={[6, 12, 24]}
            />
          </div>
        </>
      )}
    </PageShell>
  );
}

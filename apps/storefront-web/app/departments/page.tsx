/**
 * 部门管理 — Departments Page (storefront-web)
 * 角色视角: 👔店长 / 运营主管
 * 功能: 部门列表、成员统计、预算分析、部门绩效、搜索筛选
 */
'use client';

import React, { useState, useMemo } from 'react';

/* ── Types ── */
type DepartmentStatus = 'active' | 'on_leave' | 'vacant';

interface DepartmentMember {
  id: string;
  name: string;
  role: string;
  status: DepartmentStatus;
  performance: number;
}

interface Department {
  id: string;
  name: string;
  head: string;
  memberCount: number;
  budget: number;
  usedBudget: number;
  status: 'normal' | 'over_budget' | 'understaffed';
  members: DepartmentMember[];
  monthlyTarget: number;
  achievedTarget: number;
  createdAt: string;
  description: string;
}

/* ── Mock Data ── */
const DEPARTMENTS: Department[] = [
  {
    id: 'dept-001', name: '门店运营部', head: '张明', memberCount: 8,
    budget: 500000, usedBudget: 320000, status: 'normal',
    monthlyTarget: 200000, achievedTarget: 182500,
    createdAt: '2024-01-01', description: '门店日常运营管理',
    members: [
      { id: 's1', name: '张明', role: '运营主管', status: 'active', performance: 92 },
      { id: 's2', name: '李华', role: '运营专员', status: 'active', performance: 85 },
      { id: 's3', name: '王芳', role: '运营专员', status: 'on_leave', performance: 78 },
    ],
  },
  {
    id: 'dept-002', name: '销售部', head: '赵强', memberCount: 12,
    budget: 300000, usedBudget: 285000, status: 'over_budget',
    monthlyTarget: 500000, achievedTarget: 468000,
    createdAt: '2024-01-01', description: '门店销售与客户拓展',
    members: [
      { id: 's4', name: '赵强', role: '销售经理', status: 'active', performance: 95 },
      { id: 's5', name: '刘洋', role: '导购员', status: 'active', performance: 88 },
      { id: 's6', name: '陈静', role: '导购员', status: 'active', performance: 82 },
      { id: 's7', name: '杨磊', role: '导购员', status: 'vacant', performance: 0 },
    ],
  },
  {
    id: 'dept-003', name: '技术维护部', head: '周杰', memberCount: 5,
    budget: 200000, usedBudget: 95000, status: 'normal',
    monthlyTarget: 80000, achievedTarget: 82000,
    createdAt: '2024-03-01', description: '设备维护与技术保障',
    members: [
      { id: 's8', name: '周杰', role: '技术主管', status: 'active', performance: 97 },
      { id: 's9', name: '吴敏', role: '技术员', status: 'on_leave', performance: 72 },
      { id: 's10', name: '徐浩', role: '技术员', status: 'active', performance: 90 },
    ],
  },
  {
    id: 'dept-004', name: '后勤保障部', head: '黄丽', memberCount: 6,
    budget: 150000, usedBudget: 120000, status: 'normal',
    monthlyTarget: 60000, achievedTarget: 58000,
    createdAt: '2024-01-15', description: '仓储物流与后勤支持',
    members: [
      { id: 's11', name: '黄丽', role: '后勤主管', status: 'active', performance: 89 },
      { id: 's12', name: '孙悦', role: '仓管员', status: 'active', performance: 76 },
    ],
  },
  {
    id: 'dept-005', name: '客户服务部', head: '马超', memberCount: 4,
    budget: 120000, usedBudget: 130000, status: 'over_budget',
    monthlyTarget: 50000, achievedTarget: 52500,
    createdAt: '2024-06-01', description: '客户咨询与投诉处理',
    members: [
      { id: 's13', name: '马超', role: '客服主管', status: 'active', performance: 93 },
      { id: 's14', name: '朱婷', role: '客服专员', status: 'vacant', performance: 0 },
    ],
  },
  {
    id: 'dept-006', name: '营销策划部', head: '胡伟', memberCount: 3,
    budget: 350000, usedBudget: 180000, status: 'normal',
    monthlyTarget: 150000, achievedTarget: 142000,
    createdAt: '2025-01-01', description: '活动策划与品牌推广',
    members: [
      { id: 's15', name: '胡伟', role: '营销主管', status: 'active', performance: 91 },
      { id: 's16', name: '郭雪', role: '策划专员', status: 'active', performance: 84 },
    ],
  },
];

const DEPARTMENT_STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  over_budget: '超预算',
  understaffed: '缺编',
};

const DEPARTMENT_STATUS_COLORS: Record<string, string> = {
  normal: '#34d399',
  over_budget: '#f87171',
  understaffed: '#fbbf24',
};

/* ── Helpers ── */
function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN')}`;
}

function MemberStatusBadge({ status }: { status: DepartmentStatus }) {
  const colors: Record<DepartmentStatus, string> = {
    active: '#34d399',
    on_leave: '#fbbf24',
    vacant: '#94a3b8',
  };
  const labels: Record<DepartmentStatus, string> = {
    active: '在岗',
    on_leave: '请假',
    vacant: '空缺',
  };
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 4, fontSize: 11,
      color: colors[status], border: `1px solid ${colors[status]}40`,
      background: `${colors[status]}15`,
    }}>
      {labels[status]}
    </span>
  );
}

/* ── 主组件 ── */
export default function DepartmentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase();
    return DEPARTMENTS.filter(d => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (kw && !d.name.toLowerCase().includes(kw) && !d.head.toLowerCase().includes(kw) && !d.description.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [search, statusFilter]);

  const stats = useMemo(() => {
    const total = DEPARTMENTS.length;
    const totalMembers = DEPARTMENTS.reduce((s, d) => s + d.memberCount, 0);
    const totalBudget = DEPARTMENTS.reduce((s, d) => s + d.budget, 0);
    const totalUsed = DEPARTMENTS.reduce((s, d) => s + d.usedBudget, 0);
    const totalTarget = DEPARTMENTS.reduce((s, d) => s + d.monthlyTarget, 0);
    const totalAchieved = DEPARTMENTS.reduce((s, d) => s + d.achievedTarget, 0);
    const overBudget = DEPARTMENTS.filter(d => d.status === 'over_budget').length;
    return { total, totalMembers, totalBudget, totalUsed, totalTarget, totalAchieved, overBudget };
  }, []);

  return (
    <main style={{ minHeight: '100vh', padding: '24px 32px', background: '#0f172a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* 标题 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>📋 部门管理</h1>
            <p style={{ fontSize: 14, color: '#64748b', margin: '4px 0 0' }}>
              {stats.total} 个部门 · {stats.totalMembers} 名成员 · {stats.overBudget} 个超预算
            </p>
          </div>
        </div>

        {/* 核心指标 */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14, marginBottom: 24,
        }}>
          <div style={{
            padding: '14px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>月度目标达成率</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#34d399' }}>
              {stats.totalTarget > 0 ? `${((stats.totalAchieved / stats.totalTarget) * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div style={{
            padding: '14px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>总预算</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa' }}>{formatCurrency(stats.totalBudget)}</div>
          </div>
          <div style={{
            padding: '14px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>预算使用率</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: stats.totalBudget > 0 && (stats.totalUsed / stats.totalBudget) > 0.8 ? '#fbbf24' : '#e2e8f0' }}>
              {stats.totalBudget > 0 ? `${((stats.totalUsed / stats.totalBudget) * 100).toFixed(1)}%` : 'N/A'}
            </div>
          </div>
          <div style={{
            padding: '14px 18px', borderRadius: 12,
            background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.12)',
          }}>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>平均部门人数</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#a78bfa' }}>
              {stats.total > 0 ? (stats.totalMembers / stats.total).toFixed(1) : '0'}
            </div>
          </div>
        </div>

        {/* 搜索与筛选 */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="🔍 搜索部门名称、负责人..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, minWidth: 200, padding: '10px 14px', borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0', fontSize: 14, outline: 'none',
            }}
          />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.15)',
              color: '#e2e8f0', fontSize: 13, outline: 'none',
            }}
          >
            <option value="all">全部状态</option>
            <option value="normal">正常</option>
            <option value="over_budget">超预算</option>
            <option value="understaffed">缺编</option>
          </select>
        </div>

        {/* 部门列表 */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px', borderRadius: 14,
            background: 'rgba(30,41,59,0.4)', border: '1px dashed rgba(148,163,184,0.15)',
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
            <div style={{ color: '#94a3b8', fontSize: 15, marginBottom: 4 }}>未找到匹配的部门</div>
            <div style={{ color: '#64748b', fontSize: 13 }}>尝试修改搜索条件或筛选状态</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {filtered.map(dept => {
              const budgetUsage = dept.budget > 0 ? (dept.usedBudget / dept.budget) * 100 : 0;
              const targetRate = dept.monthlyTarget > 0 ? (dept.achievedTarget / dept.monthlyTarget) * 100 : 0;
              const isSelected = selectedDept === dept.id;

              return (
                <div
                  key={dept.id}
                  onClick={() => setSelectedDept(isSelected ? null : dept.id)}
                  style={{
                    padding: 18, borderRadius: 14, cursor: 'pointer',
                    background: 'rgba(30,41,59,0.8)',
                    border: `1px solid ${isSelected ? 'rgba(99,102,241,0.4)' : 'rgba(148,163,184,0.12)'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{dept.name}</div>
                    <span style={{
                      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                      color: DEPARTMENT_STATUS_COLORS[dept.status],
                      background: `${DEPARTMENT_STATUS_COLORS[dept.status]}20`,
                      border: `1px solid ${DEPARTMENT_STATUS_COLORS[dept.status]}30`,
                    }}>
                      {DEPARTMENT_STATUS_LABELS[dept.status]}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                    <div><span style={{ color: '#64748b' }}>负责人：</span><span style={{ color: '#e2e8f0' }}>{dept.head}</span></div>
                    <div><span style={{ color: '#64748b' }}>成员：</span><span style={{ color: '#e2e8f0' }}>{dept.memberCount} 人</span></div>
                    <div><span style={{ color: '#64748b' }}>预算：</span><span style={{ color: '#4ade80' }}>{formatCurrency(dept.budget)}</span></div>
                    <div><span style={{ color: '#64748b' }}>使用：</span><span style={{ color: budgetUsage > 80 ? '#f87171' : '#e2e8f0' }}>{budgetUsage.toFixed(1)}%</span></div>
                    <div><span style={{ color: '#64748b' }}>月度目标：</span><span style={{ color: '#60a5fa' }}>{formatCurrency(dept.monthlyTarget)}</span></div>
                    <div><span style={{ color: '#64748b' }}>达成率：</span><span style={{ color: targetRate >= 90 ? '#34d399' : targetRate >= 70 ? '#fbbf24' : '#f87171' }}>{targetRate.toFixed(1)}%</span></div>
                  </div>

                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>预算使用进度</div>
                    <div style={{ height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.15)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(budgetUsage, 100)}%`, height: '100%',
                        borderRadius: 3, background: budgetUsage > 80 ? '#f87171' : '#60a5fa',
                        transition: 'width 0.3s',
                      }} />
                    </div>
                  </div>

                  {/* 展开成员详情 */}
                  {isSelected && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>部门成员</div>
                      {dept.members.map(m => (
                        <div key={m.id} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.06)',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#e2e8f0', fontSize: 13 }}>{m.name}</span>
                            <span style={{ color: '#64748b', fontSize: 11 }}>{m.role}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: m.performance >= 90 ? '#34d399' : m.performance >= 70 ? '#fbbf24' : '#f87171', fontSize: 12, fontWeight: 600 }}>
                              {m.performance}分
                            </span>
                            <MemberStatusBadge status={m.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 底部统计 */}
        <div style={{
          marginTop: 16, padding: '12px 16px', borderRadius: 10,
          background: 'rgba(30,41,59,0.4)', border: '1px solid rgba(148,163,184,0.08)',
          display: 'flex', justifyContent: 'space-between',
          color: '#64748b', fontSize: 12,
        }}>
          <span>共 {filtered.length} 个部门</span>
          <span>月度目标总计 {formatCurrency(stats.totalTarget)} · 已达成 {formatCurrency(stats.totalAchieved)}</span>
        </div>
      </div>
    </main>
  );
}

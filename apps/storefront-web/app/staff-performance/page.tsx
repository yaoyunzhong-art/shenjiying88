/**
 * 员工绩效看板页 — Staff Performance Dashboard (Next.js App Router Page)
 * 角色视角: 👔店长
 * 功能: 员工销售业绩、服务评分、考勤数据，搜索/排序/状态筛选 + 加载/错误/空三态 + 统计摘要
 */
import React from 'react';
import { StaffPerformanceClient } from './staff-performance-client';

/* ==========================================
   员工绩效数据类型定义
   ========================================== */

/** 员工绩效记录 */
export interface StaffPerformanceRecord {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  /** 本月销售额（元） */
  salesAmount: number;
  /** 销售额目标完成率 (%) */
  salesTargetRate: number;
  /** 服务评分 (1-5) */
  serviceScore: number;
  /** 本月出勤天数 */
  attendanceDays: number;
  /** 当月应出勤天数 */
  requiredDays: number;
  /** 客单价（元） */
  avgOrderValue: number;
  /** 转化率 (%) */
  conversionRate: number;
  /** 处理客诉数 */
  complaints: number;
  /** 本月新增会员数 */
  newMembers: number;
  /** 绩效等级 */
  grade: 'A' | 'B' | 'C' | 'D';
  /** 入店时间 */
  joinDate: string;
  /** 备注 */
  remark?: string;
}

/* ==========================================
   Mock 数据
   ========================================== */

const MOCK_RECORDS: StaffPerformanceRecord[] = [
  {
    id: 'sp-001', name: '张伟', role: '高级导购',
    salesAmount: 85600, salesTargetRate: 142, serviceScore: 4.9,
    attendanceDays: 24, requiredDays: 26, avgOrderValue: 580,
    conversionRate: 38, complaints: 0, newMembers: 18,
    grade: 'A', joinDate: '2024-03-15',
  },
  {
    id: 'sp-002', name: '李娜', role: '导购',
    salesAmount: 62300, salesTargetRate: 115, serviceScore: 4.7,
    attendanceDays: 25, requiredDays: 26, avgOrderValue: 420,
    conversionRate: 32, complaints: 1, newMembers: 12,
    grade: 'A', joinDate: '2024-06-01',
  },
  {
    id: 'sp-003', name: '王强', role: '导购',
    salesAmount: 42100, salesTargetRate: 93, serviceScore: 4.3,
    attendanceDays: 22, requiredDays: 26, avgOrderValue: 350,
    conversionRate: 28, complaints: 2, newMembers: 8,
    grade: 'B', joinDate: '2024-09-10',
  },
  {
    id: 'sp-004', name: '赵敏', role: '实习导购',
    salesAmount: 28500, salesTargetRate: 71, serviceScore: 4.5,
    attendanceDays: 20, requiredDays: 26, avgOrderValue: 290,
    conversionRate: 22, complaints: 0, newMembers: 5,
    grade: 'C', joinDate: '2025-01-20',
  },
  {
    id: 'sp-005', name: '陈伟', role: '高级导购',
    salesAmount: 75400, salesTargetRate: 128, serviceScore: 4.8,
    attendanceDays: 24, requiredDays: 26, avgOrderValue: 510,
    conversionRate: 35, complaints: 0, newMembers: 15,
    grade: 'A', joinDate: '2023-11-05',
  },
  {
    id: 'sp-006', name: '刘洋', role: '导购',
    salesAmount: 51200, salesTargetRate: 102, serviceScore: 4.4,
    attendanceDays: 23, requiredDays: 26, avgOrderValue: 380,
    conversionRate: 30, complaints: 1, newMembers: 10,
    grade: 'B', joinDate: '2024-04-18',
  },
  {
    id: 'sp-007', name: '周丽', role: '导购',
    salesAmount: 36800, salesTargetRate: 82, serviceScore: 4.1,
    attendanceDays: 22, requiredDays: 26, avgOrderValue: 310,
    conversionRate: 25, complaints: 3, newMembers: 6,
    grade: 'C', joinDate: '2024-08-22',
  },
  {
    id: 'sp-008', name: '吴刚', role: '实习导购',
    salesAmount: 19200, salesTargetRate: 48, serviceScore: 3.8,
    attendanceDays: 18, requiredDays: 26, avgOrderValue: 220,
    conversionRate: 18, complaints: 1, newMembers: 3,
    grade: 'D', joinDate: '2025-03-01',
  },
  {
    id: 'sp-009', name: '孙丽', role: '高级导购',
    salesAmount: 92100, salesTargetRate: 153, serviceScore: 5.0,
    attendanceDays: 26, requiredDays: 26, avgOrderValue: 620,
    conversionRate: 42, complaints: 0, newMembers: 22,
    grade: 'A', joinDate: '2022-06-15',
  },
  {
    id: 'sp-010', name: '黄磊', role: '导购',
    salesAmount: 47800, salesTargetRate: 96, serviceScore: 4.2,
    attendanceDays: 21, requiredDays: 26, avgOrderValue: 340,
    conversionRate: 27, complaints: 2, newMembers: 7,
    grade: 'B', joinDate: '2024-07-01',
  },
];

/* ==========================================
   绩效摘要统计
   ========================================== */

export interface PerformanceSummary {
  totalStaff: number;
  avgSales: number;
  avgServiceScore: number;
  totalSales: number;
  aCount: number;
  bCount: number;
  cCount: number;
  dCount: number;
}

function computeSummary(records: StaffPerformanceRecord[]): PerformanceSummary {
  return {
    totalStaff: records.length,
    avgSales: Math.round(records.reduce((s, r) => s + r.salesAmount, 0) / records.length),
    avgServiceScore: parseFloat((records.reduce((s, r) => s + r.serviceScore, 0) / records.length).toFixed(1)),
    totalSales: records.reduce((s, r) => s + r.salesAmount, 0),
    aCount: records.filter(r => r.grade === 'A').length,
    bCount: records.filter(r => r.grade === 'B').length,
    cCount: records.filter(r => r.grade === 'C').length,
    dCount: records.filter(r => r.grade === 'D').length,
  };
}

/* ==========================================
   服务端页面组件 — 带三态包装
   ========================================== */

export default function StaffPerformancePage() {
  // 服务端直接传入 records，无 loading/error
  // 但我们在 JSX 中包装统计摘要
  return <StaffPerformanceClient records={MOCK_RECORDS} summary={computeSummary(MOCK_RECORDS)} />;
}

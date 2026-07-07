/**
 * 销售报表详情页 — Report Detail Page (Next.js App Router)
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 功能: 查看报表详情、重新生成(状态流转)、导出、删除
 */
import React from 'react';
import { redirect } from 'next/navigation';
import { ReportDetailClient } from './report-detail-client';

/* ── Mock 数据 ── */
const MOCK_REPORTS: Record<string, {
  id: string; title: string; type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  period: string; createdAt: string; status: 'generated' | 'generating' | 'failed' | 'expired';
  summary: string; metrics?: Record<string, string | number>; 
}> = {
  '1': {
    id: '1', title: '2026年6月25日销售日活报表', type: 'daily',
    period: '2026-06-25', createdAt: '2026-06-26 00:15', status: 'generated',
    summary: '本日销售额 ¥12,580.00，环比昨日 +8.3%，客单价 ¥286.00，成交单数 44 单。',
    metrics: { '销售额': '¥12,580.00', '客单价': '¥286.00', '订单数': '44', '转化率': '8.3%', '环比昨日': '+8.3%', '同比上周': '+2.1%' },
  },
  '2': {
    id: '2', title: '2026年第26周销售周报', type: 'weekly',
    period: '2026 W26', createdAt: '2026-06-22 00:20', status: 'generated',
    summary: '本周销售额 ¥72,360.00，环比上周 +5.1%，热销品类：护肤品、彩妆。',
    metrics: { '销售额': '¥72,360.00', '热销品类': '护肤品、彩妆', '订单数': '253', '客单价': '¥286.00', '环比上周': '+5.1%' },
  },
  '4': {
    id: '4', title: '2026年Q2季度销售报告', type: 'quarterly',
    period: '2026 Q2', createdAt: '2026-06-01 02:00', status: 'failed',
    summary: '上季度数据汇总异常，部分门店数据未同步，请重新生成。',
    metrics: {},
  },
  '5': {
    id: '5', title: '2025年销售年度总览', type: 'yearly',
    period: '2025 FY', createdAt: '2026-01-01 00:00', status: 'expired',
    summary: '2025年度总销售额 ¥4,286,500.00，同比增长 +12.3%。数据已过期，请重新生成。',
    metrics: { '总销售额': '¥4,286,500.00', '同比增长': '+12.3%', '订单总数': '15,032', '客单价': '¥285.00' },
  },
  '6': {
    id: '6', title: '618大促活动销售分析', type: 'custom',
    period: '2026-06-18 ~ 2026-06-20', createdAt: '2026-06-21 10:30', status: 'generated',
    summary: '618大促3日累计销售额 ¥85,200.00，同比去年618 +22.5%，活动转化率 8.7%。',
    metrics: { '累计销售额': '¥85,200.00', '同比去年618': '+22.5%', '活动转化率': '8.7%', '订单数': '298', '客单价': '¥286.00' },
  },
  '8': {
    id: '8', title: '2026年Q1季度销售报告', type: 'quarterly',
    period: '2026 Q1', createdAt: '2026-04-01 02:00', status: 'generated',
    summary: 'Q1总销售额 ¥1,025,800.00 达成率108%，新增会员 2,360 人。',
    metrics: { '总销售额': '¥1,025,800.00', '达成率': '108%', '新增会员': '2,360', '同比增长': '+15.2%' },
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const report = MOCK_REPORTS[id];
  if (!report) {
    redirect('/reports');
  }
  return <ReportDetailClient report={report} />;
}

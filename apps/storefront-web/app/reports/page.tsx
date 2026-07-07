/**
 * 销售报表列表页 — Reports List Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 📊运营 / 💰财务
 * 功能: 搜索、类型筛选、状态筛选、分页
 */
import React from 'react';
import { ReportsPage } from './components/ReportsPage';

/* ── Mock 数据 ── */
const MOCK_REPORTS = [
  {
    id: '1', title: '2026年6月25日销售日活报表', type: 'daily' as const,
    period: '2026-06-25', createdAt: '2026-06-26 00:15', status: 'generated' as const,
    summary: '本日销售额 ¥12,580.00，环比昨日 +8.3%，客单价 ¥286.00，成交单数 44 单。',
  },
  {
    id: '2', title: '2026年第26周销售周报', type: 'weekly' as const,
    period: '2026 W26', createdAt: '2026-06-22 00:20', status: 'generated' as const,
    summary: '本周销售额 ¥72,360.00，环比上周 +5.1%，热销品类：护肤品、彩妆。',
  },
  {
    id: '3', title: '2026年6月销售月报', type: 'monthly' as const,
    period: '2026-06', createdAt: '2026-06-26 01:00', status: 'generating' as const,
    summary: '月报正在生成中，当前已汇总 25 天数据，累计销售额 ¥318,500.00。',
  },
  {
    id: '4', title: '2026年Q2季度销售报告', type: 'quarterly' as const,
    period: '2026 Q2', createdAt: '2026-06-01 02:00', status: 'failed' as const,
    summary: '上季度数据汇总异常，部分门店数据未同步，请重新生成。',
  },
  {
    id: '5', title: '2025年销售年度总览', type: 'yearly' as const,
    period: '2025 FY', createdAt: '2026-01-01 00:00', status: 'expired' as const,
    summary: '2025年度总销售额 ¥4,286,500.00，同比增长 +12.3%。数据已过期，请重新生成。',
  },
  {
    id: '6', title: '618大促活动销售分析', type: 'custom' as const,
    period: '2026-06-18 ~ 2026-06-20', createdAt: '2026-06-21 10:30', status: 'generated' as const,
    summary: '618大促3日累计销售额 ¥85,200.00，同比去年618 +22.5%，活动转化率 8.7%。',
  },
  {
    id: '7', title: '2026年6月24日销售日活报表', type: 'daily' as const,
    period: '2026-06-24', createdAt: '2026-06-25 00:10', status: 'generated' as const,
    summary: '本日销售额 ¥11,620.00，环比昨日 +2.1%，客单价 ¥275.00，成交单数 42 单。',
  },
  {
    id: '8', title: '2026年Q1季度销售报告', type: 'quarterly' as const,
    period: '2026 Q1', createdAt: '2026-04-01 02:00', status: 'generated' as const,
    summary: 'Q1总销售额 ¥1,025,800.00 达成率108%，新增会员 2,360 人。',
  },
];

export default async function ReportsListPage() {
  return (
    <ReportsPage
      items={MOCK_REPORTS}
      total={8}
      page={1}
      pageSize={10}
    />
  );
}

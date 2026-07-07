/**
 * 公告管理列表页 — Announcements List Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 📢运营
 * 功能: 公告搜索、类型筛选、状态筛选、分页列表
 */
import React from 'react';
import { AnnouncementsPage } from './components/AnnouncementsPage';
import type { AnnouncementItem } from './components/AnnouncementsPage';

/* ── Mock 数据 ── */
const MOCK_ANNOUNCEMENTS: AnnouncementItem[] = [
  { id: '1', title: '系统升级公告 - 2026年7月1日', category: 'system', status: 'published', summary: '门店系统将于7月1日凌晨2:00-4:00进行系统升级维护', priority: 'high', publishedAt: '2026-06-29', author: '系统管理员', readCount: 12580 },
  { id: '2', title: '夏季促销活动通知', category: 'promotion', status: 'published', summary: '7月1日-7月15日全场满299减50，会员再享双倍积分', priority: 'normal', publishedAt: '2026-06-28', author: '运营部', readCount: 8430 },
  { id: '3', title: '新员工培训通知', category: 'operation', status: 'published', summary: '7月5日举办新入职员工培训，请各部门安排相关人员参加', priority: 'normal', publishedAt: '2026-06-27', author: '人事部', readCount: 3210 },
  { id: '4', title: '消防演练紧急通知', category: 'emergency', status: 'published', summary: '7月3日上午10:00将进行全店消防演练，请所有人员配合', priority: 'high', publishedAt: '2026-06-26', author: '安全部', readCount: 9870 },
  { id: '5', title: '库存盘点计划安排', category: 'operation', status: 'draft', summary: '7月中旬进行季度库存盘点，具体安排待确认', priority: 'low', publishedAt: '2026-06-30', author: '仓管部', readCount: 0 },
  { id: '6', title: '会员日优惠方案调整', category: 'promotion', status: 'draft', summary: '拟调整每月8号会员日优惠力度，增加积分兑换活动', priority: 'normal', publishedAt: '2026-06-29', author: '市场部', readCount: 0 },
  { id: '7', title: '端午节营业时间调整', category: 'operation', status: 'archived', summary: '端午节当天营业时间调整为10:00-18:00', priority: 'normal', publishedAt: '2026-06-10', author: '运营部', readCount: 12540 },
  { id: '8', title: '收银系统故障处理通知', category: 'system', status: 'archived', summary: '部分门店收银系统出现临时故障，已修复', priority: 'high', publishedAt: '2026-06-05', author: '技术部', readCount: 18920 },
];

export default async function AnnouncementsListPage() {
  return (
    <AnnouncementsPage
      items={MOCK_ANNOUNCEMENTS}
      total={MOCK_ANNOUNCEMENTS.length}
      page={1}
      pageSize={20}
    />
  );
}

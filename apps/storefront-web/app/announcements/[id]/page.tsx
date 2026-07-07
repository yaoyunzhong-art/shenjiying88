/**
 * 公告详情页 — Announcement Detail Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 📢运营
 * 功能: 公告详细信息展示、编辑入口、状态流转
 */
import React from 'react';
import { AnnouncementDetailPage } from '../components/AnnouncementDetailPage';
import type { AnnouncementDetail } from '../components/AnnouncementDetailPage';

/* ── Mock 数据 ── */
const MOCK_ANNOUNCEMENTS: Record<string, AnnouncementDetail> = {
  '1': {
    id: '1', title: '系统升级公告 - 2026年7月1日',
    category: 'system', status: 'published', priority: 'high',
    publishedAt: '2026-06-29 14:00', author: '系统管理员', readCount: 12580,
    content: `各位同事，大家好：

为了提升门店系统的稳定性和安全性，信息技术部计划对系统进行升级维护。具体安排如下：

📅 升级时间：2026年7月1日（星期三）凌晨 2:00 - 4:00

🔧 升级内容：
1. POS收银系统性能优化
2. 会员数据库安全加固
3. 库存同步模块功能升级
4. 报表系统数据处理效率提升

⚠️ 注意事项：
1. 升级期间门店系统将暂停使用，请提前完成当日数据录入
2. 升级完成后请重新登录系统，如遇异常请联系技术支持
3. 建议各门店在7月1日营业前确认系统运行正常

如有疑问，请联系信息技术部。

感谢大家的配合！`,
    attachments: [
      { name: '系统升级详细时间表.pdf', url: '#' },
      { name: '升级后操作指南.pdf', url: '#' },
    ],
  },
  '2': {
    id: '2', title: '夏季促销活动通知',
    category: 'promotion', status: 'published', priority: 'normal',
    publishedAt: '2026-06-28 10:30', author: '运营部', readCount: 8430,
    content: `各位同事：

为迎接夏季消费旺季，公司决定开展"夏日狂欢"促销活动，具体安排如下：

📅 活动时间：2026年7月1日 - 7月15日

🎯 活动内容：
1. 全场商品满299元减50元
2. 会员消费享双倍积分
3. 指定夏季新品限时8折
4. 每日前50名到店顾客赠送小样礼包

📋 执行要求：
1. 各门店需在活动开始前完成价签更换和陈列调整
2. 前台需熟悉活动规则，做好顾客引导
3. 库存不足的商品请及时补货

祝活动大卖！`,
    attachments: [
      { name: '活动海报设计稿.pdf', url: '#' },
    ],
  },
};

export default async function AnnouncementDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const announcement = MOCK_ANNOUNCEMENTS[id] ?? null;

  return <AnnouncementDetailPage announcement={announcement} />;
}

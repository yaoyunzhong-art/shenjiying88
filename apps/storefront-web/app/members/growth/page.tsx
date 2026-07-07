/**
 * 会员成长值页面 — Member Growth Points List Page (Next.js App Router Page)
 * 店长/前台视角: 查看会员成长值记录、统计卡片、分页浏览
 */
import React from 'react';
import { GrowthPage } from './components/GrowthPage';

export default function MemberGrowthListPage() {
  return (
    <GrowthPage records={[]} total={0} page={1} pageSize={20} />
  );
}

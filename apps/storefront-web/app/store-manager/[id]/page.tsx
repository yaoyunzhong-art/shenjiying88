/**
 * 店长工作台 — 门店详情页 (Store Manager Detail Page)
 * 角色视角: 👔店长
 * 类型: B-页面创建 (详情页)
 * 功能: 展示门店详细信息、编辑/删除/状态流转，含深度KPI数据
 */
import React from 'react';
import { StoreManagerDetail } from './store-manager-detail';

// ---- 类型 ----

export interface StoreDetailData {
  id: string;
  name: string;
  address: string;
  region: string;
  status: 'operating' | 'paused' | 'closed_today' | 'renovation';
  managerName: string;
  phone: string;
  openSince: string;
  area: number;
  staffCount: number;
  kpi: {
    todayRevenue: number;
    revenueTrend: number;
    todayOrders: number;
    orderTrend: number;
    avgOrderValue: number;
    avgValueTrend: number;
    monthlyKpiRate: number;
    monthlyKpiTrend: number;
    customerSatisfaction: number;
    satisfactionTrend: number;
  };
  recentAlerts: Array<{
    id: string;
    type: 'device' | 'inventory' | 'member' | 'security';
    message: string;
    severity: 'critical' | 'warning' | 'info';
    time: string;
  }>;
}

// ---- Mock 数据 ----

const STORE_DETAILS: Record<string, StoreDetailData> = {
  'store-1': {
    id: 'store-1',
    name: '朝阳旗舰店',
    address: '北京市朝阳区建国路88号',
    region: '朝阳区',
    status: 'operating',
    managerName: '张店长',
    phone: '138****8888',
    openSince: '2024-03-15',
    area: 320,
    staffCount: 12,
    kpi: {
      todayRevenue: 52800,
      revenueTrend: 5.2,
      todayOrders: 342,
      orderTrend: -1.3,
      avgOrderValue: 154.4,
      avgValueTrend: 3.1,
      monthlyKpiRate: 88,
      monthlyKpiTrend: 2.5,
      customerSatisfaction: 4.7,
      satisfactionTrend: 0.3,
    },
    recentAlerts: [
      { id: 'a1', type: 'inventory', message: '单品咖啡豆库存低于安全阈值', severity: 'warning', time: '10:45' },
      { id: 'a2', type: 'device', message: 'POS-02 打印机缺纸', severity: 'info', time: '08:15' },
    ],
  },
  'store-2': {
    id: 'store-2',
    name: '海淀中关村店',
    address: '北京市海淀区中关村大街1号',
    region: '海淀区',
    status: 'operating',
    managerName: '李店长',
    phone: '136****6666',
    openSince: '2024-06-20',
    area: 280,
    staffCount: 10,
    kpi: {
      todayRevenue: 43500,
      revenueTrend: 3.8,
      todayOrders: 310,
      orderTrend: 2.1,
      avgOrderValue: 140.3,
      avgValueTrend: 1.7,
      monthlyKpiRate: 82,
      monthlyKpiTrend: -1.2,
      customerSatisfaction: 4.5,
      satisfactionTrend: 0.1,
    },
    recentAlerts: [
      { id: 'a3', type: 'member', message: '钻石会员李先生投诉积分未到账', severity: 'critical', time: '09:30' },
      { id: 'a4', type: 'inventory', message: '饮品杯库存不足', severity: 'warning', time: '昨日' },
    ],
  },
  'store-3': {
    id: 'store-3',
    name: '西单大悦城店',
    address: '北京市西城区西单北大街120号',
    region: '西城区',
    status: 'renovation',
    managerName: '王店长',
    phone: '135****5555',
    openSince: '2024-01-10',
    area: 420,
    staffCount: 15,
    kpi: {
      todayRevenue: 0,
      revenueTrend: -100,
      todayOrders: 0,
      orderTrend: -100,
      avgOrderValue: 0,
      avgValueTrend: -100,
      monthlyKpiRate: 95,
      monthlyKpiTrend: 6.3,
      customerSatisfaction: 4.8,
      satisfactionTrend: 0.2,
    },
    recentAlerts: [
      { id: 'a5', type: 'security', message: '装修施工需安全巡检', severity: 'warning', time: '昨日' },
    ],
  },
};

export interface StoreManagerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function StoreManagerDetailPage({ params }: StoreManagerDetailPageProps) {
  const { id } = await params;
  const detail = STORE_DETAILS[id];

  if (!detail) {
    return (
      <div
        style={{
          padding: 48,
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 16,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <div>暂无数据</div>
        <div style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>未找到门店信息 (ID: {id})</div>
      </div>
    );
  }

  return <StoreManagerDetail detail={detail} />;
}

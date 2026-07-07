/**
 * 供应商管理列表页 — Suppliers Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 💳采购
 * 功能: 搜索、分类筛选、状态筛选、分页
 */
import React from 'react';
import { SuppliersPage } from './components/SuppliersPage';

/* ── Mock 数据 ── */
const MOCK_SUPPLIERS = [
  { id: '1', code: 'SUP-001', name: '广州美妆供应链有限公司', contactPerson: '李明', phone: '13800138001', email: 'liming@gzbeauty.com', category: '护肤品', status: 'active' as const, totalProducts: 48, totalAmount: 1268000, cooperationStart: '2024-01-15', updatedAt: '2026-06-25 10:32', address: '广州市白云区美妆产业园区A栋' },
  { id: '2', code: 'SUP-002', name: '上海日化贸易有限公司', contactPerson: '王芳', phone: '13900139002', email: 'wangfang@shdaily.com', category: '彩妆', status: 'active' as const, totalProducts: 36, totalAmount: 892000, cooperationStart: '2024-03-20', updatedAt: '2026-06-25 09:15', address: '上海市浦东新区外高桥保税区B座' },
  { id: '3', code: 'SUP-003', name: '杭州香氛科技有限公司', contactPerson: '张伟', phone: '13700137003', email: 'zhangwei@hzperfume.com', category: '香水', status: 'paused' as const, totalProducts: 12, totalAmount: 345000, cooperationStart: '2024-06-01', updatedAt: '2026-06-24 18:00', address: '杭州市余杭区未来科技城C座' },
  { id: '4', code: 'SUP-004', name: '深圳包材创新有限公司', contactPerson: '刘洋', phone: '13600136004', email: 'liuyang@szpackaging.com', category: '包装材料', status: 'active' as const, totalProducts: 85, totalAmount: 523000, cooperationStart: '2024-02-10', updatedAt: '2026-06-25 08:45', address: '深圳市宝安区福永街道工业园' },
  { id: '5', code: 'SUP-005', name: '韩国美妆株式会社上海代表处', contactPerson: '朴俊昊', phone: '13500135005', email: 'park@korea-beauty.com', category: '彩妆', status: 'pending' as const, totalProducts: 0, totalAmount: 0, cooperationStart: '-', updatedAt: '2026-06-26 09:00', address: '上海市长宁区虹桥开发区' },
  { id: '6', code: 'SUP-006', name: '北京草本护肤品有限公司', contactPerson: '陈静', phone: '13400134006', email: 'chenjing@bjherb.com', category: '护肤品', status: 'terminated' as const, totalProducts: 18, totalAmount: 210000, cooperationStart: '2023-09-01', updatedAt: '2026-06-20 14:00', address: '北京市大兴区生物医药基地' },
  { id: '7', code: 'SUP-007', name: '广州妆具工贸有限公司', contactPerson: '赵鹏', phone: '13300133007', email: 'zhaopeng@gzzhuangju.com', category: '美妆工具', status: 'active' as const, totalProducts: 52, totalAmount: 389000, cooperationStart: '2024-05-15', updatedAt: '2026-06-25 11:00', address: '广州市番禺区南村镇工业园' },
  { id: '8', code: 'SUP-008', name: '青岛海洋生物科技有限公司', contactPerson: '周鑫', phone: '13200132008', email: 'zhouxin@qdmarine.com', category: '护肤品', status: 'active' as const, totalProducts: 24, totalAmount: 678000, cooperationStart: '2024-07-01', updatedAt: '2026-06-23 16:20', address: '青岛市黄岛区前湾港路' },
];

export default async function SuppliersListPage() {
  return (
    <SuppliersPage
      items={MOCK_SUPPLIERS}
      total={MOCK_SUPPLIERS.length}
      page={1}
      pageSize={20}
    />
  );
}

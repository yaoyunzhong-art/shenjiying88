/**
 * 退货单管理列表页 — Returns List Page (Next.js App Router Page)
 * 角色视角: 👔店长 / 🛒客服 / 💰财务
 * 功能: 搜索、退款原因筛选、状态筛选、分页
 */
import React from 'react';
import { ReturnsPage } from './components/ReturnsPage';

/* ── Mock 数据 ── */
const MOCK_RETURNS = [
  { id: '1', orderNo: 'ORD-20260601-001', returnNo: 'RTN-20260601-001', customerName: '张小丽', customerPhone: '13800138001', productName: '焕颜精华液30ml', productSku: 'SKU-HY-001', quantity: 1, reason: '商品质量问题', amount: 298, status: 'pending' as const, createdBy: '张小丽', createdAt: '2026-06-30 14:22', updatedAt: '2026-06-30 14:22' },
  { id: '2', orderNo: 'ORD-20260605-002', returnNo: 'RTN-20260605-001', customerName: '李华', customerPhone: '13900139002', productName: '植物卸妆油150ml', productSku: 'SKU-CZ-003', quantity: 2, reason: '尺寸/规格不符', amount: 176, status: 'processing' as const, createdBy: '李华', createdAt: '2026-06-25 09:10', updatedAt: '2026-06-28 16:00' },
  { id: '3', orderNo: 'ORD-20260610-003', returnNo: 'RTN-20260610-001', customerName: '王美丽', customerPhone: '13700137003', productName: '玫瑰保湿面霜50g', productSku: 'SKU-MG-002', quantity: 1, reason: '发错商品', amount: 168, status: 'completed' as const, createdBy: '王美丽', createdAt: '2026-06-10 11:30', updatedAt: '2026-06-18 10:00' },
  { id: '4', orderNo: 'ORD-20260615-004', returnNo: 'RTN-20260615-001', customerName: '赵敏', customerPhone: '13600136004', productName: '防晒喷雾SPF50+', productSku: 'SKU-FS-001', quantity: 3, reason: '不想要了', amount: 207, status: 'pending' as const, createdBy: '赵敏', createdAt: '2026-06-15 18:45', updatedAt: '2026-06-15 18:45' },
  { id: '5', orderNo: 'ORD-20260618-005', returnNo: 'RTN-20260618-001', customerName: '孙小红', customerPhone: '13500135005', productName: '控油洁面乳120g', productSku: 'SKU-JM-002', quantity: 1, reason: '收到已损坏', amount: 89, status: 'shipped' as const, createdBy: '孙小红', createdAt: '2026-06-18 09:20', updatedAt: '2026-06-22 14:30' },
  { id: '6', orderNo: 'ORD-20260620-006', returnNo: 'RTN-20260620-001', customerName: '周芳', customerPhone: '13400134006', productName: '玻尿酸补水面膜5片装', productSku: 'SKU-MM-001', quantity: 2, reason: '商品质量问题', amount: 78, status: 'received' as const, createdBy: '周芳', createdAt: '2026-06-20 15:00', updatedAt: '2026-06-26 11:00' },
  { id: '7', orderNo: 'ORD-20260622-007', returnNo: 'RTN-20260622-001', customerName: '吴茜', customerPhone: '13300133007', productName: '眼唇卸妆液100ml', productSku: 'SKU-CZ-005', quantity: 1, reason: '商品质量问题', amount: 55, status: 'approved' as const, createdBy: '吴茜', createdAt: '2026-06-22 20:10', updatedAt: '2026-06-23 10:00' },
  { id: '8', orderNo: 'ORD-20260625-008', returnNo: 'RTN-20260625-001', customerName: '郑雨', customerPhone: '13200132008', productName: '眉笔深棕色', productSku: 'SKU-MB-003', quantity: 5, reason: '其他', amount: 45, status: 'rejected' as const, createdBy: '郑雨', createdAt: '2026-06-25 13:30', updatedAt: '2026-06-26 09:00' },
  { id: '9', orderNo: 'ORD-20260628-009', returnNo: 'RTN-20260628-001', customerName: '陈思思', customerPhone: '13100131009', productName: '月光香氛蜡烛200g', productSku: 'SKU-XF-001', quantity: 1, reason: '尺寸/规格不符', amount: 128, status: 'processing' as const, createdBy: '陈思思', createdAt: '2026-06-28 10:00', updatedAt: '2026-06-30 08:30' },
  { id: '10', orderNo: 'ORD-20260630-010', returnNo: 'RTN-20260630-001', customerName: '刘雨欣', customerPhone: '13000130010', productName: '护发精华油30ml', productSku: 'SKU-HF-002', quantity: 2, reason: '不想要了', amount: 136, status: 'pending' as const, createdBy: '刘雨欣', createdAt: '2026-06-30 09:15', updatedAt: '2026-06-30 09:15' },
];

export default function ReturnsListPage(): React.ReactElement {
  const page = 1;
  const pageSize = 10;
  return (
    <ReturnsPage
      items={MOCK_RETURNS}
      total={MOCK_RETURNS.length}
      page={page}
      pageSize={pageSize}
    />
  );
}

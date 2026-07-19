/**
 * Cashier 种子数据（开发模式）
 * 在无数据库 / 开发模式下提供演示会员数据
 */

export interface SeedMember {
  id: string;
  phone: string;
  name: string;
  memberNo: string;
  tier: string;
  points: number;
  balance: number;
}

export interface SeedTransaction {
  id: string;
  orderId: string;
  orderNo: string;
  memberId: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

export const seedMembers: SeedMember[] = [
  { id: 'mem-001', phone: '13800138001', name: '张三', memberNo: 'VIP001', tier: 'Gold', points: 1200, balance: 500 },
  { id: 'mem-002', phone: '13900139002', name: '李四', memberNo: 'VIP002', tier: 'Silver', points: 800, balance: 200 },
  { id: 'mem-003', phone: '13700137003', name: '王五', memberNo: 'VIP003', tier: 'Bronze', points: 300, balance: 1000 },
];

export const seedTransactions: SeedTransaction[] = [
  { id: 'txn-001', orderId: 'ord-001', orderNo: 'ORD20260720001', memberId: 'mem-001', amount: 158, type: 'PAID', status: 'COMPLETED', createdAt: '2026-07-20T10:00:00Z' },
  { id: 'txn-002', orderId: 'ord-002', orderNo: 'ORD20260720002', memberId: 'mem-001', amount: 299, type: 'PAID', status: 'COMPLETED', createdAt: '2026-07-20T10:30:00Z' },
  { id: 'txn-003', orderId: 'ord-003', orderNo: 'ORD20260720003', memberId: 'mem-002', amount: 50, type: 'REFUNDED', status: 'REFUNDED', createdAt: '2026-07-20T11:00:00Z' },
];

/**
 * stock-transfer/data.ts — 库存调拨数据类型与 Mock 数据
 * 角色视角: 👔品牌运营 / 📦仓库管理员 / 💳采购经理
 */

export type TransferStatus = 'draft' | 'pending' | 'approved' | 'in_transit' | 'completed' | 'cancelled';
export type TransferType = 'store_to_store' | 'warehouse_to_store' | 'store_to_warehouse';

export interface StockTransferItem {
  id: string;
  transferNo: string;
  type: TransferType;
  fromLocation: string;
  toLocation: string;
  status: TransferStatus;
  itemsCount: number;
  totalQuantity: number;
  applicant: string;
  approver: string;
  reason: string;
  appliedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export const ALL_TYPES: TransferType[] = ['store_to_store', 'warehouse_to_store', 'store_to_warehouse'];
export const ALL_STATUSES: TransferStatus[] = ['draft', 'pending', 'approved', 'in_transit', 'completed', 'cancelled'];

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  in_transit: '调拨中',
  completed: '已完成',
  cancelled: '已取消',
};

export const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  store_to_store: '门店⇄门店',
  warehouse_to_store: '仓库→门店',
  store_to_warehouse: '门店→仓库',
};

export const MOCK_TRANSFERS: StockTransferItem[] = [
  { id: '1', transferNo: 'DB-20260628-001', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '上海旗舰店', status: 'in_transit', itemsCount: 8, totalQuantity: 120, applicant: '张经理', approver: '陈主管', reason: '门店补货-洁面系列', appliedAt: '2026-06-28 08:30', completedAt: null, createdAt: '2026-06-28 08:30' },
  { id: '2', transferNo: 'DB-20260628-002', type: 'store_to_store', fromLocation: '上海旗舰店', toLocation: '北京分店', status: 'pending', itemsCount: 3, totalQuantity: 15, applicant: '李店长', approver: '', reason: '调拨热销口红品', appliedAt: '2026-06-28 09:00', completedAt: null, createdAt: '2026-06-28 09:00' },
  { id: '3', transferNo: 'DB-20260627-003', type: 'store_to_warehouse', fromLocation: '北京分店', toLocation: '中央仓库', status: 'completed', itemsCount: 5, totalQuantity: 48, applicant: '王店长', approver: '陈主管', reason: '临期品退回', appliedAt: '2026-06-27 14:00', completedAt: '2026-06-27 16:30', createdAt: '2026-06-27 14:00' },
  { id: '4', transferNo: 'DB-20260627-004', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '广州分店', status: 'approved', itemsCount: 12, totalQuantity: 200, applicant: '刘主管', approver: '陈主管', reason: '新品铺货-防晒系列', appliedAt: '2026-06-27 10:00', completedAt: null, createdAt: '2026-06-27 10:00' },
  { id: '5', transferNo: 'DB-20260626-005', type: 'store_to_store', fromLocation: '上海旗舰店', toLocation: '深圳精品店', status: 'completed', itemsCount: 2, totalQuantity: 6, applicant: '李店长', approver: '陈主管', reason: 'VIP预定取货调拨', appliedAt: '2026-06-26 11:00', completedAt: '2026-06-26 13:00', createdAt: '2026-06-26 11:00' },
  { id: '6', transferNo: 'DB-20260626-006', type: 'store_to_warehouse', fromLocation: '深圳精品店', toLocation: '中央仓库', status: 'cancelled', itemsCount: 4, totalQuantity: 35, applicant: '赵店长', approver: '', reason: '季节性商品退仓', appliedAt: '2026-06-26 09:30', completedAt: null, createdAt: '2026-06-26 09:30' },
  { id: '7', transferNo: 'DB-20260625-007', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '成都分店', status: 'draft', itemsCount: 6, totalQuantity: 90, applicant: '张经理', approver: '', reason: '月度补货计划', appliedAt: '2026-06-25 16:00', completedAt: null, createdAt: '2026-06-25 16:00' },
  { id: '8', transferNo: 'DB-20260625-008', type: 'store_to_store', fromLocation: '成都分店', toLocation: '深圳精品店', status: 'in_transit', itemsCount: 1, totalQuantity: 10, applicant: '王店长', approver: '陈主管', reason: '调拨爆款面膜', appliedAt: '2026-06-25 15:00', completedAt: null, createdAt: '2026-06-25 15:00' },
  { id: '9', transferNo: 'DB-20260624-009', type: 'warehouse_to_store', fromLocation: '中央仓库', toLocation: '深圳精品店', status: 'completed', itemsCount: 10, totalQuantity: 180, applicant: '刘主管', approver: '陈主管', reason: '店内陈列更新', appliedAt: '2026-06-24 10:00', completedAt: '2026-06-24 14:20', createdAt: '2026-06-24 10:00' },
  { id: '10', transferNo: 'DB-20260624-010', type: 'store_to_store', fromLocation: '深圳精品店', toLocation: '北京分店', status: 'completed', itemsCount: 3, totalQuantity: 24, applicant: '赵店长', approver: '陈主管', reason: '会员活动特别调拨', appliedAt: '2026-06-24 09:00', completedAt: '2026-06-24 11:00', createdAt: '2026-06-24 09:00' },
];

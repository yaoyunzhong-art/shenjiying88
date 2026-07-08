/**
 * stock-transfer-data.ts — 库存调拨共享数据定义
 * 供列表页与详情页复用
 */

export type TransferStatus = 'pending' | 'approved' | 'shipped' | 'received' | 'rejected' | 'cancelled';
export type TransferType = 'supply' | 'return' | 'move' | 'emergency';
export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

export interface StockTransferItem {
  id: string;
  transferNo: string;
  type: TransferType;
  urgency: UrgencyLevel;
  status: TransferStatus;
  sourceStore: string;
  sourceStoreName: string;
  targetStore: string;
  targetStoreName: string;
  productName: string;
  productSku: string;
  quantity: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  remark: string;
}

export const TYPE_LABEL: Record<TransferType, string> = {
  supply: '补货调拨',
  return: '退货调拨',
  move: '移库调拨',
  emergency: '紧急调拨',
};

export const STATUS_LABEL: Record<TransferStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  shipped: '已发货',
  received: '已收货',
  rejected: '已驳回',
  cancelled: '已撤销',
};

export type StatusVariant = 'success' | 'neutral' | 'warning' | 'danger';

export const STATUS_STYLE: Record<TransferStatus, StatusVariant> = {
  pending: 'warning',
  approved: 'success',
  shipped: 'neutral',
  received: 'success',
  rejected: 'danger',
  cancelled: 'neutral',
};

export const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  normal: '普通',
  urgent: '紧急',
  critical: '特急',
};

export const URGENCY_VARIANT: Record<UrgencyLevel, StatusVariant> = {
  normal: 'neutral',
  urgent: 'warning',
  critical: 'danger',
};

/** 状态流转图：当前可流转到哪些状态 */
export const STATUS_FLOW: Record<TransferStatus, TransferStatus[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['shipped', 'cancelled'],
  shipped: ['received'],
  received: [],
  rejected: [],
  cancelled: [],
};

export const TRANSFER_STATUSES: TransferStatus[] = ['pending', 'approved', 'shipped', 'received', 'rejected', 'cancelled'];
export const TRANSFER_TYPES: TransferType[] = ['supply', 'return', 'move', 'emergency'];
export const URGENCY_LEVELS: UrgencyLevel[] = ['normal', 'urgent', 'critical'];

export const MOCK_TRANSFERS: StockTransferItem[] = [
  { id: 't1', transferNo: 'TF-20260701-001', type: 'supply', urgency: 'normal', status: 'pending', sourceStore: 'S-001', sourceStoreName: '杭州银泰旗舰店', targetStore: 'S-002', targetStoreName: '杭州万象城店', productName: '焕颜精华液30ml', productSku: 'SKU-HY-001', quantity: 50, createdBy: '张三', createdAt: '2026-07-01 09:00', updatedAt: '2026-07-01 09:00', remark: '日常补货' },
  { id: 't2', transferNo: 'TF-20260701-002', type: 'emergency', urgency: 'critical', status: 'pending', sourceStore: 'WH-001', sourceStoreName: '中央仓库-华东', targetStore: 'S-003', targetStoreName: '深圳万象天地店', productName: '防晒喷雾SPF50+', productSku: 'SKU-FS-001', quantity: 200, createdBy: '李四', createdAt: '2026-07-01 08:30', updatedAt: '2026-07-01 08:30', remark: '门店紧急补货 — 618 活动库存告急' },
  { id: 't3', transferNo: 'TF-20260630-001', type: 'move', urgency: 'normal', status: 'approved', sourceStore: 'S-004', sourceStoreName: '北京三里屯店', targetStore: 'S-005', targetStoreName: '北京朝阳大悦城店', productName: '控油洁面乳120g', productSku: 'SKU-JM-002', quantity: 30, createdBy: '王五', createdAt: '2026-06-30 14:00', updatedAt: '2026-07-01 10:00', remark: '库存均衡' },
  { id: 't4', transferNo: 'TF-20260630-002', type: 'return', urgency: 'urgent', status: 'rejected', sourceStore: 'S-006', sourceStoreName: '上海陆家嘴店', targetStore: 'WH-001', targetStoreName: '中央仓库-华东', productName: '玫瑰保湿面霜50g', productSku: 'SKU-MG-002', quantity: 15, createdBy: '赵六', createdAt: '2026-06-30 11:00', updatedAt: '2026-07-01 09:00', remark: '批次质量问题需退回检验 — 驳回原因：批次号缺失' },
  { id: 't5', transferNo: 'TF-20260629-001', type: 'supply', urgency: 'normal', status: 'shipped', sourceStore: 'WH-002', sourceStoreName: '中央仓库-华南', targetStore: 'S-007', targetStoreName: '广州天河城店', productName: '玻尿酸补水面膜5片装', productSku: 'SKU-MM-001', quantity: 100, createdBy: '陈七', createdAt: '2026-06-29 16:00', updatedAt: '2026-06-30 08:00', remark: '周补货计划' },
  { id: 't6', transferNo: 'TF-20260628-001', type: 'move', urgency: 'urgent', status: 'pending', sourceStore: 'S-008', sourceStoreName: '成都太古里店', targetStore: 'S-009', targetStoreName: '重庆万象城店', productName: '眉笔深棕色', productSku: 'SKU-MB-003', quantity: 80, createdBy: '孙八', createdAt: '2026-06-28 14:00', updatedAt: '2026-06-28 14:00', remark: '新品铺货支持' },
  { id: 't7', transferNo: 'TF-20260627-001', type: 'return', urgency: 'normal', status: 'received', sourceStore: 'S-010', sourceStoreName: '武汉武商广场店', targetStore: 'WH-001', targetStoreName: '中央仓库-华东', productName: '眼唇卸妆液100ml', productSku: 'SKU-CZ-005', quantity: 10, createdBy: '周九', createdAt: '2026-06-27 10:00', updatedAt: '2026-06-30 16:00', remark: '临期商品退回' },
  { id: 't8', transferNo: 'TF-20260626-001', type: 'emergency', urgency: 'critical', status: 'shipped', sourceStore: 'WH-003', sourceStoreName: '中央仓库-华北', targetStore: 'S-011', targetStoreName: '天津南开大悦城店', productName: '月光香氛蜡烛200g', productSku: 'SKU-XF-001', quantity: 60, createdBy: '吴十', createdAt: '2026-06-26 18:00', updatedAt: '2026-06-27 06:00', remark: '新店开业紧急调配' },
  { id: 't9', transferNo: 'TF-20260625-001', type: 'supply', urgency: 'urgent', status: 'cancelled', sourceStore: 'WH-002', sourceStoreName: '中央仓库-华南', targetStore: 'S-012', targetStoreName: '厦门SM广场店', productName: '护发精华油30ml', productSku: 'SKU-HF-002', quantity: 40, createdBy: '郑十一', createdAt: '2026-06-25 09:00', updatedAt: '2026-06-26 10:00', remark: '需求取消 — 已调至其他门店' },
  { id: 't10', transferNo: 'TF-20260624-001', type: 'move', urgency: 'normal', status: 'received', sourceStore: 'S-013', sourceStoreName: '南京德基广场店', targetStore: 'S-014', targetStoreName: '苏州中心店', productName: '植物卸妆油150ml', productSku: 'SKU-CZ-003', quantity: 25, createdBy: '王十二', createdAt: '2026-06-24 13:00', updatedAt: '2026-06-26 09:00', remark: '门店间调拨' },
  { id: 't11', transferNo: 'TF-20260623-001', type: 'supply', urgency: 'normal', status: 'pending', sourceStore: 'WH-001', sourceStoreName: '中央仓库-华东', targetStore: 'S-015', targetStoreName: '宁波天一广场店', productName: '果酸焕肤精华30ml', productSku: 'SKU-GS-001', quantity: 35, createdBy: '刘十三', createdAt: '2026-06-23 11:00', updatedAt: '2026-06-23 11:00', remark: '常规补货计划' },
  { id: 't12', transferNo: 'TF-20260622-001', type: 'emergency', urgency: 'critical', status: 'pending', sourceStore: 'WH-003', sourceStoreName: '中央仓库-华北', targetStore: 'S-016', targetStoreName: '青岛万象城店', productName: '维生素C亮肤精华30ml', productSku: 'SKU-VC-001', quantity: 120, createdBy: '张十四', createdAt: '2026-06-22 15:00', updatedAt: '2026-06-22 15:00', remark: 'VIP客户批量预定急需库存' },
];

/**
 * 退换货管理 — 数据层
 * 模拟后台 API 数据，提供查询与统计
 */

type ReturnType = 'refund' | 'exchange' | 'repair';
type ReturnStatus =
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'return_received'
  | 'refund_issued'
  | 'replacement_sent'
  | 'closed';

interface ReturnItem {
  sku: string;
  name: string;
  spec: string;
  purchasedQty: number;
  returnQty: number;
  unitPrice: number;
  defective: boolean;
  reason: string;
}

interface ReturnRequest {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  memberTier?: string;
  returnType: ReturnType;
  status: ReturnStatus;
  appliedAt: string;
  handler?: string;
  remark?: string;
  items: ReturnItem[];
  refundAmount: number;
  exchangeExtra?: number;
}

/** 模拟退换货申请数据 */
export function getReturns(): ReturnRequest[] {
  return [
    {
      id: 'RET-20260708-001',
      orderNo: 'ORD-20260708-1001',
      customerName: '张明',
      customerPhone: '138****0001',
      memberTier: 'gold',
      returnType: 'refund',
      status: 'pending_review',
      appliedAt: '2026-07-08T09:15:00Z',
      refundAmount: 29900,
      items: [
        { sku: 'SKU-A001', name: '电竞椅', spec: '黑色/标准', purchasedQty: 1, returnQty: 1, unitPrice: 29900, defective: false, reason: '尺寸不合适' },
      ],
    },
    {
      id: 'RET-20260708-002',
      orderNo: 'ORD-20260708-1002',
      customerName: '李丽',
      customerPhone: '139****0002',
      memberTier: 'platinum',
      returnType: 'exchange',
      status: 'approved',
      appliedAt: '2026-07-07T14:30:00Z',
      handler: '王经理',
      remark: '同意换货，已通知仓库备货',
      refundAmount: 0,
      items: [
        { sku: 'SKU-B002', name: '机械键盘', spec: '青轴/RGB', purchasedQty: 1, returnQty: 1, unitPrice: 59900, defective: true, reason: '按键失灵' },
        { sku: 'SKU-C003', name: '鼠标垫', spec: '大号/900x400mm', purchasedQty: 1, returnQty: 1, unitPrice: 8900, defective: false, reason: '配套更换' },
      ],
    },
    {
      id: 'RET-20260708-003',
      orderNo: 'ORD-20260708-1003',
      customerName: '赵强',
      customerPhone: '136****0003',
      returnType: 'repair',
      status: 'return_received',
      appliedAt: '2026-07-06T10:00:00Z',
      handler: '李工',
      remark: '已收到返修品，检测中',
      refundAmount: 0,
      items: [
        { sku: 'SKU-D004', name: '无线耳机', spec: '白色/降噪版', purchasedQty: 1, returnQty: 1, unitPrice: 129900, defective: true, reason: '左耳无法充电' },
      ],
    },
    {
      id: 'RET-20260708-004',
      orderNo: 'ORD-20260708-1004',
      customerName: '王芳',
      customerPhone: '137****0004',
      memberTier: 'diamond',
      returnType: 'refund',
      status: 'refund_issued',
      appliedAt: '2026-07-05T16:20:00Z',
      handler: '财务-张',
      remark: '已原路退款',
      refundAmount: 45000,
      items: [
        { sku: 'SKU-E005', name: '智能手表', spec: '钛金属/46mm', purchasedQty: 1, returnQty: 1, unitPrice: 45000, defective: false, reason: '七天无理由退货' },
      ],
    },
    {
      id: 'RET-20260708-005',
      orderNo: 'ORD-20260708-1005',
      customerName: '陈伟',
      customerPhone: '158****0005',
      returnType: 'exchange',
      status: 'rejected',
      appliedAt: '2026-07-04T08:45:00Z',
      handler: '客服-刘',
      remark: '超过退换货期限（已购买45天），已电话沟通顾客',
      refundAmount: 0,
      items: [
        { sku: 'SKU-F006', name: '台灯', spec: '白色/触控调光', purchasedQty: 1, returnQty: 1, unitPrice: 19900, defective: false, reason: '觉得亮度不够' },
      ],
    },
    {
      id: 'RET-20260708-006',
      orderNo: 'ORD-20260708-1006',
      customerName: '孙梅',
      customerPhone: '159****0006',
      memberTier: 'silver',
      returnType: 'refund',
      status: 'closed',
      appliedAt: '2026-07-03T11:30:00Z',
      handler: '客服-王',
      remark: '顾客已撤销申请',
      refundAmount: 0,
      items: [
        { sku: 'SKU-G007', name: '收纳盒套装', spec: '三件套/透明', purchasedQty: 1, returnQty: 1, unitPrice: 12900, defective: false, reason: '已协商解决' },
      ],
    },
    {
      id: 'RET-20260708-007',
      orderNo: 'ORD-20260708-1007',
      customerName: '刘洋',
      customerPhone: '176****0007',
      returnType: 'repair',
      status: 'pending_review',
      appliedAt: '2026-07-08T07:00:00Z',
      refundAmount: 0,
      items: [
        { sku: 'SKU-H008', name: '咖啡机', spec: '黑色/全自动', purchasedQty: 1, returnQty: 1, unitPrice: 299900, defective: true, reason: '蒸汽棒不出蒸汽' },
      ],
    },
    {
      id: 'RET-20260708-008',
      orderNo: 'ORD-20260708-1008',
      customerName: '杨红',
      customerPhone: '182****0008',
      memberTier: 'gold',
      returnType: 'exchange',
      status: 'replacement_sent',
      appliedAt: '2026-07-02T13:15:00Z',
      handler: '库房-赵',
      remark: '已发出换货商品，快递单号 SF1234567890',
      refundAmount: 0,
      exchangeExtra: 5000,
      items: [
        { sku: 'SKU-I009', name: '显示器', spec: '27寸/4K/IPS', purchasedQty: 1, returnQty: 1, unitPrice: 249900, defective: false, reason: '换成32寸版本' },
        { sku: 'SKU-J010', name: '显示器支架', spec: '单屏/气弹簧', purchasedQty: 1, returnQty: 1, unitPrice: 25900, defective: false, reason: '配套更换' },
      ],
    },
  ];
}

/** 按状态统计 */
export function countByStatus(items: ReturnRequest[], status: ReturnStatus): number {
  return items.filter((i) => i.status === status).length;
}

/** 统计各状态 */
export function getStatusSummary(items: ReturnRequest[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const item of items) {
    summary[item.status] = (summary[item.status] ?? 0) + 1;
  }
  return summary;
}

/** 按类型统计 */
export function getTypeSummary(items: ReturnRequest[]): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const item of items) {
    summary[item.returnType] = (summary[item.returnType] ?? 0) + 1;
  }
  return summary;
}

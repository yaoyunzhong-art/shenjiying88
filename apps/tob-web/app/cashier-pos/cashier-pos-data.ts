// T106-3 CashierPOS Data Types & Mock Data
// 实战化 (P1-4): 扩展付款方式 / 会员 / 票据类型

export type OrderChannel = 'POS' | 'Web' | 'Mobile' | 'MiniApp';
export type OrderStatus = 'pending' | 'paid' | 'refunding' | 'refunded' | 'cancelled' | 'partial_refunded';
export type RefundStatus = 'pending' | 'processing' | 'completed' | 'rejected';
export type SyncState = 'pending' | 'synced' | 'failed';

// ─── 付款方式 (P1-4 与后端 PaymentMethod 对齐) ───
export type PaymentMethod = 'WECHAT' | 'ALIPAY' | 'BALANCE' | 'CASH' | 'CARD';

export interface POSItem {
  itemId: string;
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
  /** SKU (扫码录入, P1-4) */
  sku?: string;
}

export interface POSOrder {
  orderId: string;
  items: POSItem[];
  subtotal: number;
  tax: number;
  total: number;
  channel: OrderChannel;
  status: OrderStatus;
  paidAt?: string;
  offlineCreated?: boolean;
  /** 关联会员 (P1-4) */
  memberId?: string;
  /** 多笔付款 (P1-4: 拆单/部分付) */
  payments?: PaymentAllocation[];
  /** 退款记录 (P1-4) */
  refunds?: RefundRequest[];
}

// ─── 多笔付款 (P1-4 实战) ─────────────────────

export interface PaymentAllocation {
  paymentId: string;
  method: PaymentMethod;
  amountCents: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  /** 通道流水号 (微信/支付宝) */
  providerTxnId?: string;
  /** 错误原因 */
  failureReason?: string;
  /** 二维码 URL (扫码场景) */
  qrCodeUrl?: string;
  /** 过期时间 (扫码超时) */
  expiresAt?: string;
  createdAt: string;
  paidAt?: string;
}

export interface RefundRequest {
  refundId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  /** 退款关联的 paymentId (P1-4) */
  paymentId?: string;
  /** 退款方式 (原路返回, P1-4) */
  method?: PaymentMethod;
  requestedAt?: string;
  completedAt?: string;
}

export interface SyncStatus {
  pending: number;
  synced: number;
  failed: number;
}

export interface ChannelStats {
  channel: OrderChannel;
  orderCount: number;
  totalAmount: number;
}

// ─── 会员 (P1-4) ──────────────────────────────

export interface Member {
  memberId: string;
  memberNo: string;
  name: string;
  phone: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND';
  points: number;
  balanceCents: number;
  /** 折扣率 (0.95 = 95折) */
  discountRate?: number;
}

// ─── 票据 (P1-4) ──────────────────────────────

export interface Receipt {
  receiptId: string;
  orderId: string;
  /** 收银员 */
  cashier: string;
  /** 店名 */
  storeName: string;
  items: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payments: Array<{
    method: PaymentMethod;
    amountCents: number;
  }>;
  member?: Pick<Member, 'memberNo' | 'name' | 'tier' | 'points'>;
  /** 二维码 (票面扫码查询) */
  qrCode?: string;
  printedAt: string;
}

export interface ReceiptLineItem {
  name: string;
  qty: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

// ─── 商品目录 (P1-4 扫码录入) ─────────────────────

export interface Product {
  sku: string;
  name: string;
  unitPrice: number;
  category?: string;
  stock?: number;
}

// ─── 错误类型 (P1-4 错误处理) ───────────────────

export class CashierPosError extends Error {
  readonly code: string
  readonly retryable: boolean

  constructor(input: { code: string; message: string; retryable: boolean; cause?: unknown }) {
    super(input.message, input.cause ? { cause: input.cause } : undefined)
    this.name = 'CashierPosError'
    this.code = input.code
    this.retryable = input.retryable
  }
}

// ─── Mock 数据 (向后兼容 + P1-4 扩展) ─────────────

export const MOCK_POS_ORDERS: POSOrder[] = [
  {
    orderId: 'ORD-2024-001',
    items: [
      { itemId: 'ITEM-001', name: '拿铁咖啡', qty: 2, unitPrice: 28, discount: 0, sku: 'SKU-001' },
      { itemId: 'ITEM-002', name: '提拉米苏', qty: 1, unitPrice: 38, discount: 0, sku: 'SKU-002' },
    ],
    subtotal: 94,
    tax: 9.4,
    total: 103.4,
    channel: 'POS',
    status: 'paid',
    paidAt: '2024-01-15T10:30:00Z',
    payments: [
      {
        paymentId: 'PAY-001',
        method: 'WECHAT',
        amountCents: 10340,
        status: 'SUCCESS',
        providerTxnId: 'wx-tx-001',
        createdAt: '2024-01-15T10:30:00Z',
        paidAt: '2024-01-15T10:30:05Z'
      }
    ]
  },
  {
    orderId: 'ORD-2024-002',
    items: [
      { itemId: 'ITEM-003', name: '美式咖啡', qty: 1, unitPrice: 22, discount: 0 },
      { itemId: 'ITEM-004', name: '芝士蛋糕', qty: 2, unitPrice: 35, discount: 5 },
    ],
    subtotal: 92,
    tax: 9.2,
    total: 101.2,
    channel: 'Web',
    status: 'paid',
    paidAt: '2024-01-15T11:45:00Z',
  },
  {
    orderId: 'ORD-2024-003',
    items: [
      { itemId: 'ITEM-005', name: '摩卡咖啡', qty: 1, unitPrice: 32, discount: 0 },
    ],
    subtotal: 32,
    tax: 3.2,
    total: 35.2,
    channel: 'Mobile',
    status: 'refunding',
    paidAt: '2024-01-15T14:20:00Z',
  },
  {
    orderId: 'ORD-2024-004',
    items: [
      { itemId: 'ITEM-006', name: '卡布奇诺', qty: 3, unitPrice: 30, discount: 10 },
      { itemId: 'ITEM-007', name: '蓝莓松饼', qty: 1, unitPrice: 25, discount: 0 },
    ],
    subtotal: 100,
    tax: 10,
    total: 110,
    channel: 'MiniApp',
    status: 'paid',
    paidAt: '2024-01-15T16:00:00Z',
  },
  {
    orderId: 'ORD-2024-005',
    items: [
      { itemId: 'ITEM-008', name: '焦糖玛奇朵', qty: 2, unitPrice: 35, discount: 0 },
      { itemId: 'ITEM-009', name: '巧克力布朗尼', qty: 1, unitPrice: 28, discount: 0 },
    ],
    subtotal: 98,
    tax: 9.8,
    total: 107.8,
    channel: 'POS',
    status: 'pending',
    offlineCreated: true,
  },
];

export const MOCK_PENDING_REFUNDS: RefundRequest[] = [
  {
    refundId: 'REF-2024-001',
    orderId: 'ORD-2024-003',
    paymentId: 'PAY-003',
    amount: 35.2,
    reason: '商品质量问题',
    status: 'processing',
    method: 'WECHAT',
    requestedAt: '2024-01-15T15:00:00Z'
  },
  {
    refundId: 'REF-2024-002',
    orderId: 'ORD-2024-002',
    paymentId: 'PAY-002',
    amount: 50,
    reason: '顾客取消订单',
    status: 'pending',
    method: 'ALIPAY',
    requestedAt: '2024-01-15T16:00:00Z'
  },
];

export const MOCK_CHANNEL_STATS: ChannelStats[] = [
  { channel: 'POS', orderCount: 12, totalAmount: 1350.5 },
  { channel: 'Web', orderCount: 8, totalAmount: 820.3 },
  { channel: 'Mobile', orderCount: 15, totalAmount: 1680.0 },
  { channel: 'MiniApp', orderCount: 6, totalAmount: 540.8 },
];

export const MOCK_PRODUCTS: Product[] = [
  { sku: 'SKU-001', name: '拿铁咖啡', unitPrice: 28, category: '咖啡', stock: 100 },
  { sku: 'SKU-002', name: '提拉米苏', unitPrice: 38, category: '甜点', stock: 30 },
  { sku: 'SKU-003', name: '美式咖啡', unitPrice: 22, category: '咖啡', stock: 100 },
  { sku: 'SKU-004', name: '芝士蛋糕', unitPrice: 35, category: '甜点', stock: 20 },
  { sku: 'SKU-005', name: '摩卡咖啡', unitPrice: 32, category: '咖啡', stock: 100 },
  { sku: 'SKU-006', name: '卡布奇诺', unitPrice: 30, category: '咖啡', stock: 100 },
  { sku: 'SKU-007', name: '蓝莓松饼', unitPrice: 25, category: '甜点', stock: 40 },
  { sku: 'SKU-008', name: '焦糖玛奇朵', unitPrice: 35, category: '咖啡', stock: 100 },
  { sku: 'SKU-009', name: '巧克力布朗尼', unitPrice: 28, category: '甜点', stock: 30 }
];

export const MOCK_MEMBERS: Member[] = [
  {
    memberId: 'M-001',
    memberNo: 'VIP-1001',
    name: '张三',
    phone: '13800138001',
    tier: 'GOLD',
    points: 1250,
    balanceCents: 50000,
    discountRate: 0.95
  },
  {
    memberId: 'M-002',
    memberNo: 'VIP-1002',
    name: '李四',
    phone: '13800138002',
    tier: 'SILVER',
    points: 580,
    balanceCents: 20000
  },
  {
    memberId: 'M-003',
    memberNo: 'VIP-1003',
    name: '王五',
    phone: '13800138003',
    tier: 'PLATINUM',
    points: 5000,
    balanceCents: 100000,
    discountRate: 0.9
  }
];

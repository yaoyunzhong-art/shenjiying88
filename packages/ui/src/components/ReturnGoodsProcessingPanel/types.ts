'use client';

// ==================== 退换货处理面板 — 类型定义 ====================

/** 退换货类型 */
export type ReturnType = 'refund' | 'exchange' | 'repair';

/** 退换货状态 */
export type ReturnStatus =
  | 'pending_review'   // 待审核
  | 'approved'         // 已通过
  | 'rejected'         // 已拒绝
  | 'return_received'  // 已收到退货
  | 'refund_issued'    // 已退款
  | 'replacement_sent' // 已换货
  | 'closed';          // 已关闭

/** 商品明细条目 */
export interface ReturnItem {
  /** SKU */
  sku: string;
  /** 商品名 */
  name: string;
  /** 规格 */
  spec: string;
  /** 购买数量 */
  purchasedQty: number;
  /** 退货数量 */
  returnQty: number;
  /** 单价 (分) */
  unitPrice: number;
  /** 是否有瑕疵/损坏 */
  defective: boolean;
  /** 退换货原因 */
  reason: string;
}

/** 退换货申请单 */
export interface ReturnRequest {
  /** 退换单号 */
  id: string;
  /** 关联订单号 */
  orderNo: string;
  /** 客户姓名 */
  customerName: string;
  /** 客户电话 */
  customerPhone: string;
  /** 会员等级 */
  memberTier?: string;
  /** 退换货类型 */
  returnType: ReturnType;
  /** 状态 */
  status: ReturnStatus;
  /** 申请时间 */
  appliedAt: string;
  /** 处理人 */
  handler?: string;
  /** 处理备注 */
  remark?: string;
  /** 商品列表 */
  items: ReturnItem[];
  /** 退款金额 (分) */
  refundAmount: number;
  /** 换货金额 (分) — 如换更贵商品需补差价 */
  exchangeExtra?: number;
}

/** 面板配置 */
export interface ReturnGoodsPanelConfig {
  /** 标题 */
  title?: string;
  /** 是否只读 */
  readOnly?: boolean;
  /** 允许的退换货操作 */
  allowedActions?: Array<'approve' | 'reject' | 'receive' | 'issue_refund' | 'send_replacement' | 'close'>;
}

/** 组件总 Props */
export interface ReturnGoodsPanelProps {
  /** 退换货申请列表 */
  requests: ReturnRequest[];
  /** 面板配置 */
  config?: ReturnGoodsPanelConfig;
  /** 操作回调 */
  callbacks?: ReturnGoodsPanelCallbacks;
}

/** 操作回调 */
export interface ReturnGoodsPanelCallbacks {
  /** 状态流转回调 */
  onStatusChange?: (requestId: string, newStatus: ReturnStatus, remark?: string) => void;
}

import React from 'react';
/** 结账状态 */
export type CheckoutStatus = 'idle' | 'processing' | 'success' | 'failed';
/** 购物篮商品项 */
export interface BasketItem {
    id: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    image?: string;
}
/** 支付方式 */
export type PaymentMethod = 'wechat' | 'alipay' | 'cash' | 'card' | 'member_card';
/** 排队叫号项 */
export interface QueueItem {
    id: string;
    number: string;
    customerName?: string;
    type: 'service' | 'pickup' | 'return' | 'consult';
    waitingMinutes: number;
    status: 'waiting' | 'calling' | 'serving';
}
/** 快捷功能按钮 */
export interface QuickFnButton {
    key: string;
    label: string;
    icon?: string;
    highlight?: boolean;
    badge?: number;
    onClick?: () => void;
}
/** 前台操作面板 Props */
export interface FrontDeskPanelProps {
    /** 面板标题 */
    title?: string;
    /** 当前收银员 */
    cashierName?: string;
    /** 班次信息 */
    shiftInfo?: string;
    /** 购物篮商品 */
    basketItems?: BasketItem[];
    /** 结账状态 */
    checkoutStatus?: CheckoutStatus;
    /** 结账错误信息 */
    checkoutError?: string;
    /** 可用支付方式 */
    paymentMethods?: PaymentMethod[];
    /** 已选支付方式 */
    selectedPayment?: PaymentMethod;
    /** 当前排队列表 */
    queue?: QueueItem[];
    /** 快捷功能按钮 */
    quickActions?: QuickFnButton[];
    /** 今日统计 */
    todayStats?: {
        totalOrders: number;
        totalRevenue: number;
        avgCheckoutSec: number;
        pendingPickups: number;
    };
    /** 加载中 */
    loading?: boolean;
    /** 紧凑模式 */
    compact?: boolean;
    /** 结账回调 */
    onCheckout?: (method: PaymentMethod) => void;
    /** 支付方式切换回调 */
    onPaymentChange?: (method: PaymentMethod) => void;
    /** 移除商品回调 */
    onRemoveItem?: (itemId: string) => void;
    /** 清空购物篮回调 */
    onClearBasket?: () => void;
    /** 自定义类名 */
    className?: string;
}
/**
 * FrontDeskPanel — 前台操作面板
 *
 * 一站式前台收银、排队叫号、快捷操作面板。
 * 适用于零售门店前台 / 收银终端 / POS 场景。
 *
 * @example
 * <FrontDeskPanel
 *   title="前台收银台"
 *   cashierName="张丽"
 *   basketItems={[{ id: '1', name: '春季新款连衣裙', sku: 'SKU-001', quantity: 2, unitPrice: 299, subtotal: 598 }]}
 *   checkoutStatus="idle"
 *   paymentMethods={['wechat', 'alipay', 'cash', 'member_card']}
 *   selectedPayment="wechat"
 *   todayStats={{ totalOrders: 42, totalRevenue: 38650, avgCheckoutSec: 38, pendingPickups: 3 }}
 *   onCheckout={(m) => console.log('结账:', m)}
 * />
 */
export declare function FrontDeskPanel({ title, cashierName, shiftInfo, basketItems, checkoutStatus, checkoutError, paymentMethods, selectedPayment, queue, quickActions, todayStats, loading, compact, onCheckout, onPaymentChange, onRemoveItem, onClearBasket, className, }: FrontDeskPanelProps): React.JSX.Element;

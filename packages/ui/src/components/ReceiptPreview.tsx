'use client';

import React, { useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** 单行小票条目 */
export interface ReceiptLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  /** 折扣金额（正数 = 减免），默认 0 */
  discount?: number;
}

/** 支付方式 */
export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'card' | 'membership_balance' | 'other';

/** 支付记录 */
export interface ReceiptPayment {
  method: PaymentMethod;
  amount: number;
  /** 交易号（微信/支付宝/刷卡） */
  transactionId?: string;
}

/** 小票抬头信息 */
export interface ReceiptHeader {
  /** 门店名称 */
  storeName: string;
  /** 门店地址 */
  storeAddress?: string;
  /** 门店电话 */
  storePhone?: string;
  /** 自定义抬头行（如宣传语） */
  tagline?: string;
}

/** 小票完整数据 */
export interface ReceiptData {
  header: ReceiptHeader;
  /** 小票编号 */
  receiptNo: string;
  /** 收银员 */
  cashier: string;
  /** 下单时间 ISO 字符串 */
  createdAt: string;
  /** 商品明细 */
  items: ReceiptLineItem[];
  /** 支付记录 */
  payments: ReceiptPayment[];
  /** 找零金额 */
  change?: number;
  /** 备注 */
  note?: string;
  /** 会员信息（可选） */
  memberName?: string;
  memberPhone?: string;
}

export interface ReceiptPreviewProps {
  /** 小票数据 */
  data: ReceiptData;
  /** 小票宽度 px，默认 320 */
  width?: number;
  /** 额外 CSS class */
  className?: string;
  /** 测试 id */
  'data-testid'?: string;
  /** 打印回调 */
  onPrint?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金',
  wechat: '微信支付',
  alipay: '支付宝',
  card: '银行卡',
  membership_balance: '会员余额',
  other: '其他',
};

function formatCurrency(n: number): string {
  return `¥${n.toFixed(2)}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReceiptPreview({
  data,
  width = 320,
  className,
  'data-testid': testId = 'receipt-preview',
  onPrint,
}: ReceiptPreviewProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [printing, setPrinting] = useState(false);

  const subtotal = data.items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const totalDiscount = data.items.reduce((s, it) => s + (it.discount ?? 0), 0);
  const total = subtotal - totalDiscount;
  const paidTotal = data.payments.reduce((s, p) => s + p.amount, 0);

  const handlePrint = () => {
    setPrinting(true);
    // 延迟让 UI 刷新后打印
    setTimeout(() => {
      window.print();
      setPrinting(false);
      onPrint?.();
    }, 100);
  };

  return (
    <div
      data-testid={testId}
      className={className}
      style={{
        ...containerStyle,
        width,
      }}
    >
      {/* 操作栏（打印时不显示） */}
      <div style={toolbarStyle} className="no-print">
        <button
          type="button"
          style={printBtnStyle}
          onClick={handlePrint}
          disabled={printing}
          data-testid={`${testId}-print`}
        >
          {printing ? '打印中…' : '🖨️ 打印小票'}
        </button>
      </div>

      {/* 小票预览内容 */}
      <div ref={receiptRef} style={receiptPaperStyle} data-testid={`${testId}-paper`}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <div style={storeNameStyle}>{data.header.storeName}</div>
          {data.header.tagline && (
            <div style={taglineStyle}>{data.header.tagline}</div>
          )}
          {data.header.storeAddress && (
            <div style={metaStyle}>{data.header.storeAddress}</div>
          )}
          {data.header.storePhone && (
            <div style={metaStyle}>TEL: {data.header.storePhone}</div>
          )}
        </div>

        <div style={dividerStyle} />

        {/* 编号 & 收银员 */}
        <div style={rowStyle}>
          <span style={labelStyle}>小票号</span>
          <span style={valueStyle}>{data.receiptNo}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>收银员</span>
          <span style={valueStyle}>{data.cashier}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>时间</span>
          <span style={valueStyle}>{formatDateTime(data.createdAt)}</span>
        </div>

        {data.memberName && (
          <div style={rowStyle}>
            <span style={labelStyle}>会员</span>
            <span style={valueStyle}>{data.memberName} {data.memberPhone ? `(${data.memberPhone})` : ''}</span>
          </div>
        )}

        <div style={dividerStyle} />

        {/* 商品明细表头 */}
        <div style={{ ...rowStyle, fontWeight: 600, fontSize: 12 }}>
          <span style={{ flex: 1 }}>品名</span>
          <span style={{ width: 50, textAlign: 'right' }}>数量</span>
          <span style={{ width: 70, textAlign: 'right' }}>单价</span>
          <span style={{ width: 70, textAlign: 'right' }}>小计</span>
        </div>

        {/* 商品明细 */}
        {data.items.map((item, i) => {
          const lineTotal = item.unitPrice * item.quantity;
          return (
            <div key={i} style={{ ...rowStyle, fontSize: 11 }}>
              <span style={{ flex: 1, wordBreak: 'break-all', paddingRight: 4 }}>{item.name}</span>
              <span style={{ width: 50, textAlign: 'right' }}>{item.quantity}</span>
              <span style={{ width: 70, textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</span>
              <span style={{ width: 70, textAlign: 'right' }}>{formatCurrency(lineTotal)}</span>
            </div>
          );
        })}

        <div style={dividerStyle} />

        {/* 合计 */}
        <div style={rowStyle}>
          <span style={labelStyle}>小计</span>
          <span style={valueStyle}>{formatCurrency(subtotal)}</span>
        </div>
        {totalDiscount > 0 && (
          <div style={rowStyle}>
            <span style={labelStyle}>优惠</span>
            <span style={{ ...valueStyle, color: '#4ade80' }}>{`-${formatCurrency(totalDiscount)}`}</span>
          </div>
        )}
        <div style={{ ...rowStyle, fontWeight: 700, fontSize: 14 }}>
          <span style={labelStyle}>应收</span>
          <span style={valueStyle}>{formatCurrency(total)}</span>
        </div>

        <div style={dividerStyle} />

        {/* 支付信息 */}
        {data.payments.map((pmt, i) => (
          <div key={i} style={rowStyle}>
            <span style={labelStyle}>{METHOD_LABELS[pmt.method]}</span>
            <span style={valueStyle}>
              {formatCurrency(pmt.amount)}
              {pmt.transactionId ? ` (${pmt.transactionId})` : ''}
            </span>
          </div>
        ))}
        {data.change != null && data.change > 0 && (
          <div style={rowStyle}>
            <span style={labelStyle}>找零</span>
            <span style={{ ...valueStyle, color: '#fbbf24' }}>{formatCurrency(data.change)}</span>
          </div>
        )}

        {/* 备注 */}
        {data.note && (
          <>
            <div style={dividerStyle} />
            <div style={{ ...metaStyle, textAlign: 'center', fontStyle: 'italic' }}>
              {data.note}
            </div>
          </>
        )}

        <div style={dividerStyle} />

        {/* 底部 */}
        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <div style={metaStyle}>感谢您的惠顾！</div>
          <div style={{ ...metaStyle, fontSize: 10, marginTop: 4 }}>— 本小票仅供参考 —</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const toolbarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

const printBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  fontSize: 14,
  fontWeight: 500,
  border: '1px solid rgba(148,163,184,0.25)',
  borderRadius: 8,
  background: 'rgba(99,102,241,0.15)',
  color: '#a5b4fc',
  cursor: 'pointer',
};

const receiptPaperStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: 8,
  padding: '20px 16px',
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: 12,
  color: '#e2e8f0',
  lineHeight: 1.6,
};

const storeNameStyle: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 700,
  letterSpacing: 1,
};

const taglineStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  marginTop: 2,
};

const metaStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
};

const dividerStyle: React.CSSProperties = {
  borderTop: '1px dashed rgba(148,163,184,0.2)',
  margin: '8px 0',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  gap: 4,
  marginBottom: 2,
};

const labelStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
};

const valueStyle: React.CSSProperties = {
  color: '#e2e8f0',
  fontSize: 12,
  textAlign: 'right',
};

export default ReceiptPreview;
